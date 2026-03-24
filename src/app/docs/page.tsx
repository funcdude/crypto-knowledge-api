import { ApiDocumentation } from '@/components/ApiDocumentation'
import Link from 'next/link'

export const metadata = {
  title: 'API Documentation - Crypto Knowledge API',
  description: 'Full API reference for the Crypto Knowledge API with X402 micropayments',
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-primary-600">
                Crypto Knowledge API
              </Link>
              <p className="text-gray-600 mt-1">API Documentation</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/pricing"
                className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
              >
                Pricing
              </Link>
              <Link
                href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Documentation</h1>
          <p className="text-xl text-gray-600 mb-12">
            Integrate expert crypto knowledge into your AI agents and applications using X402 micropayments on Base L2.
          </p>
          <ApiDocumentation />
        </div>
      </main>
    </div>
  )
}
