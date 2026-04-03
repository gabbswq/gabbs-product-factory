// =============================================================================
// provision-discord Edge Function
//
// Grants a Discord role to a user after a successful purchase.
// Called internally by stripe-webhook — not exposed to the public internet.
//
// Environment variables required:
//   DISCORD_BOT_TOKEN    — Bot token with MANAGE_ROLES permission
//   DISCORD_GUILD_ID     — The server (guild) ID where roles will be granted
//   SUPABASE_URL         — injected automatically
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically
//
// Expected request body (JSON):
//   { user_id: string, discord_role_id: string }
//
// Flow:
//   1. Look up the user's Discord provider_user_id from auth_providers.
//   2. Call Discord API PATCH /guilds/{guild}/members/{discord_user}/roles/{role}.
//   3. Return 200 on success, 4xx/5xx on failure.
//
// Discord setup prerequisites:
//   - Create a Discord Application and Bot at discord.com/developers.
//   - Invite the bot to your server with the MANAGE_ROLES scope.
//   - Ensure the bot's role is positioned ABOVE the roles it will grant
//     (Discord role hierarchy requirement).
//   - Set DISCORD_BOT_TOKEN and DISCORD_GUILD_ID via `supabase secrets set`.
//
// Product metadata setup:
//   Set products.metadata.discord_role_id to the role's ID (right-click the
//   role in Discord → Copy Role ID, with Developer Mode enabled).
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2'

const DISCORD_API = 'https://discord.com/api/v10'

interface RequestBody {
  user_id:         string
  discord_role_id: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Parse and validate request body.
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { user_id, discord_role_id } = body
  if (!user_id || !discord_role_id) {
    return json({ error: 'user_id and discord_role_id are required' }, 400)
  }

  const botToken  = Deno.env.get('DISCORD_BOT_TOKEN')
  const guildId   = Deno.env.get('DISCORD_GUILD_ID')

  if (!botToken || !guildId) {
    console.error('[provision-discord] Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID')
    return json({ error: 'Discord integration not configured' }, 500)
  }

  // 1. Resolve the user's Discord ID from the auth_providers table.
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const { data: provider, error: providerErr } = await db
    .from('auth_providers')
    .select('provider_user_id')
    .eq('user_id', user_id)
    .eq('provider', 'discord')
    .maybeSingle()

  if (providerErr) {
    console.error(`[provision-discord] DB error: ${providerErr.message}`)
    return json({ error: 'Database error' }, 500)
  }

  if (!provider) {
    // User has not linked their Discord account. Log and return 200 so the
    // webhook handler does not retry — this is not a transient error.
    // A background job or UI prompt can re-trigger provisioning after the
    // user links their Discord account.
    console.warn(
      `[provision-discord] User ${user_id} has no Discord account linked. ` +
      'Role will be granted when they connect Discord.',
    )
    return json({
      granted:  false,
      reason:   'discord_not_linked',
      user_id,
    }, 200)
  }

  const discordUserId = provider.provider_user_id

  // 2. Grant the role via Discord REST API.
  //    PUT /guilds/{guild}/members/{user}/roles/{role}
  //    Returns 204 No Content on success.
  const discordRes = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${discordUserId}/roles/${discord_role_id}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        'X-Audit-Log-Reason': 'Purchase via InnovateTech',
      },
    },
  )

  if (discordRes.status === 204) {
    console.log(
      `[provision-discord] Role ${discord_role_id} granted to Discord user ${discordUserId} ` +
      `(local user ${user_id})`,
    )
    return json({ granted: true, discord_user_id: discordUserId }, 200)
  }

  // Handle known Discord API errors.
  const discordBody = await discordRes.text()
  console.error(
    `[provision-discord] Discord API error ${discordRes.status}: ${discordBody}`,
  )

  if (discordRes.status === 403) {
    // Bot lacks MANAGE_ROLES permission or its role is below the target role.
    return json({
      error:  'Discord bot permission error — check role hierarchy and bot permissions',
      status: discordRes.status,
    }, 500)
  }

  if (discordRes.status === 404) {
    // Guild, member, or role not found.
    return json({
      error:  'Discord resource not found — verify guild ID, member ID, and role ID',
      status: discordRes.status,
    }, 500)
  }

  if (discordRes.status === 429) {
    // Rate limited. Return 500 so the caller (stripe-webhook) logs a warning.
    // For production, add exponential back-off or a queue here.
    return json({ error: 'Discord rate limit exceeded', retry: true }, 500)
  }

  return json({ error: `Unexpected Discord error: ${discordRes.status}` }, 500)
})

// ---------------------------------------------------------------------------
// Utility: build a JSON Response.
// ---------------------------------------------------------------------------
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
