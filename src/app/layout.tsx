import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://localhost:5000'),
  title: 'Crypto Knowledge API',
  description: 'Expert crypto knowledge from "Cryptocurrencies Decrypted" by Oskar Hurme, served via X402 micropayments on Base L2.',
  keywords: ['crypto', 'bitcoin', 'blockchain', 'X402', 'AI agents', 'micropayments'],
  authors: [{ name: 'Oskar Hurme' }],
  creator: 'Oskar Hurme',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Crypto Knowledge API',
    title: 'Crypto Knowledge API — Expert Knowledge for AI Agents',
    description: 'Expert crypto knowledge from "Cryptocurrencies Decrypted" via X402 micropayments on Base L2.',
  },
  twitter: {
    card: 'summary',
    title: 'Crypto Knowledge API',
    description: 'Expert crypto knowledge via X402 micropayments on Base L2.',
    creator: '@oskarhurme',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={cn(
          inter.variable,
          'min-h-screen bg-surface font-sans antialiased'
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
