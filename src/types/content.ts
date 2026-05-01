// ---------------------------------------------------------------------------
// Content types — mirrored from public_articles view, articles table,
// featured_articles materialized view, and authors view.
// ---------------------------------------------------------------------------

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Author {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  website_url: string | null
  twitter: string | null
  linkedin: string | null
}

/**
 * Matches the public_articles view and featured_articles materialized view.
 * Does NOT include full content — suitable for listing pages and cards.
 */
export interface ArticleSummary {
  id: string
  title: string
  slug: string
  summary: string | null
  cover_url: string | null
  og_image_url: string | null
  published_at: string       // ISO 8601 string from Postgres timestamptz
  read_time_minutes: number
  author_id: string
  // featured_articles view also includes author_name / author_avatar.
  // These fields are optional so ArticleSummary covers both sources.
  author_name?: string
  author_avatar?: string | null
  tags: Tag[]
}

/**
 * SEO meta fields stored in articles.meta JSONB.
 * All fields are optional; fall back to title/summary when absent.
 */
export interface ArticleMeta {
  meta_title?: string
  meta_description?: string
  og_title?: string
  og_description?: string
}

/**
 * Full article loaded for the detail page.
 * Fetched from the articles table (not the view) because it includes content.
 */
export interface ArticleDetail extends Omit<ArticleSummary, 'author_name' | 'author_avatar'> {
  content: string
  meta: ArticleMeta
  author: Author
}

// Pagination helper returned by useArticles.
export interface PaginatedArticles {
  articles: ArticleSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
