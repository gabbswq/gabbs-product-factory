'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { forgotSchema, mapAuthError, type ForgotValues } from '@/types/auth'
import { createClient } from '@/lib/supabase/client'

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

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted]     = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit({ email }: ForgotValues) {
    setServerError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Supabase sends a magic link; clicking it lands on /auth/reset
      // with the access token in the URL fragment (handled by the callback page).
      redirectTo: `${window.location.origin}/auth/reset`,
    })

    if (error) {
      setServerError(mapAuthError(error.message))
      return
    }

    // Always show the success state regardless of whether the email exists —
    // this prevents email enumeration attacks.
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Verifique seu email</CardTitle>
            <CardDescription>
              Se esse email estiver cadastrado, você receberá um link para
              redefinir sua senha em instantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Não recebeu?{' '}
              <button
                className="underline"
                onClick={() => setSubmitted(false)}
              >
                Tentar novamente
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Informe seu email e enviaremos um link para redefinir sua senha.
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="voce@email.com"
                        autoComplete="email"
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
                {form.formState.isSubmitting ? 'Enviando…' : 'Enviar link de recuperação'}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Lembrou a senha?{' '}
            <Link href="/auth/login" className="underline">
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
