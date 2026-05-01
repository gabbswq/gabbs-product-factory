-- =============================================================================
-- Migration: RLS Policies for Public Content Tables
-- Secures articles, article_tags, article_assets, tags, and pages.
-- Creates public_articles view for safe listing reads.
--
-- Depends on:
--   20260402000000_auth_schema   (public.users, set_updated_at)
--   20260402000001_auth_rls      (is_admin())
--   20260403000000_content_schema (articles, pages, tags, …)
--
-- Policy summary:
--   anon          → published articles only
--   authenticated → own drafts + published; authors can insert/update own rows
--   admin         → full access to all rows and all fields
--   service_role  → bypasses RLS (Supabase default); used by Edge Functions
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Helper: is_author_or_admin()
--    Centralises the role check for INSERT/UPDATE guards.
--    SECURITY DEFINER + fixed search_path prevent search_path hijacking.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_author_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id   = auth.uid()
      AND role IN ('author', 'admin')
  );
$$;


-- ---------------------------------------------------------------------------
-- 2. Helper: owns_article(article_id uuid)
--    True when the calling user is the article's author.
--    Kept as a function so it can be reused by join-table policies without
--    repeating a correlated subquery.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owns_article(p_article_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.articles
    WHERE id        = p_article_id
      AND author_id = auth.uid()
  );
$$;


-- ---------------------------------------------------------------------------
-- 3. Trigger: guard_published_at()
--    Prevents non-admins from backdating or altering published_at once set.
--    RLS alone cannot compare OLD vs NEW column values, so a trigger is
--    required.
--
--    Rules:
--      - Admins can change published_at freely.
--      - Authors may SET published_at for the first time (draft → published).
--      - Authors may NOT change published_at once it is already set.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins are unrestricted.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Non-admin: raise if published_at already had a value and it changed.
  IF OLD.published_at IS NOT NULL
     AND NEW.published_at IS DISTINCT FROM OLD.published_at
  THEN
    RAISE EXCEPTION
      'published_at cannot be modified once set (requires admin role). '
      'To retract a published article, set status to ''archived'' instead.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER articles_guard_published_at
  BEFORE UPDATE OF published_at ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.guard_published_at();


-- ===========================================================================
-- 4. articles — RLS
-- ===========================================================================
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- ── SELECT ──────────────────────────────────────────────────────────────────
-- Policy A: anyone (incl. anon) may read published, non-future articles.
-- Partial-index articles_published_feed_idx makes this fast.
CREATE POLICY "articles: public can read published"
  ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (
    status       = 'published'
    AND published_at <= now()
  );

-- Policy B: authenticated authors see their own rows at any status.
-- Intentionally a separate policy (OR semantics with Policy A).
CREATE POLICY "articles: author can read own rows"
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

-- Policy C: admins see every row.
CREATE POLICY "articles: admin can read all"
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ── INSERT ──────────────────────────────────────────────────────────────────
-- Only users with role 'author' or 'admin' may create articles.
-- author_id must match the calling user — prevents impersonation.
CREATE POLICY "articles: author/admin can insert"
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_author_or_admin()
  );

-- ── UPDATE ──────────────────────────────────────────────────────────────────
-- Authors update their own rows; admins update any row.
-- The guard_published_at trigger enforces the published_at restriction
-- independently of this policy.
CREATE POLICY "articles: author can update own rows"
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (
    -- Author cannot reassign the article to another author_id.
    author_id = auth.uid()
  );

CREATE POLICY "articles: admin can update any row"
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── DELETE ──────────────────────────────────────────────────────────────────
-- Hard deletes are admin-only. Authors should archive, not delete.
CREATE POLICY "articles: admin can delete"
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ===========================================================================
-- 5. article_tags — RLS
--    Visibility follows the parent article: if you can read the article,
--    you can read its tags. owns_article() avoids a repeated subquery inline.
-- ===========================================================================
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_tags: readable if article is readable"
  ON public.article_tags
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id
        AND (
          (a.status = 'published' AND a.published_at <= now())
          OR a.author_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY "article_tags: author/admin can insert"
  ON public.article_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.owns_article(article_id)
    OR public.is_admin()
  );

CREATE POLICY "article_tags: author/admin can delete"
  ON public.article_tags
  FOR DELETE
  TO authenticated
  USING (
    public.owns_article(article_id)
    OR public.is_admin()
  );


-- ===========================================================================
-- 6. article_assets — RLS
--    Same visibility model as article_tags.
-- ===========================================================================
ALTER TABLE public.article_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_assets: readable if article is readable"
  ON public.article_assets
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id
        AND (
          (a.status = 'published' AND a.published_at <= now())
          OR a.author_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

CREATE POLICY "article_assets: author/admin can insert"
  ON public.article_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.owns_article(article_id)
    OR public.is_admin()
  );

CREATE POLICY "article_assets: author/admin can delete"
  ON public.article_assets
  FOR DELETE
  TO authenticated
  USING (
    public.owns_article(article_id)
    OR public.is_admin()
  );


-- ===========================================================================
-- 7. tags — RLS
--    Reference data: public read, admin-only write.
-- ===========================================================================
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags: public read"
  ON public.tags
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "tags: admin can insert"
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "tags: admin can update"
  ON public.tags
  FOR UPDATE
  TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "tags: admin can delete"
  ON public.tags
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ===========================================================================
-- 8. pages — RLS
--    Public pages (is_public = true) are readable by anyone.
--    Private pages require admin. All writes require admin.
-- ===========================================================================
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages: public can read public pages"
  ON public.pages
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "pages: admin can read all pages"
  ON public.pages
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "pages: admin can insert"
  ON public.pages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "pages: admin can update"
  ON public.pages
  FOR UPDATE
  TO authenticated
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "pages: admin can delete"
  ON public.pages
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ===========================================================================
-- 9. public_articles view
--    Safe listing surface for feeds, sitemaps, and landing pages.
--    Exposes only published articles and excludes sensitive internal fields
--    (meta, scheduled_at, raw content).
--
--    Full content (content TEXT) is intentionally excluded here.
--    Clients load full content by querying `articles` directly for a single
--    slug — RLS on that table controls access.
--
--    security_invoker = true: the view runs under the querying role,
--    so the RLS policies on `articles` still apply. The WHERE clause here
--    is defense-in-depth — even if the grant were misconfigured, the view
--    itself will never return non-published rows.
-- ===========================================================================
CREATE OR REPLACE VIEW public.public_articles
WITH (security_invoker = true)
AS
  SELECT
    a.id,
    a.title,
    a.slug,
    a.summary,
    a.cover_url,
    a.og_image_url,
    a.published_at,
    a.read_time_minutes,
    a.author_id,
    -- Aggregated tags: [{id, name, slug}, ...]
    -- Evaluated per-row; acceptable for listing queries up to ~hundreds of rows.
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
          ORDER BY t.name
        )
        FROM public.article_tags at2
        JOIN public.tags t ON t.id = at2.tag_id
        WHERE at2.article_id = a.id
      ),
      '[]'::jsonb
    ) AS tags
  FROM public.articles a
  WHERE a.status       = 'published'
    AND a.published_at <= now();

GRANT SELECT ON public.public_articles TO anon;
GRANT SELECT ON public.public_articles TO authenticated;
