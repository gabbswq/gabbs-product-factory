-- =============================================================================
-- Migration: Payments & Products Schema
-- Tables: stripe_customers, products, prices, orders, subscriptions, payments
--
-- Depends on: 20260402000000_auth_schema (public.users, set_updated_at())
--
-- Design principles:
--   - Stripe is the source of truth for all financial data.
--   - Local tables are a reconciled mirror, updated exclusively via webhooks.
--   - Client-side code MUST NOT trust its own POST data to mark orders paid.
--   - stripe_event_id on payments is the idempotency guard for webhooks.
--   - No card or PAN data is ever stored; Stripe handles PCI compliance.
--
-- Webhook → local state flow:
--   checkout.session.completed  → orders.status = 'completed'
--   payment_intent.succeeded    → payments row upserted
--   invoice.payment_succeeded   → subscriptions.status confirmed
--   customer.subscription.*     → subscriptions row updated
--   charge.refunded             → orders/payments status = 'refunded'
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. stripe_customers
--    One row per user ↔ Stripe customer mapping.
--    Created the first time a user initiates checkout.
--    Kept separate from public.users to avoid polluting the profile table
--    with payment infrastructure concerns.
-- ---------------------------------------------------------------------------
CREATE TABLE public.stripe_customers (
  user_id            UUID        PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
  stripe_customer_id TEXT        NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT stripe_customers_customer_id_format
    CHECK (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$')
);

-- Reverse lookup: find local user from a Stripe customer ID in webhook handler.
CREATE UNIQUE INDEX stripe_customers_stripe_id_idx
  ON public.stripe_customers (stripe_customer_id);


-- ---------------------------------------------------------------------------
-- 2. products
--    Represents purchasable items: courses, memberships, roadmaps.
--
--    price_cents: a display/default price shown on marketing pages before
--    the user selects a specific plan. Authoritative pricing lives in
--    the prices table (which mirrors Stripe). Keep in sync manually or via
--    Stripe webhook (product.updated event).
--
--    stripe_product_id: Stripe's product ID (prod_xxx). Store it so the
--    admin dashboard can deep-link to Stripe and webhook handlers can
--    correlate events to local products.
-- ---------------------------------------------------------------------------
CREATE TABLE public.products (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT,
  title             TEXT        NOT NULL,
  slug              TEXT        NOT NULL,
  description       TEXT,
  product_type      TEXT        NOT NULL,
  access_type       TEXT        NOT NULL,
  price_cents       INT         NOT NULL DEFAULT 0,
  currency          TEXT        NOT NULL DEFAULT 'brl',
  active            BOOLEAN     NOT NULL DEFAULT true,
  metadata          JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT products_type_check
    CHECK (product_type IN ('course', 'membership', 'roadmap')),
  CONSTRAINT products_access_type_check
    CHECK (access_type IN ('one_time', 'subscription')),
  CONSTRAINT products_price_nonneg
    CHECK (price_cents >= 0),
  CONSTRAINT products_slug_format
    CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  CONSTRAINT products_title_length
    CHECK (char_length(title) <= 300),
  CONSTRAINT products_currency_length
    CHECK (char_length(currency) = 3)          -- ISO 4217
);

CREATE UNIQUE INDEX products_slug_idx          ON public.products (slug);
CREATE UNIQUE INDEX products_stripe_id_idx     ON public.products (stripe_product_id)
  WHERE stripe_product_id IS NOT NULL;
-- Partial index: active product listings never touch archived rows.
CREATE        INDEX products_active_type_idx   ON public.products (product_type)
  WHERE active = true;

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3. prices
--    Mirrors Stripe's price objects (price_xxx).
--    One product can have multiple prices (monthly, annual, one-time, etc.).
--    interval = NULL means a one-time payment.
--
--    Do not hard-code amount_cents in application logic; always read from
--    this table to ensure local and Stripe prices stay in sync.
-- ---------------------------------------------------------------------------
CREATE TABLE public.prices (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  stripe_price_id  TEXT        NOT NULL,
  amount_cents     INT         NOT NULL,
  currency         TEXT        NOT NULL DEFAULT 'brl',
  interval         TEXT,       -- NULL = one_time; 'month' | 'year' for recurring
  active           BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT prices_amount_nonneg
    CHECK (amount_cents >= 0),
  CONSTRAINT prices_interval_check
    CHECK (interval IS NULL OR interval IN ('day', 'week', 'month', 'year')),
  CONSTRAINT prices_currency_length
    CHECK (char_length(currency) = 3)
  -- NOTE: interval ↔ product.access_type coherence is enforced by the trigger
  -- prices_check_interval_matches_product below. PostgreSQL does not allow
  -- subqueries inside CHECK constraints, so a trigger is required here.
);

-- ---------------------------------------------------------------------------
-- Trigger: prices_check_interval_matches_product
--   Enforces: if interval IS NOT NULL, the parent product must have
--   access_type = 'subscription'. Rejects the row with a clear error message
--   on both INSERT and UPDATE so the constraint violation is auditable.
--
--   Runs BEFORE INSERT OR UPDATE so the bad row never lands in the table.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_price_interval_matches_product()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_access_type TEXT;
BEGIN
  IF NEW.interval IS NOT NULL THEN
    SELECT access_type
    INTO   v_access_type
    FROM   public.products
    WHERE  id = NEW.product_id;

    IF v_access_type IS DISTINCT FROM 'subscription' THEN
      RAISE EXCEPTION
        'prices.interval must be NULL for products with access_type = ''%''. '
        'Set interval = NULL for one-time products, or change the product access_type to ''subscription''.',
        COALESCE(v_access_type, 'unknown');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prices_check_interval_matches_product
  BEFORE INSERT OR UPDATE ON public.prices
  FOR EACH ROW EXECUTE FUNCTION public.check_price_interval_matches_product();

-- Stripe price IDs are globally unique; used by webhook handlers to look up
-- which local price an event refers to.
CREATE UNIQUE INDEX prices_stripe_id_idx  ON public.prices (stripe_price_id);
CREATE        INDEX prices_product_id_idx ON public.prices (product_id);

CREATE TRIGGER prices_set_updated_at
  BEFORE UPDATE ON public.prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 4. orders
--    One row per Stripe Checkout Session.
--    Status is set to 'pending' on creation and reconciled via webhook.
--    NEVER set status = 'completed' based on client redirect — only on
--    checkout.session.completed webhook from Stripe.
--
--    user_id: ON DELETE SET NULL preserves purchase history for accounting
--    and refund processing even if the user account is later deleted.
-- ---------------------------------------------------------------------------
CREATE TABLE public.orders (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        REFERENCES public.users    (id) ON DELETE SET NULL,
  product_id                UUID        NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  price_id                  UUID        NOT NULL REFERENCES public.prices   (id) ON DELETE RESTRICT,
  stripe_session_id         TEXT,       -- Stripe Checkout Session: cs_xxx
  stripe_payment_intent_id  TEXT,       -- pi_xxx; set after checkout.session.completed
  status                    TEXT        NOT NULL DEFAULT 'pending',
  total_cents               INT         NOT NULL,
  currency                  TEXT        NOT NULL DEFAULT 'brl',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT orders_total_nonneg
    CHECK (total_cents >= 0),
  CONSTRAINT orders_currency_length
    CHECK (char_length(currency) = 3)
);

CREATE        INDEX orders_user_id_idx         ON public.orders (user_id);
CREATE        INDEX orders_product_id_idx      ON public.orders (product_id);
-- Webhook handlers look up orders by Stripe IDs.
CREATE UNIQUE INDEX orders_stripe_session_idx  ON public.orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
CREATE UNIQUE INDEX orders_stripe_intent_idx   ON public.orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
-- Supports "pending orders older than 1 hour" cleanup job.
CREATE        INDEX orders_status_created_idx  ON public.orders (status, created_at)
  WHERE status = 'pending';

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 5. subscriptions
--    Mirrors Stripe subscription objects (sub_xxx).
--    Created/updated exclusively via webhook (customer.subscription.*).
--    Possible Stripe statuses:
--      trialing, active, past_due, canceled, unpaid,
--      incomplete, incomplete_expired
--
--    current_period_end: the authoritative access expiry date.
--    Gate content access on: status = 'active' OR status = 'trialing'
--    AND current_period_end > now().
-- ---------------------------------------------------------------------------
CREATE TABLE public.subscriptions (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES public.users    (id) ON DELETE CASCADE,
  product_id                UUID        NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  price_id                  UUID        NOT NULL REFERENCES public.prices   (id) ON DELETE RESTRICT,
  stripe_subscription_id    TEXT        NOT NULL,
  stripe_customer_id        TEXT        NOT NULL,  -- denormalised for fast Stripe API calls
  status                    TEXT        NOT NULL,
  current_period_start      TIMESTAMPTZ NOT NULL,
  current_period_end        TIMESTAMPTZ NOT NULL,
  cancel_at_period_end      BOOLEAN     NOT NULL DEFAULT false,
  canceled_at               TIMESTAMPTZ,
  trial_end                 TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT subscriptions_status_check
    CHECK (status IN (
      'trialing', 'active', 'past_due', 'canceled',
      'unpaid', 'incomplete', 'incomplete_expired'
    )),
  CONSTRAINT subscriptions_period_order
    CHECK (current_period_end > current_period_start)
);

CREATE UNIQUE INDEX subscriptions_stripe_id_idx  ON public.subscriptions (stripe_subscription_id);
CREATE        INDEX subscriptions_user_id_idx    ON public.subscriptions (user_id);
CREATE        INDEX subscriptions_product_id_idx ON public.subscriptions (product_id);
-- Used by access-gating queries: "does this user have an active subscription?"
CREATE        INDEX subscriptions_active_user_idx
  ON public.subscriptions (user_id, current_period_end)
  WHERE status IN ('active', 'trialing');

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 6. payments
--    Webhook-reconciled record of individual payment attempts.
--    One row per Stripe PaymentIntent or charge event.
--
--    stripe_event_id: the Stripe webhook event ID (evt_xxx). Store it as
--    UNIQUE to guarantee idempotency — if Stripe retries the same event,
--    the INSERT fails silently and the handler returns 200 to Stripe.
--    Pattern in webhook handler:
--
--      INSERT INTO public.payments (...) VALUES (...)
--      ON CONFLICT (stripe_event_id) DO NOTHING;
--
--    raw_event: full Stripe event JSON. Invaluable for debugging disputes,
--    refunds, and reconciliation. Consider partitioning or archiving rows
--    older than 12 months if volume is high.
--
--    user_id is nullable: payments initiated before a user session is
--    established (e.g., guest checkout) have no local user reference.
--    Reconcile post-checkout via stripe_customer_id <-> stripe_customers.
-- ---------------------------------------------------------------------------
CREATE TABLE public.payments (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        REFERENCES public.users (id) ON DELETE SET NULL,
  stripe_payment_intent_id  TEXT,       -- pi_xxx
  stripe_event_id           TEXT        NOT NULL, -- evt_xxx; idempotency key
  amount_cents              INT         NOT NULL,
  currency                  TEXT        NOT NULL DEFAULT 'brl',
  status                    TEXT        NOT NULL,
  raw_event                 JSONB       NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- No updated_at: payment records are immutable. Refunds create a new row
  -- rather than mutating the original, preserving the full audit trail.

  CONSTRAINT payments_status_check
    CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded', 'canceled')),
  CONSTRAINT payments_amount_check
    CHECK (amount_cents >= 0),
  CONSTRAINT payments_currency_length
    CHECK (char_length(currency) = 3)
);

-- Idempotency: prevents double-processing the same Stripe event.
CREATE UNIQUE INDEX payments_stripe_event_idx   ON public.payments (stripe_event_id);
-- Lookup by payment intent for order reconciliation.
CREATE        INDEX payments_stripe_intent_idx  ON public.payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
CREATE        INDEX payments_user_id_idx        ON public.payments (user_id)
  WHERE user_id IS NOT NULL;
