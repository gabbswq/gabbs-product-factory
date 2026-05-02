// =============================================================================
// create-checkout Edge Function
//
// Opens a Stripe Checkout Session for an authenticated user.
// Called by the frontend when the user clicks "Buy" on a product page.
//
// Environment variables required (set via `supabase secrets set`):
//   STRIPE_SECRET_KEY         — sk_live_… or sk_test_…
//   SUPABASE_URL              — injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase
//   CHECKOUT_SUCCESS_URL      — e.g. https://example.com/checkout/success?session_id={CHECKOUT_SESSION_ID}
//   CHECKOUT_CANCEL_URL       — e.g. https://example.com/checkout/cancel
//
// Request:
//   POST /functions/v1/create-checkout
//   Authorization: Bearer <supabase_user_jwt>
//   Content-Type: application/json
//   { "price_id": "<local prices.id UUID>" }
//
// Response (200):
//   { "checkout_url": "https://checkout.stripe.com/..." }
//
// Flow:
//   1. Validate Bearer JWT → resolve user_id (never trust body for this)
//   2. Validate body: price_id must be a known active price
//   3. Resolve or create Stripe Customer for the user
//   4. Create a local order with status = 'pending'
//   5. Open Stripe Checkout Session using stripe_price_id from the price row
//   6. Patch the order with the resulting stripe_session_id
//   7. Return { checkout_url }
//
// Security notes:
//   - user_id is read exclusively from the validated JWT (sub claim).
//   - success_url / cancel_url come from environment, not the client.
//   - service_role key is never logged or returned in responses.
//   - Stripe key is never logged or returned in responses.
// =============================================================================

import Stripe from 'npm:stripe@17'
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-02-24.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

function makeAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // 1. Validate Bearer JWT and resolve user identity.
  const token = bearerToken(req)
  if (!token) {
    return json({ error: 'Missing or malformed Authorization header.' }, 401)
  }

  const db = makeAdminClient()

  const { data: { user }, error: userErr } = await db.auth.getUser(token)
  if (userErr || !user) {
    return json({ error: 'Invalid or expired token.' }, 401)
  }

  const userId    = user.id
  const userEmail = user.email ?? null

  // 2. Parse and validate request body.
  let body: { price_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const priceId = body.price_id
  if (typeof priceId !== 'string' || !isUUID(priceId)) {
    return json({ error: 'price_id must be a valid UUID.' }, 400)
  }

  // 3. Fetch the active price and its parent product from the database.
  const { data: price, error: priceErr } = await db
    .from('prices')
    .select('id, stripe_price_id, amount_cents, currency, interval, product_id, products(id, title, active)')
    .eq('id', priceId)
    .eq('active', true)
    .single()

  if (priceErr || !price) {
    return json({ error: 'Price not found or inactive.' }, 404)
  }

  const product = Array.isArray(price.products) ? price.products[0] : price.products
  if (!product?.active) {
    return json({ error: 'Product is not available for purchase.' }, 404)
  }

  // 4. Resolve or create the Stripe Customer for this user.
  const stripeCustomerId = await resolveOrCreateStripeCustomer(userId, userEmail, db)

  // 5. Create a local order with status = 'pending'.
  //    The order is created before calling Stripe so that if Stripe fails,
  //    we have a record to clean up. stripe_session_id is patched in step 6.
  const { data: order, error: orderErr } = await db
    .from('orders')
    .insert({
      user_id:     userId,
      product_id:  product.id,
      price_id:    price.id,
      status:      'pending',
      total_cents: price.amount_cents,
      currency:    price.currency,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    console.error(`[create-checkout] Failed to create order for user ${userId}: ${orderErr?.message}`)
    return json({ error: 'Failed to create order. Please try again.' }, 500)
  }

  // 6. Open the Stripe Checkout Session.
  const successUrl = Deno.env.get('CHECKOUT_SUCCESS_URL')
  const cancelUrl  = Deno.env.get('CHECKOUT_CANCEL_URL')

  if (!successUrl || !cancelUrl) {
    console.error('[create-checkout] CHECKOUT_SUCCESS_URL or CHECKOUT_CANCEL_URL not set.')
    return json({ error: 'Checkout not configured.' }, 500)
  }

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      customer:            stripeCustomerId ?? undefined,
      customer_email:      stripeCustomerId ? undefined : (userEmail ?? undefined),
      client_reference_id: userId,
      line_items: [
        { price: price.stripe_price_id, quantity: 1 },
      ],
      mode:        price.interval ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata: {
        supabase_user_id: userId,
        order_id:         order.id,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[create-checkout] Stripe session creation failed: ${msg}`)
    return json({ error: 'Failed to open checkout. Please try again.' }, 502)
  }

  // 7. Patch the order with the Stripe session ID so the webhook can reconcile.
  const { error: updateErr } = await db
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id)

  if (updateErr) {
    // Non-fatal: the webhook will still match by client_reference_id + metadata.
    // Log for ops visibility but do not block the checkout flow.
    console.error(
      `[create-checkout] Failed to patch order ${order.id} with session ${session.id}: ${updateErr.message}`,
    )
  }

  return json({ checkout_url: session.url })
})

// ---------------------------------------------------------------------------
// resolveOrCreateStripeCustomer
//   Looks up an existing stripe_customers row for the user. If none exists,
//   creates a Stripe Customer via the API and persists the mapping.
//   Returns the Stripe customer ID, or null if both steps fail.
// ---------------------------------------------------------------------------
async function resolveOrCreateStripeCustomer(
  userId:    string,
  userEmail: string | null,
  db:        SupabaseClient,
): Promise<string | null> {
  // Check for an existing mapping first.
  const { data: existing } = await db
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id
  }

  // No mapping — create a new Stripe Customer.
  let customer: Stripe.Customer
  try {
    customer = await stripe.customers.create({
      email:    userEmail ?? undefined,
      metadata: { supabase_user_id: userId },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[create-checkout] Stripe customer creation failed: ${msg}`)
    return null
  }

  // Persist the mapping so future checkouts skip this step.
  const { error } = await db
    .from('stripe_customers')
    .upsert(
      { user_id: userId, stripe_customer_id: customer.id },
      { onConflict: 'user_id', ignoreDuplicates: true },
    )

  if (error) {
    // Non-fatal: the customer was created in Stripe; the mapping can be
    // re-synced from the checkout.session.completed webhook.
    console.error(`[create-checkout] Failed to persist stripe_customers: ${error.message}`)
  }

  return customer.id
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function bearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? ''
  const [scheme, token] = auth.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUUID(value: string): boolean {
  return UUID_RE.test(value)
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
