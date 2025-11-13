import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Integração - Integração CriaAI',
  description: 'Demonstração de integração Integração com CriaAI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

