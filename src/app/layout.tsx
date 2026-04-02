import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = localFont({
  src: [
    {
      path: '../../public/fonts/GeistMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GeistMono-Medium.woff2',
      weight: '500 600',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://sagemolly.net'),
  title: 'Sage Molly — Crypto Education for Humans & AI Agents',
  description: 'Expert crypto education from "Cryptocurrencies Decrypted" by Oskar Hurme. Learn about Bitcoin, Ethereum, DeFi, and more — powered by X402 micropayments on Base L2.',
  icons: { icon: '/favicon.svg' },
  keywords: ['crypto', 'bitcoin', 'blockchain', 'X402', 'AI agents', 'micropayments', 'crypto education', 'sage molly'],
  authors: [{ name: 'Oskar Hurme' }],
  creator: 'Oskar Hurme',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Sage Molly',
    title: 'Sage Molly — Crypto Education for Humans & AI Agents',
    description: 'Expert crypto education from "Cryptocurrencies Decrypted" via X402 micropayments on Base L2.',
  },
  twitter: {
    card: 'summary',
    title: 'Sage Molly',
    description: 'Expert crypto education via X402 micropayments on Base L2.',
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
          geistMono.variable,
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
