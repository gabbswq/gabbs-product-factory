import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Returns a Supabase client safe to use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes session cookies via next/headers.
 *
 * Always await this at the top of the function that uses it — cookies() is
 * async in Next.js 15+.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
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
