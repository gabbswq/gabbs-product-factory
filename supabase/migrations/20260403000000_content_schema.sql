-- =============================================================================
-- Migration: Public Content Schema
-- Creates articles, pages, tags, article_tags, article_assets tables;
-- authors view; featured_articles materialized view; slugify() helper;
-- and a read_time trigger.
--
-- Depends on: 20260402000000_auth_schema (public.users, set_updated_at())
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
-- unaccent strips diacritics so "Ação" slugifies to "acao", not "a-o".
CREATE EXTENSION IF NOT EXISTS unaccent;


-- ---------------------------------------------------------------------------
-- 1. slugify(text) -> text
--    Converts any human string into a URL-safe slug.
--    IMMUTABLE so it can be used in index expressions.
--
--    Example: slugify('Olá Mundo! 2026') -> 'ola-mundo-2026'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
BEGIN
  RETURN btrim(
    regexp_replace(
      regexp_replace(
        lower(unaccent(trim(value))),
        '[^a-z0-9]+', '-', 'g'   -- any run of non-alphanumeric chars -> single hyphen
      ),
      '^-+|-+$', '', 'g'         -- strip leading/trailing hyphens
    )
  );
END;
$$;


-- ---------------------------------------------------------------------------
-- 2. articles
--    Core content table. Supports draft → scheduled → published → archived
--    lifecycle. Content is stored as raw Markdown/MDX text; rendering happens
--    in the application layer.
--
--    meta JSONB expected keys (not enforced at DB level; validated app-side):
--      meta_title TEXT, meta_description TEXT,
--      og_title TEXT, og_description TEXT
-- ---------------------------------------------------------------------------
CREATE TABLE public.articles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT        NOT NULL,
  slug              TEXT        NOT NULL,
  summary           TEXT,
  content           TEXT        NOT NULL DEFAULT '',
  cover_url         TEXT,
  author_id         UUID        NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  status            TEXT        NOT NULL DEFAULT 'draft',
  published_at      TIMESTAMPTZ,
  scheduled_at      TIMESTAMPTZ,
  read_time_minutes INT         NOT NULL DEFAULT 0,
  og_image_url      TEXT,
  meta              JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Status is a closed set; extend deliberately and update refresh logic.
  CONSTRAINT articles_status_check
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),

  -- Semantic integrity: a published article must have a publish date;
  -- a scheduled article must have a future target date.
  CONSTRAINT articles_published_requires_date
    CHECK (status <> 'published' OR published_at IS NOT NULL),
  CONSTRAINT articles_scheduled_requires_date
    CHECK (status <> 'scheduled' OR scheduled_at IS NOT NULL),

  -- Slug must be a valid URL segment: lowercase alphanum + hyphens,
  -- cannot start or end with a hyphen.
  CONSTRAINT articles_slug_format
    CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),

  CONSTRAINT articles_title_length   CHECK (char_length(title)   <= 300),
  CONSTRAINT articles_summary_length CHECK (char_length(summary) <= 500),
  CONSTRAINT articles_read_time_nonneg CHECK (read_time_minutes >= 0)
);

-- Primary lookup for public URLs: /articles/<slug>
CREATE UNIQUE INDEX articles_slug_idx
  ON public.articles (slug);

-- Used to list published articles in reverse chronological order.
-- Partial index keeps it small: only rows that are actually visible.
CREATE INDEX articles_published_feed_idx
  ON public.articles (published_at DESC NULLS LAST)
  WHERE status = 'published';

-- Used for admin dashboards filtering by status.
CREATE INDEX articles_status_idx
  ON public.articles (status);

-- Used to fetch all articles by a given author.
CREATE INDEX articles_author_id_idx
  ON public.articles (author_id);

CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3. read_time_minutes trigger
--    Recalculates whenever content changes. Assumes 200 words per minute,
--    rounds to nearest minute, minimum 1 min for any non-empty content.
--    MDX/HTML tags are counted as words; stripping them is application logic.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_read_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  trimmed  TEXT;
  wc       INT;
BEGIN
  trimmed := trim(NEW.content);

  IF trimmed = '' THEN
    NEW.read_time_minutes := 0;
  ELSE
    -- regexp_split_to_array on whitespace; array_length handles the count.
    wc := array_length(regexp_split_to_array(trimmed, '\s+'), 1);
    NEW.read_time_minutes := GREATEST(1, ROUND(wc::numeric / 200));
  END IF;

  RETURN NEW;
END;
$$;

-- Fire only when content actually changes (avoids recalculation on metadata-only updates).
CREATE TRIGGER articles_calculate_read_time
  BEFORE INSERT OR UPDATE OF content ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.calculate_read_time();


-- ---------------------------------------------------------------------------
-- 4. pages
--    Stores CMS-managed static pages (home, pricing, about, …).
--    key is the stable machine identifier used in application code.
--
--    meta JSONB expected keys: meta_title, meta_description, og_image_url
-- ---------------------------------------------------------------------------
CREATE TABLE public.pages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL DEFAULT '',
  meta       JSONB       NOT NULL DEFAULT '{}',
  is_public  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pages_key_format
    CHECK (key ~ '^[a-z0-9][a-z0-9_-]*$'),
  CONSTRAINT pages_title_length
    CHECK (char_length(title) <= 300)
);

CREATE UNIQUE INDEX pages_key_idx ON public.pages (key);

CREATE TRIGGER pages_set_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 5. tags
--    Flat tag taxonomy. Slugs are unique and used in URLs: /tag/<slug>
-- ---------------------------------------------------------------------------
CREATE TABLE public.tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tags_slug_format
    CHECK (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
  CONSTRAINT tags_name_length
    CHECK (char_length(name) <= 100)
);

-- Case-insensitive uniqueness on name prevents "AI" and "ai" coexisting.
CREATE UNIQUE INDEX tags_name_ci_idx ON public.tags (lower(name));
CREATE UNIQUE INDEX tags_slug_idx    ON public.tags (slug);


-- ---------------------------------------------------------------------------
-- 6. article_tags  (join table)
-- ---------------------------------------------------------------------------
CREATE TABLE public.article_tags (
  article_id  UUID NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.tags     (id) ON DELETE CASCADE,

  PRIMARY KEY (article_id, tag_id)
);

-- Supports reverse lookup: "all articles with tag X"
CREATE INDEX article_tags_tag_id_idx ON public.article_tags (tag_id);


-- ---------------------------------------------------------------------------
-- 7. article_assets
--    Tracks media files embedded in article content.
--    storage_path is the Supabase Storage object key, e.g.:
--      articles/<article_id>/hero.webp
--    The application builds the public URL via:
--      supabase.storage.from('article-assets').getPublicUrl(storage_path)
-- ---------------------------------------------------------------------------
CREATE TABLE public.article_assets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id   UUID        NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  mime_type    TEXT,
  alt_text     TEXT,
  width        INT         CHECK (width  > 0),
  height       INT         CHECK (height > 0),
  file_size    BIGINT      CHECK (file_size >= 0),  -- bytes
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT article_assets_storage_path_length
    CHECK (char_length(storage_path) <= 1024)
);

CREATE INDEX article_assets_article_id_idx ON public.article_assets (article_id);

-- Prevent the same storage object being registered twice for one article.
CREATE UNIQUE INDEX article_assets_path_idx
  ON public.article_assets (article_id, storage_path);


-- ---------------------------------------------------------------------------
-- 8. authors view
--    Exposes author-relevant fields from public.users, including optional
--    profile fields stored in metadata JSONB.
--
--    Expected metadata keys for authors:
--      bio TEXT, website_url TEXT, twitter TEXT, linkedin TEXT
--
--    SECURITY INVOKER (default): the view runs under the querying role so
--    existing RLS on public.users still applies. Authenticated users only
--    see their own full row; this view additionally filters to author/admin.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.authors
WITH (security_invoker = true)
AS
  SELECT
    u.id,
    u.display_name,
    u.avatar_url,
    u.metadata ->> 'bio'          AS bio,
    u.metadata ->> 'website_url'  AS website_url,
    u.metadata ->> 'twitter'      AS twitter,
    u.metadata ->> 'linkedin'     AS linkedin,
    u.created_at
  FROM public.users u
  WHERE u.role IN ('author', 'admin');

-- Public read — author bio pages are publicly visible.
GRANT SELECT ON public.authors TO anon;
GRANT SELECT ON public.authors TO authenticated;


-- ---------------------------------------------------------------------------
-- 9. featured_articles materialized view
--    Pre-joined snapshot of the 12 most recent published articles with
--    author info and tags array. Refresh explicitly after publish events
--    or on a pg_cron schedule (e.g., every 10 minutes).
--
--    Tags are aggregated into a JSONB array for efficient single-query reads
--    on the landing page; avoids N+1 queries from the application layer.
--
--    CONCURRENTLY refresh requires the unique index created below.
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW public.featured_articles AS
  SELECT
    a.id,
    a.title,
    a.slug,
    a.summary,
    a.cover_url,
    a.og_image_url,
    a.read_time_minutes,
    a.published_at,
    a.meta,
    -- Author fields denormalised to avoid join on every page render.
    u.id           AS author_id,
    u.display_name AS author_name,
    u.avatar_url   AS author_avatar,
    -- Tags aggregated as JSONB array: [{id, name, slug}, ...]
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
  JOIN public.users u ON u.id = a.author_id
  WHERE a.status = 'published'
    AND a.published_at <= now()
  ORDER BY a.published_at DESC
  LIMIT 12
WITH DATA;

-- Required for CONCURRENTLY refresh (no table locks during refresh).
CREATE UNIQUE INDEX featured_articles_id_idx ON public.featured_articles (id);

-- Public read — landing page is unauthenticated.
GRANT SELECT ON public.featured_articles TO anon;
GRANT SELECT ON public.featured_articles TO authenticated;


-- ---------------------------------------------------------------------------
-- 10. refresh_featured_articles()
--     Call this after publishing/unpublishing an article, or schedule via
--     pg_cron: SELECT cron.schedule('*/10 * * * *', 'SELECT public.refresh_featured_articles()');
--     CONCURRENTLY keeps the view readable during the refresh (no lock).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_featured_articles()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.featured_articles;
$$;
