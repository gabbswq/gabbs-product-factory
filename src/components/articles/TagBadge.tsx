import Link from 'next/link'
import type { Tag } from '@/types/content'

interface Props {
  tag: Tag
  /** When true, renders as a plain span (no link) — useful inside article content. */
  static?: boolean
}

export function TagBadge({ tag, static: isStatic }: Props) {
  const className =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ' +
    'font-semibold transition-colors ' +
    'text-foreground hover:bg-accent hover:text-accent-foreground'

  if (isStatic) {
    return <span className={className}>{tag.name}</span>
  }

  return (
    <Link href={`/articles?tag=${tag.slug}`} className={className}>
      {tag.name}
    </Link>
  )
}
