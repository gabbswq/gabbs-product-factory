'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { ArticleDetail, Author, Tag } from '@/types/content'

async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = createClient()

  // Fetch the full article row. RLS ensures only published articles
  // are returned for the anon/authenticated roles.
  const { data: article, error } = await supabase
    .from('articles')
    .select(
      'id, title, slug, summary, content, cover_url, og_image_url, ' +
      'published_at, read_time_minutes, meta, author_id',
    )
    .eq('slug', slug)
    .single()

  if (error || !article) return null

  // Fetch tags via join table — separate query avoids PostgREST ambiguity
  // when the foreign key hint is unclear.
  const { data: tagRows } = await supabase
    .from('article_tags')
    .select('tags!article_tags_tag_id_fkey(id, name, slug)')
    .eq('article_id', article.id)

  const tags: Tag[] = (tagRows ?? [])
    .map((r) => r.tags as unknown as Tag)
    .filter(Boolean)

  // Fetch author from the public authors view (anon-readable, bio included).
  const { data: author } = await supabase
    .from('authors')
    .select('id, display_name, avatar_url, bio, website_url, twitter, linkedin')
    .eq('id', article.author_id)
    .single()

  const fallbackAuthor: Author = {
    id:          article.author_id,
    display_name: 'Autor',
    avatar_url:  null,
    bio:         null,
    website_url: null,
    twitter:     null,
    linkedin:    null,
  }

  return {
    ...article,
    tags,
    meta:   article.meta ?? {},
    author: (author as Author) ?? fallbackAuthor,
  }
}

interface UseArticleResult {
  article: ArticleDetail | null | undefined
  loading: boolean
  error: Error | null
}

/**
 * Fetches a single published article by slug on the client.
 * Primarily used for client-side navigation after an initial SSR render
 * has already loaded the page — avoids a redundant server round-trip.
 *
 * For SSR + SEO on the detail page, fetch server-side in the page component
 * and pass as a prop; use this hook only for subsequent client interactions.
 *
 * @example
 * const { article, loading } = useArticle('como-usar-ia-no-seu-negocio')
 */
export function useArticle(slug: string): UseArticleResult {
  const { data, error, isLoading } = useSWR<ArticleDetail | null>(
    slug ? ['article', slug] : null,
    () => fetchArticle(slug),
    { revalidateOnFocus: false },
  )

  return {
    article: data,
    loading: isLoading,
    error:   error ?? null,
  }
}
