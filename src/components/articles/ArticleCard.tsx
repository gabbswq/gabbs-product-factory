import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ArticleSummary } from '@/types/content'
import { TagBadge } from './TagBadge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'

interface Props {
  article: ArticleSummary
}

export function ArticleCard({ article }: Props) {
  const publishedDate = format(new Date(article.published_at), "d 'de' MMMM, yyyy", {
    locale: ptBR,
  })

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* Cover image */}
      {article.cover_url && (
        <Link href={`/articles/${article.slug}`} className="block overflow-hidden">
          <div className="relative aspect-video w-full bg-muted">
            <Image
              src={article.cover_url}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </Link>
      )}

      <CardHeader className="pb-2">
        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={`/articles/${article.slug}`}>
          <h2 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h2>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.summary}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {/* Author name — from featured_articles view or fallback */}
          {(article.author_name) && (
            <span>{article.author_name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <time dateTime={article.published_at}>{publishedDate}</time>
          <span>·</span>
          <span>{article.read_time_minutes} min de leitura</span>
        </div>
      </CardFooter>
    </Card>
  )
}
