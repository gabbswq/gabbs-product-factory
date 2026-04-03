import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'
import { AuthorCard } from '@/components/articles/AuthorCard'
import { TagBadge } from '@/components/articles/TagBadge'
import { ShareButtons } from '@/components/articles/ShareButtons'
import type { ArticleDetail, Author, Tag } from '@/types/content'

// Revalidate individual article pages every 5 minutes (ISR).
// After publishing or editing, call revalidatePath('/articles/[slug]') from
// the admin Edge Function for instant invalidation.
export const revalidate = 300

// ---------------------------------------------------------------------------
// Data fetching helpers (server-side, behind RLS with anon key)
// ---------------------------------------------------------------------------

async function getArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = await createClient()

  const { data: article, error } = await supabase
    .from('articles')
    .select(
      'id, title, slug, summary, content, cover_url, og_image_url, ' +
      'published_at, read_time_minutes, meta, author_id',
    )
    .eq('slug', slug)
    .single()

  if (error || !article) return null

  // Tags — separate query to avoid PostgREST FK ambiguity.
  const { data: tagRows } = await supabase
    .from('article_tags')
    .select('tags!article_tags_tag_id_fkey(id, name, slug)')
    .eq('article_id', article.id)

  const tags: Tag[] = (tagRows ?? [])
    .map((r) => r.tags as unknown as Tag)
    .filter(Boolean)

  // Author from the publicly readable authors view.
  const { data: author } = await supabase
    .from('authors')
    .select('id, display_name, avatar_url, bio, website_url, twitter, linkedin')
    .eq('id', article.author_id)
    .single()

  const fallback: Author = {
    id: article.author_id,
    display_name: 'Autor',
    avatar_url: null,
    bio: null,
    website_url: null,
    twitter: null,
    linkedin: null,
  }

  return {
    ...article,
    tags,
    meta: article.meta ?? {},
    author: (author as Author) ?? fallback,
  }
}

// ---------------------------------------------------------------------------
// generateStaticParams — pre-render the N most recent article slugs at build.
// The remaining slugs are rendered on-demand and cached via ISR.
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('public_articles')
    .select('slug')
    .order('published_at', { ascending: false })
    .limit(50)

  return (data ?? []).map(({ slug }) => ({ slug }))
}

// ---------------------------------------------------------------------------
// generateMetadata — article-specific OG tags for social sharing and SEO.
// Falls back gracefully when meta fields are absent.
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return { title: 'Artigo não encontrado' }
  }

  const { meta, title, summary, cover_url, og_image_url, published_at, author } = article

  const metaTitle       = meta.meta_title       ?? title
  const metaDescription = meta.meta_description ?? summary ?? undefined
  const ogTitle         = meta.og_title         ?? title
  const ogDescription   = meta.og_description   ?? summary ?? undefined
  const ogImage         = og_image_url ?? cover_url ?? undefined

  return {
    title:       metaTitle,
    description: metaDescription,
    openGraph: {
      type:        'article',
      title:       ogTitle,
      description: ogDescription,
      images:      ogImage ? [{ url: ogImage }] : [],
      publishedTime: published_at,
      authors:     [author.display_name],
    },
    twitter: {
      card:        'summary_large_image',
      title:       ogTitle,
      description: ogDescription,
      images:      ogImage ? [ogImage] : [],
    },
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article  = await getArticle(slug)

  if (!article) notFound()

  const {
    title, summary, cover_url, content, published_at,
    read_time_minutes, author, tags,
  } = article

  const publishedDate = format(new Date(published_at), "d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })

  const articleUrl =
    typeof window === 'undefined'
      ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/articles/${slug}`
      : window.location.href

  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight">
        {title}
      </h1>

      {/* Summary */}
      {summary && (
        <p className="mb-6 text-xl text-muted-foreground">{summary}</p>
      )}

      {/* Meta row */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <AuthorCard author={author} variant="compact" />
          <span className="text-muted-foreground">·</span>
          <time
            dateTime={published_at}
            className="text-sm text-muted-foreground"
          >
            {publishedDate}
          </time>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">
            {read_time_minutes} min de leitura
          </span>
        </div>
        <ShareButtons title={title} url={articleUrl} />
      </div>

      {/* Cover image */}
      {cover_url && (
        <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={cover_url}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      {/* Article content — rendered from Markdown/MDX source */}
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </article>

      {/* Footer: author bio + share */}
      <div className="mt-16 space-y-6 border-t pt-10">
        <AuthorCard author={author} variant="full" />
        <div className="flex items-center justify-between">
          <ShareButtons title={title} url={articleUrl} />
        </div>
      </div>
    </main>
  )
}
