import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: { price_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const priceId = body.price_id
  if (typeof priceId !== 'string' || !UUID_RE.test(priceId)) {
    return NextResponse.json({ error: 'price_id must be a valid UUID.' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Checkout is not configured.' }, { status: 500 })
  }

  const edgeResponse = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ price_id: priceId }),
  })

  const contentType = edgeResponse.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await edgeResponse.json().catch(() => null)
    : await edgeResponse.text().catch(() => '')

  return NextResponse.json(payload ?? {}, { status: edgeResponse.status })
}
