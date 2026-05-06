import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getProductBySlug } from '@/lib/products'
import { Button } from '@/components/ui/button'
import type {
  ProductType,
  AccessType,
  PriceInterval,
} from '@/types/products'

export const revalidate = 300

const TYPE_LABEL: Record<ProductType, string> = {
  course: 'Curso',
  membership: 'Membership',
  roadmap: 'Roadmap',
}

const ACCESS_LABEL: Record<AccessType, string> = {
  one_time: 'Compra única',
  subscription: 'Assinatura',
}

const INTERVAL_LABEL: Record<PriceInterval, string> = {
  day: '/dia',
  week: '/semana',
  month: '/mês',
  year: '/ano',
}

function formatPrice(
  amount_cents: number,
  currency: string,
  interval: PriceInterval | null,
): string {
  const amount = amount_cents / 100
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
  return interval ? `${formatted}${INTERVAL_LABEL[interval]}` : formatted
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: 'Produto não encontrado' }
  }

  return {
    title: `${product.title} — InnovateTech`,
    description: product.description ?? undefined,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-6">
        <Link
          href="/products"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← Voltar para produtos
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {TYPE_LABEL[product.product_type]}
        </span>
        <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
          {ACCESS_LABEL[product.access_type]}
        </span>
      </div>

      <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight">
        {product.title}
      </h1>

      {product.description && (
        <p className="mb-10 text-xl text-muted-foreground">
          {product.description}
        </p>
      )}

      <section className="mb-10 rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Preços</h2>
        {product.prices.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {product.prices.map((price) => (
              <li
                key={price.id}
                className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium"
              >
                {formatPrice(price.amount_cents, price.currency, price.interval)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem preços ativos no momento.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" disabled aria-disabled="true">
          Comprar
        </Button>
        <span className="text-xs text-muted-foreground">
          Checkout em breve.
        </span>
      </div>
    </main>
  )
}
