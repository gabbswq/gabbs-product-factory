import Link from 'next/link'
import type { PublicProductWithPrices, ProductType, AccessType, PriceInterval } from '@/types/products'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'

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

function formatPrice(amount_cents: number, currency: string, interval: PriceInterval | null): string {
  const amount = amount_cents / 100
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
  return interval ? `${formatted}${INTERVAL_LABEL[interval]}` : formatted
}

interface Props {
  product: PublicProductWithPrices
}

export function ProductCard({ product }: Props) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {TYPE_LABEL[product.product_type]}
          </span>
          <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
            {ACCESS_LABEL[product.access_type]}
          </span>
        </div>

        <Link href={`/products/${product.slug}`}>
          <h2 className="text-lg font-semibold leading-snug transition-colors group-hover:text-primary line-clamp-2">
            {product.title}
          </h2>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {product.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-end gap-1.5 pt-0">
        {product.prices.length > 0 ? (
          product.prices.map((price) => (
            <span
              key={price.id}
              className="rounded-md bg-muted px-2 py-1 text-sm font-medium"
            >
              {formatPrice(price.amount_cents, price.currency, price.interval)}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">Sem preços ativos</span>
        )}
      </CardFooter>
    </Card>
  )
}
