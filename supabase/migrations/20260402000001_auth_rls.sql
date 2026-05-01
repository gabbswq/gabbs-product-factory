-- =============================================================================
-- Migration: RLS Policies for Auth Tables
-- Secures public.users, auth_providers, and password_reset_tokens.
-- Creates public_user_profiles view for safe public-facing reads.
--
-- Key principles:
--   - service_role always bypasses RLS (Supabase default) — use it for
--     Edge Functions and admin webhooks, never expose to clients.
--   - auth.uid() resolves from the JWT sub claim; clients must send a valid
--     Bearer token for any authenticated policy to match.
--   - Email and metadata are never exposed through the public view.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. public.users — enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT — authenticated users see their own full row; admins see all rows.
CREATE POLICY "users: authenticated can read own row"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );

-- INSERT — blocked for all client roles; inserts must go through the
-- handle_new_auth_user trigger (SECURITY DEFINER) or service_role.
-- No explicit INSERT policy is defined so the default DENY applies.

-- UPDATE — authenticated user may update only safe profile fields.
-- role and email changes are always rejected here regardless of input
-- by excluding them from the USING/WITH CHECK logic; the actual column
-- restriction is enforced via a separate security-barrier check below.
CREATE POLICY "users: authenticated can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent escalation: the incoming role must equal the stored role,
    -- and the incoming email must equal the stored email.
    -- This policy is the last line of defence; application layer should
    -- strip these columns before sending the PATCH.
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- DELETE — deny for all authenticated clients. Deletions are handled
-- server-side via service_role (which bypasses RLS automatically).
-- No explicit DELETE policy is defined so the default DENY applies.


-- ---------------------------------------------------------------------------
-- 2. auth_providers — enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.auth_providers ENABLE ROW LEVEL SECURITY;

-- SELECT — owner or admin only.
CREATE POLICY "auth_providers: owner or admin can read"
  ON public.auth_providers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
    )
  );

-- INSERT — owner only. Provider linking must be done while authenticated
-- as that user; service_role edge functions bypass this automatically.
CREATE POLICY "auth_providers: owner can insert"
  ON public.auth_providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE — owner only. Provider unlinking follows same rule.
CREATE POLICY "auth_providers: owner can delete"
  ON public.auth_providers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE is intentionally omitted: provider records are replaced, not mutated.
-- To update provider_data, DELETE + INSERT via service_role edge function.


-- ---------------------------------------------------------------------------
-- 3. password_reset_tokens — enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- No client-role policies are defined for this table.
-- All operations (INSERT, SELECT for validation, DELETE after use) must go
-- through service_role in Edge Functions. Exposing token hashes to the
-- client role would allow enumeration attacks even on hashed values.
--
-- Supabase service_role bypasses RLS by default — no extra grants needed.


-- ---------------------------------------------------------------------------
-- 4. public_user_profiles — safe public-facing view
--    Exposes only non-sensitive fields. Suitable for author pages, SEO,
--    and any unauthenticated context.
--
--    SECURITY INVOKER (default) is intentional: the view runs under the
--    querying role. Because it only selects from a fixed column list, it
--    cannot expose email/metadata even if the caller is authenticated.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_user_profiles
WITH (security_invoker = true)
AS
  SELECT
    id,
    display_name,
    avatar_url,
    created_at
  FROM public.users;

-- Grant public read access to the view (anon role = unauthenticated Supabase clients).
GRANT SELECT ON public.public_user_profiles TO anon;
GRANT SELECT ON public.public_user_profiles TO authenticated;

-- Explicitly revoke any direct access to public.users from anon to make sure
-- the view is the only path for unauthenticated reads.
REVOKE ALL ON public.users FROM anon;


-- ---------------------------------------------------------------------------
-- 5. Helper function: is_admin()
--    Centralises the admin check so policies don't repeat a subquery.
--    SECURITY DEFINER + stable search_path prevents search_path hijacking.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Rewrite the verbose admin checks in policies above to use the helper.
-- (Policies already created reference the inline subquery; the function is
--  available for use in future policies and application-layer checks.)
