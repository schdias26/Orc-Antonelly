import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Antonelly Orçamentos - Sistema Público",
  description: "Sistema público de orçamentos da Antonelly Construções e Serviços. Acesso livre para todos os IP4s.",
  keywords: "orçamentos, antonelly, construção, IP4, sistema público",
  authors: [{ name: "Antonelly Construções e Serviços" }],
  openGraph: {
    title: "Antonelly Orçamentos - Sistema Público",
    description: "Sistema público de orçamentos da Antonelly Construções e Serviços",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/logo-antonelly.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
