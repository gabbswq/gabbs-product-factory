'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { resetSchema, mapAuthError, type ResetValues } from '@/types/auth'
import { createClient } from '@/lib/supabase/client'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type PageState = 'loading' | 'ready' | 'success' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [pageState, setPageState]     = useState<PageState>('loading')
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm_password: '' },
  })

  const password = form.watch('password')

  // Supabase sends the reset token in the URL fragment (#access_token=...).
  // The supabase-js client picks it up automatically when we call getSession()
  // after the PASSWORD_RECOVERY event fires on onAuthStateChange.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setPageState('ready')
        }
      },
    )

    // In case the event already fired (e.g. page reload), check session too.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState('ready')
      } else {
        // Give onAuthStateChange a moment to fire before declaring invalid.
        setTimeout(() => {
          setPageState((s) => (s === 'loading' ? 'invalid' : s))
        }, 2000)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit({ password }: ResetValues) {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setServerError(mapAuthError(error.message))
      return
    }

    // Sign out so the user re-authenticates cleanly with the new password.
    await supabase.auth.signOut()
    setPageState('success')
  }

  // ── States ─────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Validando link…</p>
      </main>
    )
  }

  if (pageState === 'invalid') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Link inválido ou expirado</CardTitle>
            <CardDescription>
              Solicite um novo link de recuperação de senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/auth/forgot')} className="w-full">
              Solicitar novo link
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (pageState === 'success') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Senha redefinida!</CardTitle>
            <CardDescription>
              Sua senha foi atualizada com sucesso. Faça login para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  // ── Reset form ─────────────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
          <CardDescription>
            Escolha uma senha forte para proteger sua conta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <PasswordStrengthMeter password={password} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Salvando…' : 'Redefinir senha'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
