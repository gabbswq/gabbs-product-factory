'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useArticles, PAGE_SIZE } from '@/hooks/useArticles'
import { ArticleCard } from '@/components/articles/ArticleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ---------------------------------------------------------------------------
// Tag filter bar — reads available tags from Supabase once on mount.
// ---------------------------------------------------------------------------
import { createClient } from '@/lib/supabase/client'
import type { Tag } from '@/types/content'

function useAllTags() {
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    createClient()
      .from('tags')
      .select('id, name, slug')
      .order('name')
      .then(({ data }) => setTags((data as Tag[]) ?? []))
  }, [])

  return tags
}

function TagFilter({
  activeSlug,
  onChange,
}: {
  activeSlug: string
  onChange: (slug: string) => void
}) {
  const tags = useAllTags()

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('')}
        className={[
          'rounded-full border px-3 py-1 text-sm transition-colors',
          activeSlug === ''
            ? 'bg-primary text-primary-foreground border-primary'
            : 'hover:bg-muted',
        ].join(' ')}
      >
        Todos
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onChange(tag.slug)}
          className={[
            'rounded-full border px-3 py-1 text-sm transition-colors',
            activeSlug === tag.slug
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-muted',
          ].join(' ')}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pagination controls
// ---------------------------------------------------------------------------
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Próxima
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Articles index page
// Reads ?tag= and ?page= from the URL so state is shareable via link.
// ---------------------------------------------------------------------------
function ArticlesPageContent() {
  const router = useRouter()
  const params = useSearchParams()

  const tagSlug = params.get('tag') ?? ''
  const page    = Math.max(1, parseInt(params.get('page') ?? '1', 10))

  // Keep a local search value for a potential future full-text filter;
  // not wired to the hook yet — placeholder for extensibility.
  const [search, setSearch] = useState('')

  const { articles, totalPages, loading, error } = useArticles({ page, tagSlug })

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v)
        else next.delete(k)
      })
      router.push(`/articles?${next.toString()}`, { scroll: false })
    },
    [params, router],
  )

  function handleTagChange(slug: string) {
    updateParams({ tag: slug, page: '' }) // reset to page 1
  }

  function handlePageChange(p: number) {
    updateParams({ page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Artigos</h1>
        <p className="mt-2 text-muted-foreground">
          Conteúdo prático sobre automação com IA, integrações e produtividade.
        </p>
      </div>

      {/* Filter row */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TagFilter activeSlug={tagSlug} onChange={handleTagChange} />
        {/* Search — wired to state, backend integration left as next step */}
        <Input
          className="w-full sm:w-56"
          placeholder="Buscar artigos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content area */}
      {error && (
        <p className="py-20 text-center text-sm text-destructive" role="alert">
          Erro ao carregar artigos. Tente novamente.
        </p>
      )}

      {!error && !loading && articles?.length === 0 && (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Nenhum artigo encontrado
          {tagSlug ? ` com a tag "${tagSlug}"` : ''}.
        </p>
      )}

      <div
        className={[
          'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
          loading ? 'opacity-60 pointer-events-none' : '',
        ].join(' ')}
      >
        {(articles ?? []).map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}

        {/* Skeleton placeholders while loading first page */}
        {loading && (articles ?? []).length === 0 &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-xl border bg-muted animate-pulse"
            />
          ))}
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="mt-12">
          <Pagination
            page={page}
            totalPages={totalPages ?? 1}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </main>
  )
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesPageContent />
    </Suspense>
  )
}
