import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'InnovateTech',
    template: '%s | InnovateTech',
  },
  description: 'Automação com IA para negócios.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
