import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const FALLBACK_SUPABASE_URL = 'http://127.0.0.1:54321'
const FALLBACK_SUPABASE_ANON_KEY = 'build-time-placeholder'

/**
 * Returns a Supabase client scoped to the browser (anon key).
 * Safe to call in Client Components and hooks.
 * Never exposes the service_role key — privileged ops go through Edge Functions.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY,
  )
}
