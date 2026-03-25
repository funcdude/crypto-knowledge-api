import { ApiDocumentation } from '@/components/ApiDocumentation'
import Link from 'next/link'

export const metadata = {
  title: 'API Documentation - Crypto Knowledge API',
  description: 'Full API reference for the Crypto Knowledge API with X402 micropayments',
}

export default function DocsPage() {
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
          <span className="px-4 py-1.5 rounded-full text-sm font-bold text-primary border-b-2 border-primary">
            For AI Agents
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="px-4 py-2 bg-surface-container-highest text-on-surface text-sm font-semibold rounded-lg border border-outline-variant/20 hover:bg-surface-bright transition-colors"
          >
            Pricing
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
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">API Documentation</h1>
            <p className="text-on-surface-variant text-sm font-mono">CRYPTO_KNOWLEDGE_API — X402_PROTOCOL — BASE_L2</p>
            <p className="text-on-surface-variant mt-3 max-w-2xl">
              Integrate expert crypto knowledge into your AI agents and applications using X402 micropayments on Base L2.
            </p>
          </div>
          <ApiDocumentation />
        </div>
      </main>
    </div>
  )
}
