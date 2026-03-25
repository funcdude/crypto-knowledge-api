import { PricingDisplay } from '@/components/PricingDisplay'
import Link from 'next/link'

export const metadata = {
  title: 'Pricing - Crypto Knowledge API',
  description: 'Pay-per-query pricing tiers for the Crypto Knowledge API using USDC on Base L2',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#121315] border-b border-outline-variant/10">
        <Link href="/" className="text-xl font-black tracking-tighter text-on-surface uppercase hover:text-primary transition-colors">
          Crypto Knowledge API
        </Link>
        <div className="hidden md:flex bg-surface-container-lowest p-1 rounded-full border border-outline-variant/20">
          <Link
            href="/"
            className="px-4 py-1.5 rounded-full text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            For Humans
          </Link>
          <Link
            href="/docs"
            className="px-4 py-1.5 rounded-full text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            For AI Agents
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="px-4 py-2 bg-surface-container-highest text-on-surface text-sm font-semibold rounded-lg border border-outline-variant/20 hover:bg-surface-bright transition-colors"
          >
            API Docs
          </Link>
          <Link
            href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
            className="px-4 py-2 engine-gradient text-on-primary text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
            target="_blank"
          >
            Buy Book
          </Link>
        </div>
      </header>

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-4">Pricing Tiers</h1>
            <p className="text-xl text-on-surface-variant max-w-2xl">
              Pay only for what you use with USDC micropayments on Base L2. No subscriptions, no API keys.
            </p>
          </div>

          <PricingDisplay />

          {/* How Payments Work */}
          <div className="mt-12 bg-surface-container-low rounded-xl border border-outline-variant/15 p-8">
            <h2 className="text-2xl font-bold mb-8 text-on-surface tracking-tight">How Payments Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-surface-container rounded-xl border border-outline-variant/15 p-6">
                <div className="text-3xl mb-4">🤖</div>
                <h3 className="font-bold mb-2 text-on-surface">Make a Request</h3>
                <p className="text-on-surface-variant text-sm">
                  Call the API with your query. Receive an HTTP 402 response with payment details.
                </p>
              </div>
              <div className="bg-surface-container rounded-xl border border-outline-variant/15 p-6">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="font-bold mb-2 text-on-surface">Pay on Base L2</h3>
                <p className="text-on-surface-variant text-sm">
                  Send USDC on Base L2. Transaction settles in ~2 seconds with minimal gas fees.
                </p>
              </div>
              <div className="bg-surface-container rounded-xl border border-outline-variant/15 p-6">
                <div className="text-3xl mb-4">🧠</div>
                <h3 className="font-bold mb-2 text-on-surface">Get Knowledge</h3>
                <p className="text-on-surface-variant text-sm">
                  Retry with payment proof. Receive expert crypto knowledge from the book.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
