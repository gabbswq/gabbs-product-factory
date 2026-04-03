import { createBrowserClient } from '@supabase/ssr'

/**
 * Returns a Supabase client scoped to the browser (anon key).
 * Safe to call in Client Components and hooks.
 * Never exposes the service_role key — privileged ops go through Edge Functions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
