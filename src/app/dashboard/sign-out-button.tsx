'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

/**
 * Client-side sign-out control. Uses the Supabase session via useAuth(),
 * then sends the user back to the login page.
 */
export function SignOutButton() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await signOut()
    router.replace('/auth/login')
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={loading}>
      {loading ? 'Saindo…' : 'Sair'}
    </Button>
  )
}
