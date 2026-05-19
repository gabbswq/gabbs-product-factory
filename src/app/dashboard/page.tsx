import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No session — bounce to login.
  if (!user) {
    redirect('/auth/login')
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email

  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <span className="mb-2 block text-sm font-medium text-primary">
          Dashboard
        </span>
        <h1 className="text-4xl font-bold">Olá, {displayName}</h1>
        <p className="mt-2 text-muted-foreground">{user.email}</p>
      </div>

      <nav className="flex flex-col gap-3">
        <Link href="/products" className="underline">
          Produtos
        </Link>
        <Link href="/articles" className="underline">
          Artigos
        </Link>
      </nav>

      <div className="mt-10">
        <SignOutButton />
      </div>
    </main>
  )
}
