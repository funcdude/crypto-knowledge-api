import { SearchDemo } from '@/components/SearchDemo'
import { PricingDisplay } from '@/components/PricingDisplay'
import { ApiDocumentation } from '@/components/ApiDocumentation'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Crypto Knowledge API
              </h1>
              <p className="text-gray-600 mt-1">
                First AI-monetized book with X402 micropayments
              </p>
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
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Expert Crypto Knowledge
              <span className="block text-primary-600">for AI Agents</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Transform "Cryptocurrencies Decrypted" into an AI-accessible knowledge service.
              Pay per query with USDC micropayments on Base L2.
            </p>
            
            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-3xl mb-4">🧠</div>
                <h3 className="text-lg font-semibold mb-2">Expert Knowledge</h3>
                <p className="text-gray-600 text-sm">
                  Content from fintech practitioner and fractional CPO, not AI-generated responses
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold mb-2">X402 Payments</h3>
                <p className="text-gray-600 text-sm">
                  Micropayments starting at $0.001 USDC with 2-second settlement on Base
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-3xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold mb-2">AI-Native</h3>
                <p className="text-gray-600 text-sm">
                  No API keys or subscriptions. AI agents pay autonomously per query
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Try the API</h2>
            <SearchDemo />
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Pricing Tiers</h2>
            <PricingDisplay />
          </div>
        </section>

        {/* API Documentation */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">API Integration</h2>
            <ApiDocumentation />
          </div>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-center mb-8">Platform Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-600">$0.001</div>
                <div className="text-gray-600">Starting Price</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">~2s</div>
                <div className="text-gray-600">Settlement Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">Base L2</div>
                <div className="text-gray-600">Low Gas Fees</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">24/7</div>
                <div className="text-gray-600">Availability</div>
              </div>
            </div>
          </div>
        </section>

        {/* About the Book */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">About the Source</h2>
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/3 flex justify-center">
                  <div className="w-48 h-64 rounded-lg shadow-md bg-gradient-to-b from-blue-800 to-indigo-900 flex flex-col items-center justify-center p-4 text-white text-center">
                    <div className="text-4xl mb-3">₿</div>
                    <div className="text-xs font-bold leading-tight mb-2">CRYPTOCURRENCIES DECRYPTED</div>
                    <div className="text-xs opacity-75 leading-tight">Hope and Economic Freedom for a Broken Financial System</div>
                    <div className="mt-auto text-xs opacity-60">Oskar Hurme</div>
                  </div>
                </div>
                <div className="md:w-2/3 text-left">
                  <h3 className="text-2xl font-bold mb-4">
                    "Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System"
                  </h3>
                  <p className="text-gray-600 mb-4">
                    <strong>Author:</strong> Oskar Hurme, Fractional CPO specializing in Fintech, Web3, and Digital Health
                  </p>
                  <p className="text-gray-600 mb-6">
                    A balanced, expert analysis of cryptocurrency's transformative potential, 
                    written by someone who's built real fintech applications and understands 
                    both the promise and challenges of digital money.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
                      target="_blank"
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center"
                    >
                      Buy on Amazon
                    </Link>
                    <Link
                      href="#demo"
                      className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 text-center"
                    >
                      Try API First
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Use Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold mb-3">🤖 AI Applications</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Crypto-aware chatbots and assistants</li>
                  <li>• Educational platforms and courses</li>
                  <li>• Trading algorithm research</li>
                  <li>• Compliance and regulatory analysis</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold mb-3">🏢 Enterprise</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Fintech product development</li>
                  <li>• Investment research automation</li>
                  <li>• Customer education tools</li>
                  <li>• Risk assessment systems</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold mb-3">🎓 Education</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Interactive learning platforms</li>
                  <li>• Automated tutoring systems</li>
                  <li>• Research paper assistance</li>
                  <li>• Course content generation</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold mb-3">🚀 Startups</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Product market research</li>
                  <li>• Competitive analysis</li>
                  <li>• Token economics design</li>
                  <li>• Go-to-market strategy</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Crypto Knowledge API</h3>
              <p className="text-gray-400 mb-4">
                The first AI-monetized book, transforming expert knowledge into accessible, 
                pay-per-use API services.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/docs" className="hover:text-white">
                    API Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
                    target="_blank"
                    className="hover:text-white"
                  >
                    Buy the Book
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Author: Oskar Hurme</li>
                <li>Fractional CPO</li>
                <li>Fintech • Web3 • Digital Health</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>
              © 2026 Crypto Knowledge API. Built with Next.js, FastAPI, and X402 micropayments.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}