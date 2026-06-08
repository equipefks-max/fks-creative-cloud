import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FKS Creative Cloud',
  description: 'Pipeline de produção com IA — Agência FKS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
