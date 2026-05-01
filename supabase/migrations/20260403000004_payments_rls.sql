-- =============================================================================
-- Migration: RLS Policies for Payments & Products Tables
-- Secures stripe_customers, products, prices, orders, subscriptions, payments.
--
-- Depends on:
--   20260402000000_auth_schema      (public.users, set_updated_at)
--   20260402000001_auth_rls         (is_admin())
--   20260403000003_payments_schema  (all tables covered here)
--
-- Golden rules enforced by these policies:
--   1. Payment status is NEVER set by client code — only by webhooks via
--      service_role Edge Functions. Stripe is the authoritative source.
--   2. Orders are created server-side when a Checkout Session is opened —
--      never via client INSERT.
--   3. service_role bypasses all RLS automatically (Supabase default).
--      Webhook handlers must use the service_role key, not the anon key.
--   4. Absence of a client-facing INSERT/UPDATE/DELETE policy = DENY.
--      This is the default when RLS is enabled.
--
-- Subscription cancellation flow (correct pattern):
--   Client → Edge Function (JWT) → Stripe API (cancel_at_period_end=true)
--   → Stripe webhook → Edge Function (service_role) → UPDATE subscriptions
--   The client NEVER writes to the subscriptions table directly.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. stripe_customers
--    Users may read their own Stripe customer ID (e.g., to show last-4 of
--    card). All writes are service_role only (created during checkout init).
-- ---------------------------------------------------------------------------
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_customers: owner or admin can read"
  ON public.stripe_customers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- No INSERT / UPDATE / DELETE policies for client roles.
-- Writes happen exclusively via service_role in the checkout Edge Function.


-- ---------------------------------------------------------------------------
-- 2. products
--    Active products are publicly readable for the storefront.
--    Inactive (draft/archived) products are admin-only.
--    All writes are admin-only.
-- ---------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: public can read active"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "products: admin can read all"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "products: admin can insert"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "products: admin can update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "products: admin can delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ---------------------------------------------------------------------------
-- 3. prices
--    Active prices are publicly readable (needed to render pricing pages).
--    Inactive prices are admin-only (e.g., legacy plans being retired).
--    All writes are admin-only; prefer syncing via Stripe webhook
--    (product.updated / price.updated) over manual DB edits.
-- ---------------------------------------------------------------------------
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prices: public can read active"
  ON public.prices
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "prices: admin can read all"
  ON public.prices
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "prices: admin can insert"
  ON public.prices
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "prices: admin can update"
  ON public.prices
  FOR UPDATE
  TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "prices: admin can delete"
  ON public.prices
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ---------------------------------------------------------------------------
-- 4. orders
--    Users see only their own orders. Admins see all.
--    No client INSERT — orders are created server-side in the Edge Function
--    that opens the Stripe Checkout Session, using service_role.
--    Status updates come exclusively from webhook reconciliation.
--
--    user_id is nullable (guest checkout). NULL rows are invisible to all
--    client roles because NULL = auth.uid() is always false in SQL.
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: owner or admin can read"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- No INSERT / UPDATE / DELETE policies for client roles.
-- INSERT: checkout Edge Function (service_role) creates the pending order.
-- UPDATE: webhook Edge Function (service_role) reconciles status.
-- DELETE: intentionally blocked even for admins at the DB level;
--         use status = 'refunded' instead to preserve the audit trail.
--         Hard deletes must go through service_role with explicit override.


-- ---------------------------------------------------------------------------
-- 5. subscriptions
--    Users see only their own subscriptions. Admins see all.
--    All writes are service_role only (Stripe webhooks via Edge Function).
--
--    Access gating: use has_active_subscription() defined below.
--    Do NOT query this table directly from client components —
--    use the helper function to avoid leaking subscription metadata.
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: owner or admin can read"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- No INSERT / UPDATE / DELETE policies for client roles.
-- Full lifecycle is managed by Stripe webhook → Edge Function (service_role):
--   customer.subscription.created  → INSERT
--   customer.subscription.updated  → UPDATE (status, period_end, cancel_at…)
--   customer.subscription.deleted  → UPDATE status = 'canceled'


-- ---------------------------------------------------------------------------
-- 6. payments
--    Users see their own payment records (useful for receipts/history).
--    Admins see all.
--    payments is append-only: no UPDATE or DELETE policies for any role.
--    Refunds appear as new rows (status = 'refunded'), not mutations.
-- ---------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments: owner or admin can read"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- No INSERT policy for client roles.
-- Webhook handler uses: INSERT ... ON CONFLICT (stripe_event_id) DO NOTHING
-- to guarantee idempotency. Only service_role performs this INSERT.


-- ---------------------------------------------------------------------------
-- 7. Content-gating helpers
--
--    has_active_subscription(p_product_id) → boolean
--      Returns true if the calling user has a live subscription for the given
--      product. Use in RLS policies on course/lesson tables.
--
--    has_purchased(p_product_id) → boolean
--      Returns true if the calling user has a completed one-time order.
--
--    can_access_product(p_product_id) → boolean
--      Combines both checks. Use this in application-layer guards and future
--      RLS policies for gated content tables.
--
--    All functions are SECURITY DEFINER so they can read subscriptions/orders
--    even if the calling role's RLS would otherwise block access. They only
--    expose a boolean — no financial data leaks through.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.subscriptions s
    WHERE  s.user_id    = auth.uid()
      AND  s.product_id = p_product_id
      AND  s.status     IN ('active', 'trialing')
      AND  s.current_period_end > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_purchased(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.orders o
    WHERE  o.user_id    = auth.uid()
      AND  o.product_id = p_product_id
      AND  o.status     = 'completed'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_product(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_active_subscription(p_product_id)
    OR public.has_purchased(p_product_id);
$$;

-- Restrict direct execution to authenticated users only.
-- service_role can always call them (bypasses EXECUTE restrictions too).
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_purchased(uuid)           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_product(uuid)      FROM PUBLIC;

GRANT  EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.has_purchased(uuid)           TO authenticated;
GRANT  EXECUTE ON FUNCTION public.can_access_product(uuid)      TO authenticated;
