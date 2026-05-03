import { createClient } from '@/lib/supabase/server'
import type {
  PublicProduct,
  PublicProductWithPrices,
  PublicPrice,
  ProductType,
  AccessType,
  PriceInterval,
} from '@/types/products'

type ProductRow = {
  id: string
  title: string
  slug: string
  description: string | null
  product_type: string
  access_type: string
  price_cents: number
  currency: string
  metadata: unknown
  created_at: string
}

type PriceRow = {
  id: string
  product_id: string
  amount_cents: number
  currency: string
  interval: string | null
}

function toPublicProduct(row: ProductRow): PublicProduct {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    product_type: row.product_type as ProductType,
    access_type: row.access_type as AccessType,
    price_cents: row.price_cents,
    currency: row.currency,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: row.metadata as any,
    created_at: row.created_at,
  }
}

function toPublicPrice(row: PriceRow): PublicPrice {
  return {
    id: row.id,
    amount_cents: row.amount_cents,
    currency: row.currency,
    interval: row.interval as PriceInterval | null,
  }
}

export async function listActiveProducts(): Promise<PublicProductWithPrices[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error || !data || data.length === 0) return []

  const products = data as unknown as ProductRow[]
  const productIds = products.map((p) => p.id)

  const { data: pricesData } = await supabase
    .from('prices')
    .select('*')
    .eq('active', true)
    .in('product_id', productIds)

  const prices = (pricesData ?? []) as unknown as PriceRow[]

  const pricesByProduct = new Map<string, PublicPrice[]>()
  for (const price of prices) {
    const list = pricesByProduct.get(price.product_id) ?? []
    list.push(toPublicPrice(price))
    pricesByProduct.set(price.product_id, list)
  }

  return products.map((p) => ({
    ...toPublicProduct(p),
    prices: pricesByProduct.get(p.id) ?? [],
  }))
}

export async function getProductBySlug(slug: string): Promise<PublicProductWithPrices | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error || !data) return null

  const product = data as unknown as ProductRow

  const { data: pricesData } = await supabase
    .from('prices')
    .select('*')
    .eq('product_id', product.id)
    .eq('active', true)

  const prices = (pricesData ?? []) as unknown as PriceRow[]

  return {
    ...toPublicProduct(product),
    prices: prices.map(toPublicPrice),
  }
}

export async function checkProductAccess(productId: string): Promise<boolean> {
  const supabase = await createClient()

  // `rpc` typing diverges between @supabase/ssr v0.5.2 and supabase-js v2.49.1;
  // cast avoids the version mismatch while keeping runtime behaviour correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any
  const { data, error } = await client.rpc('can_access_product', {
    p_product_id: productId,
  })

  if (error) return false
  return data === true
}
