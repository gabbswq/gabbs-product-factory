import { NextResponse } from 'next/server'
import { listActiveProducts } from '@/lib/products'

export async function GET() {
  const products = await listActiveProducts()
  return NextResponse.json({ products })
}
