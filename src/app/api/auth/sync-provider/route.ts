import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const syncProviderSchema = z.object({
  provider: z.string().trim().min(1).max(64).refine((value) => value !== 'email'),
  provider_user_id: z.string().trim().min(1).max(255),
  provider_data: z.record(z.unknown()).optional().default({}),
})

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

export async function POST(request: NextRequest) {
  const token = getBearerToken(request)

  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token.' }, { status: 401 })
  }

  let payload: z.infer<typeof syncProviderSchema>

  try {
    payload = syncProviderSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid provider payload.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid bearer token.' }, { status: 401 })
  }

  const tokenProvider = user.app_metadata?.provider
  if (tokenProvider && tokenProvider !== payload.provider) {
    return NextResponse.json({ error: 'Provider does not match authenticated user.' }, { status: 403 })
  }

  const verifiedProviderUserId =
    typeof user.user_metadata?.sub === 'string' ? user.user_metadata.sub : user.id

  if (payload.provider_user_id !== verifiedProviderUserId) {
    return NextResponse.json({ error: 'Provider user does not match authenticated user.' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('auth_providers').upsert(
    {
      user_id: user.id,
      provider: payload.provider,
      provider_user_id: verifiedProviderUserId,
      provider_data: payload.provider_data,
    },
    { onConflict: 'provider,provider_user_id' },
  )

  if (error) {
    console.error('[auth/sync-provider] Failed to sync provider.', {
      user_id: user.id,
      provider: payload.provider,
      error: error.message,
    })

    return NextResponse.json({ error: 'Failed to sync provider.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
