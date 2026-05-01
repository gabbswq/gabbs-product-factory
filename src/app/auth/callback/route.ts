import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getSafeRedirectUrl(request: NextRequest, redirectTo: string | null) {
  const fallbackUrl = new URL('/dashboard', request.url)

  if (!redirectTo) return fallbackUrl

  try {
    const parsedUrl = new URL(redirectTo, request.url)
    if (parsedUrl.origin !== fallbackUrl.origin) return fallbackUrl

    return parsedUrl
  } catch {
    return fallbackUrl
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(request, redirectTo))
    }
  }

  return NextResponse.redirect(new URL('/auth/login', request.url))
}
