'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { ArticleDetail, Author, Tag } from '@/types/content'
import type { Database, Json } from '@/types/database'

type ArticleRow = Database['public']['Tables']['articles']['Row']
type ArticleTagRow = Database['public']['Tables']['article_tags']['Row']

function toArticleMeta(meta: Json | null): ArticleDetail['meta'] {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {}
  }

  return {
    meta_title: typeof meta.meta_title === 'string' ? meta.meta_title : undefined,
    meta_description:
      typeof meta.meta_description === 'string' ? meta.meta_description : undefined,
    og_title: typeof meta.og_title === 'string' ? meta.og_title : undefined,
    og_description:
      typeof meta.og_description === 'string' ? meta.og_description : undefined,
  }
}

async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = createClient()

  // Fetch the full article row. RLS ensures only published articles
  // are returned for the anon/authenticated roles.
  const { data: article, error } = await supabase
    .from('articles')
    .select('id, title, slug, summary, content, cover_url, og_image_url, published_at, read_time_minutes, meta, author_id')
    .eq('slug', slug)
    .single()
    .overrideTypes<ArticleRow, { merge: false }>()

  if (error || !article) return null

  // Fetch tags via join table — explicit queries avoid PostgREST ambiguity.
  const { data: articleTags } = await supabase
    .from('article_tags')
    .select('tag_id')
    .eq('article_id', article.id)
    .overrideTypes<Pick<ArticleTagRow, 'tag_id'>[], { merge: false }>()

  const tagIds = (articleTags ?? []).map((row) => row.tag_id)
  const { data: tagRows } = tagIds.length
    ? await supabase
        .from('tags')
        .select('id, name, slug')
        .in('id', tagIds)
        .overrideTypes<Tag[], { merge: false }>()
    : { data: [] }

  const tags: Tag[] = tagRows ?? []

  // Fetch author from the public authors view (anon-readable, bio included).
  const { data: author } = await supabase
    .from('authors')
    .select('id, display_name, avatar_url, bio, website_url, twitter, linkedin')
    .eq('id', article.author_id)
    .single()
    .overrideTypes<Author, { merge: false }>()

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
    meta:   toArticleMeta(article.meta),
    author: author ?? fallbackAuthor,
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
