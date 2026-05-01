-- =============================================================================
-- Migration: Scheduled Article Publishing Function
--
-- Depends on:
--   20260403000000_content_schema  (articles table, calculate_read_time logic)
--   20260403000001_articles_rls    (RLS policies — service_role bypasses them)
--
-- IMPORTANT — materialized view refresh:
--   publish_scheduled_articles() does NOT call refresh_featured_articles()
--   internally because REFRESH MATERIALIZED VIEW CONCURRENTLY cannot run
--   inside a function body (PostgreSQL restriction — it requires a top-level
--   transaction context).
--
--   The caller (Edge Function or pg_cron job) must issue both statements as
--   separate top-level calls:
--
--     SELECT * FROM public.publish_scheduled_articles();
--     SELECT public.refresh_featured_articles();
--
--   pg_cron example (runs every 5 minutes):
--     SELECT cron.schedule(
--       'publish-scheduled-articles',
--       '*/5 * * * *',
--       $$
--         SELECT * FROM public.publish_scheduled_articles();
--         SELECT public.refresh_featured_articles();
--       $$
--     );
--
--   Each semicolon-separated statement in pg_cron SQL runs in its own
--   implicit transaction, so CONCURRENTLY works fine there.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- publish_scheduled_articles()
--
-- Finds all articles with status = 'scheduled' AND scheduled_at <= now(),
-- transitions them to 'published', sets published_at = now(), and
-- recalculates read_time_minutes from the current content.
--
-- Returns a lightweight summary row per published article (not full content).
-- Callers that need the full row can JOIN on id after the call.
--
-- Concurrency safety:
--   SELECT ... FOR UPDATE SKIP LOCKED inside a CTE ensures that if two
--   instances run simultaneously (e.g., a cron overlap), each locks a
--   disjoint set of rows. A row already locked by session A is skipped by
--   session B rather than blocked — so both sessions complete quickly and
--   without double-publishing.
--
-- Idempotency:
--   The WHERE clause filters on status = 'scheduled', so already-published
--   rows are never touched. Calling the function when nothing is due is safe
--   and returns zero rows.
--
-- read_time recalculation:
--   The calculate_read_time() trigger fires only on UPDATE OF content.
--   Publishing changes status/published_at, not content, so the trigger
--   would not fire. This function recomputes read_time_minutes inline to
--   ensure freshness at the moment of publication.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_scheduled_articles()
RETURNS TABLE (
  id                uuid,
  slug              text,
  title             text,
  author_id         uuid,
  scheduled_at      timestamptz,
  published_at      timestamptz,
  read_time_minutes int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    -- Lock only the rows this session will process.
    -- SKIP LOCKED: rows already locked by another concurrent session are
    -- silently skipped, preventing double-publishing without deadlocks.
    SELECT a.id
    FROM   public.articles a
    WHERE  a.status       = 'scheduled'
      AND  a.scheduled_at <= now()
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.articles a
    SET
      status            = 'published',
      published_at      = now(),

      -- Inline read_time recalculation (mirrors calculate_read_time trigger).
      -- Using the current content at publish time; MDX/HTML tags are counted
      -- as words — stripping is the application layer's responsibility.
      read_time_minutes = CASE
        WHEN trim(a.content) = '' THEN 0
        ELSE GREATEST(
          1,
          ROUND(
            array_length(
              regexp_split_to_array(trim(a.content), '\s+'),
              1
            )::numeric / 200
          )
        )
      END,

      updated_at        = now()
    FROM candidates c
    WHERE a.id = c.id
    RETURNING
      a.id,
      a.slug,
      a.title,
      a.author_id,
      a.scheduled_at,
      a.published_at,
      a.read_time_minutes
  )
  SELECT
    u.id,
    u.slug,
    u.title,
    u.author_id,
    u.scheduled_at,
    u.published_at,
    u.read_time_minutes
  FROM updated u;
END;
$$;

-- Only service_role (used by Edge Functions and pg_cron) should call this.
-- Revoke from authenticated and anon to prevent client-side abuse.
REVOKE EXECUTE ON FUNCTION public.publish_scheduled_articles() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.publish_scheduled_articles() FROM authenticated;


-- ---------------------------------------------------------------------------
-- publish_article(p_article_id uuid)
--
-- Immediately publishes a single article regardless of scheduled_at.
-- Intended for manual "Publish Now" actions performed by an admin or author
-- via an Edge Function (service_role).
--
-- Raises an exception if:
--   - The article does not exist.
--   - The article is already published or archived.
--
-- Does NOT refresh the materialized view — caller must do so.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_article(p_article_id uuid)
RETURNS public.articles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
  v_result         public.articles;
BEGIN
  -- Validate existence and current state before locking.
  SELECT status
  INTO   v_current_status
  FROM   public.articles
  WHERE  id = p_article_id
  FOR UPDATE;                       -- explicit lock; no SKIP LOCKED (single row, intentional wait)

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Article % does not exist.', p_article_id;
  END IF;

  IF v_current_status IN ('published', 'archived') THEN
    RAISE EXCEPTION
      'Article % cannot be published: current status is ''%''. '
      'Only draft or scheduled articles can be published.',
      p_article_id, v_current_status;
  END IF;

  UPDATE public.articles
  SET
    status            = 'published',
    published_at      = now(),
    read_time_minutes = CASE
      WHEN trim(content) = '' THEN 0
      ELSE GREATEST(
        1,
        ROUND(
          array_length(regexp_split_to_array(trim(content), '\s+'), 1)::numeric / 200
        )
      )
    END,
    updated_at        = now()
  WHERE  id = p_article_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.publish_article(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.publish_article(uuid) FROM authenticated;


-- ---------------------------------------------------------------------------
-- unpublish_article(p_article_id uuid)
--
-- Retracts a published article by moving it to 'archived'.
-- published_at is preserved (historical record); the article simply stops
-- appearing in public queries (RLS + public_articles view filter on status).
--
-- Does NOT reset published_at to NULL — that would conflict with the
-- guard_published_at trigger and lose the publication history.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unpublish_article(p_article_id uuid)
RETURNS public.articles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.articles;
BEGIN
  UPDATE public.articles
  SET
    status     = 'archived',
    updated_at = now()
  WHERE id     = p_article_id
    AND status = 'published'
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Article % was not found in published state. '
      'Only published articles can be unpublished.',
      p_article_id;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.unpublish_article(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unpublish_article(uuid) FROM authenticated;
