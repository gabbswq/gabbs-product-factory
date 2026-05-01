import Image from 'next/image'
import type { Author } from '@/types/content'

interface Props {
  author: Author
  /** "compact" shows avatar + name inline; "full" adds bio and social links. */
  variant?: 'compact' | 'full'
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0].slice(0, 2)
  return (
    <span className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase">
      {initials}
    </span>
  )
}

function Avatar({ author, size }: { author: Author; size: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-muted"
      style={{ width: size, height: size }}
    >
      {author.avatar_url ? (
        <Image
          src={author.avatar_url}
          alt={author.display_name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <Initials name={author.display_name} />
      )}
    </div>
  )
}

export function AuthorCard({ author, variant = 'compact' }: Props) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Avatar author={author} size={32} />
        <span className="text-sm font-medium">{author.display_name}</span>
      </div>
    )
  }

  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <Avatar author={author} size={56} />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{author.display_name}</p>
        {author.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{author.bio}</p>
        )}
        {(author.twitter || author.linkedin || author.website_url) && (
          <div className="flex gap-3 pt-1 text-xs text-muted-foreground">
            {author.twitter && (
              <a
                href={`https://twitter.com/${author.twitter.replace(/^@/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Twitter
              </a>
            )}
            {author.linkedin && (
              <a
                href={author.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
            )}
            {author.website_url && (
              <a
                href={author.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Website
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
