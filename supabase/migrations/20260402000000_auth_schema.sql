-- =============================================================================
-- Migration: Authentication Schema
-- Creates public.users, auth_providers, and password_reset_tokens tables.
--
-- NOTE: public.users.id must always equal auth.users.id.
-- The trigger at the bottom auto-creates the profile row on sign-up.
-- Do NOT store plain-text passwords — Supabase Auth manages password hashing.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Shared helper: keep updated_at current on any UPDATE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------------
-- 1. public.users
--    Profile data mirroring auth.users. One row per authenticated user.
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id            UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  role          TEXT        NOT NULL DEFAULT 'user',
  metadata      JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Role is a closed enum; extend this list deliberately.
  CONSTRAINT users_role_check
    CHECK (role IN ('user', 'author', 'admin')),

  -- Basic sanity constraints on email (real validation is application-level).
  CONSTRAINT users_email_length_check
    CHECK (char_length(email) <= 255),
  CONSTRAINT users_email_format_check
    CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
);

-- Unique index enforces one profile per email address.
CREATE UNIQUE INDEX users_email_idx  ON public.users (email);
-- Supports role-based queries / RLS policies without seq scans.
CREATE        INDEX users_role_idx   ON public.users (role);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 2. public.auth_providers
--    One row per linked OAuth provider per user.
--    Allows a single user to connect multiple social accounts.
-- ---------------------------------------------------------------------------
CREATE TABLE public.auth_providers (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  provider          TEXT        NOT NULL,   -- e.g. 'google', 'discord', 'github'
  provider_user_id  TEXT        NOT NULL,   -- opaque ID from the provider
  provider_data     JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevents duplicate links for the same social account.
CREATE UNIQUE INDEX auth_providers_provider_uid_idx
  ON public.auth_providers (provider, provider_user_id);

-- Speeds up lookups of all providers for a given user.
CREATE INDEX auth_providers_user_id_idx
  ON public.auth_providers (user_id);

CREATE TRIGGER auth_providers_set_updated_at
  BEFORE UPDATE ON public.auth_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3. public.password_reset_tokens
--    Server-side token store for custom reset flows.
--    Only use this if bypassing Supabase built-in email flows.
--    IMPORTANT: store only the HASHED token here, never the raw value.
-- ---------------------------------------------------------------------------
CREATE TABLE public.password_reset_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  token       TEXT        NOT NULL,   -- bcrypt / sha256 hash of the raw token
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at: tokens are immutable after creation; rotate instead of updating.
);

-- Direct token lookup (used during reset validation).
CREATE INDEX password_reset_tokens_token_idx
  ON public.password_reset_tokens (token);

-- Find / invalidate all tokens for a user (e.g. on password change).
CREATE INDEX password_reset_tokens_user_id_idx
  ON public.password_reset_tokens (user_id);


-- ---------------------------------------------------------------------------
-- 4. Auto-provision public.users on auth.users INSERT
--    Fires after Supabase creates the auth record so the profile row
--    is always present. Reads email + raw_user_meta_data from auth.users.
--
--    Race-condition note: if a social + email sign-up arrive simultaneously
--    for the same email, the UNIQUE constraint on email will reject the
--    duplicate. Handle the resulting exception in the calling edge function
--    by re-fetching the existing row.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;  -- idempotent: safe to re-run on retries

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
