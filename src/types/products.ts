import type { Json } from './database'

export type ProductType = 'course' | 'membership' | 'roadmap'
export type AccessType = 'one_time' | 'subscription'
export type PriceInterval = 'day' | 'week' | 'month' | 'year'

export type PublicPrice = {
  id: string
  amount_cents: number
  currency: string
  interval: PriceInterval | null
}

export type PublicProduct = {
  id: string
  title: string
  slug: string
  description: string | null
  product_type: ProductType
  access_type: AccessType
  price_cents: number
  currency: string
  metadata: Json
  created_at: string
}

export type PublicProductWithPrices = PublicProduct & {
  prices: PublicPrice[]
}
