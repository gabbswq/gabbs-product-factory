'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import type { User } from '@supabase/supabase-js'

interface RequireAuthResult {
  user: User | null
  loading: boolean
}

/**
 * Redirects unauthenticated users to `redirectTo` (default: /auth/login).
 * Use inside any Client Component that represents a protected page.
 *
 * @example
 * export default function DashboardPage() {
 *   const { user, loading } = useRequireAuth()
 *   if (loading) return <Spinner />
 *   return <Dashboard user={user!} />
 * }
 */
export function useRequireAuth(redirectTo = '/auth/login'): RequireAuthResult {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait until the initial session fetch completes before redirecting;
    // otherwise authenticated users get bounced on the first render.
    if (!loading && !user) {
      router.replace(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}
