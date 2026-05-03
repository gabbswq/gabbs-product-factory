import type { Metadata } from 'next'
import { listActiveProducts } from '@/lib/products'
import { ProductCard } from '@/components/products/ProductCard'

export const metadata: Metadata = {
  title: 'Produtos — InnovateTech',
  description: 'Cursos, memberships e roadmaps para quem quer dominar automação com IA.',
}

export const revalidate = 300

export default async function ProductsPage() {
  const products = await listActiveProducts()

  return (
    <main className="container mx-auto max-w-6xl px-4 py-16">
      <div className="mb-10">
        <span className="mb-2 block text-sm font-medium text-primary">Produtos</span>
        <h1 className="text-4xl font-bold">O que temos para você</h1>
        <p className="mt-2 text-muted-foreground">
          Cursos, memberships e roadmaps para acelerar sua jornada com IA.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg font-medium">Nenhum produto disponível no momento.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Volte em breve — novidades chegando!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}
