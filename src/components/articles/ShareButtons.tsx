'use client'

import { useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  url?: string
}

function ShareButton({
  label,
  tooltip,
  onClick,
  children,
}: {
  label: string
  tooltip: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={onClick}
          aria-label={label}
          className="gap-1.5"
        >
          {children}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="rounded bg-foreground px-2 py-1 text-xs text-background shadow"
          sideOffset={4}
        >
          {tooltip}
          <Tooltip.Arrow className="fill-foreground" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false)

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')
  const encodedUrl   = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)

  function openPopup(href: string) {
    window.open(href, '_blank', 'width=600,height=400,noopener,noreferrer')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently ignore.
    }
  }

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Compartilhar:</span>

        {/* Twitter / X */}
        <ShareButton
          label="Compartilhar no Twitter"
          tooltip="Twitter / X"
          onClick={() =>
            openPopup(
              `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            )
          }
        >
          {/* X (Twitter) icon */}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.252 5.626 5.912-5.626Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="hidden sm:inline">Twitter</span>
        </ShareButton>

        {/* LinkedIn */}
        <ShareButton
          label="Compartilhar no LinkedIn"
          tooltip="LinkedIn"
          onClick={() =>
            openPopup(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            )
          }
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span className="hidden sm:inline">LinkedIn</span>
        </ShareButton>

        {/* Copy link */}
        <ShareButton
          label="Copiar link do artigo"
          tooltip={copied ? 'Copiado!' : 'Copiar link'}
          onClick={handleCopy}
        >
          {copied ? (
            // Checkmark
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            // Link icon
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
          <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar link'}</span>
        </ShareButton>
      </div>
    </Tooltip.Provider>
  )
}
