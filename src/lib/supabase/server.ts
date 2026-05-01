import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const FALLBACK_SUPABASE_URL = 'http://127.0.0.1:54321'
const FALLBACK_SUPABASE_ANON_KEY = 'build-time-placeholder'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

/**
 * Returns a Supabase client safe to use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes session cookies via next/headers.
 *
 * Always await this at the top of the function that uses it — cookies() is
 * async in Next.js 15+.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Components cannot set cookies — safe to ignore.
            // Cookie mutations (token refresh) are handled in middleware.
          }
        },
      },
    },
  )
}
