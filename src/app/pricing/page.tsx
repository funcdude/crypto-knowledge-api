import { PricingDisplay } from '@/components/PricingDisplay'
import Link from 'next/link'

export const metadata = {
  title: 'Pricing - Crypto Knowledge API',
  description: 'Pay-per-query pricing tiers for the Crypto Knowledge API using USDC on Base L2',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-primary-600">
                Crypto Knowledge API
              </Link>
              <p className="text-gray-600 mt-1">Pricing</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/docs"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                API Docs
              </Link>
              <Link
                href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
                className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                target="_blank"
              >
                Buy Book
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pricing Tiers</h1>
          <p className="text-xl text-gray-600 mb-12">
            Pay only for what you use with USDC micropayments on Base L2. No subscriptions, no API keys.
          </p>
          <PricingDisplay />

          <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">How Payments Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="font-semibold mb-2">Make a Request</h3>
                <p className="text-gray-600 text-sm">
                  Call the API with your query. Receive an HTTP 402 response with payment details.
                </p>
              </div>
              <div>
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="font-semibold mb-2">Pay on Base L2</h3>
                <p className="text-gray-600 text-sm">
                  Send USDC on Base L2. Transaction settles in ~2 seconds with minimal gas fees.
                </p>
              </div>
              <div>
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="font-semibold mb-2">Get Knowledge</h3>
                <p className="text-gray-600 text-sm">
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
