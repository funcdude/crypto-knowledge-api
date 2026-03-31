import { SearchDemo } from '@/components/SearchDemo'
import { PricingDisplay } from '@/components/PricingDisplay'
import { ApiDocumentation } from '@/components/ApiDocumentation'
import { HeroSection } from '@/components/HeroSection'
import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#121315] border-b border-outline-variant/10">
        <div>
          <div className="text-xl font-black tracking-tighter text-on-surface uppercase">
            Sage Molly
          </div>
          <p className="text-on-surface-variant text-xs mt-0.5">
            Crypto education for humans & AI agents
          </p>
        </div>
        <div className="hidden md:flex bg-surface-container-lowest p-1 rounded-full border border-outline-variant/20">
          <span className="px-4 py-1.5 rounded-full text-sm font-bold text-primary">
            For Humans
          </span>
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

        {/* Hero Section — audience-split */}
        <HeroSection />

        {/* Key Features */}
        <section className="py-16 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="text-lg font-semibold mb-2">Expert Knowledge</h3>
              <p className="text-on-surface-variant text-sm">
                Real expertise from Oskar Hurme&apos;s &ldquo;Cryptocurrencies Decrypted&rdquo; &mdash; not AI-generated guesses
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">X402 Payments</h3>
              <p className="text-on-surface-variant text-sm">
                3 free questions to start. Then pay-per-query with USDC on Base L2
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">For Everyone</h3>
              <p className="text-on-surface-variant text-sm">
                Whether you&apos;re new to crypto or building AI agents &mdash; Sage Molly speaks your language
              </p>
            </div>
          </div>
        </section>

        {/* Live Demo */}
        <section id="demo" className="py-16 max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Ask Sage Molly</h2>
          <SearchDemo />
        </section>

        {/* Pricing */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-8">Pricing</h2>
            <PricingDisplay />
          </div>
        </section>

        {/* API Documentation */}
        <section className="py-16 max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">API Integration</h2>
          <ApiDocumentation />
        </section>

        {/* Stats */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-8">Platform Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15">
                <div className="text-3xl font-bold font-mono text-primary mb-1">975</div>
                <div className="text-on-surface-variant text-sm">Knowledge Passages</div>
              </div>
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15">
                <div className="text-3xl font-bold font-mono text-primary mb-1">3 Free</div>
                <div className="text-on-surface-variant text-sm">Questions to Start</div>
              </div>
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15">
                <div className="text-3xl font-bold font-mono text-primary mb-1">~2s</div>
                <div className="text-on-surface-variant text-sm">Settlement Time</div>
              </div>
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15">
                <div className="text-3xl font-bold font-mono text-primary mb-1">Base L2</div>
                <div className="text-on-surface-variant text-sm">Low Gas Fees</div>
              </div>
            </div>
          </div>
        </section>

        {/* About the Book */}
        <section className="py-16 max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-6">About the Source</h2>
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/15 p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/3 flex justify-center">
                <div className="relative w-48 rounded-lg overflow-hidden shadow-2xl shadow-primary/10">
                  <Image
                    src="/images/book-cover.jpg"
                    alt="Cryptocurrencies Decrypted by Oskar Hurme — book cover"
                    width={384}
                    height={576}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
              <div className="md:w-2/3 text-left">
                <h3 className="text-2xl font-bold mb-4">
                  &ldquo;Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System&rdquo;
                </h3>
                <p className="text-on-surface-variant mb-4">
                  <strong>Author:</strong> Oskar Hurme, Fractional CPO specializing in Fintech, Web3, and Digital Health
                </p>
                <p className="text-on-surface-variant mb-6">
                  Sage Molly&apos;s knowledge comes from this balanced, expert analysis of cryptocurrency&apos;s
                  transformative potential &mdash; written by someone who has built real fintech
                  applications and understands both the promise and challenges of digital money.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
                    target="_blank"
                    className="px-6 py-3 engine-gradient text-on-primary font-bold rounded-lg hover:opacity-90 text-center"
                  >
                    Buy on Amazon
                  </Link>
                  <a
                    href="#demo"
                    className="px-6 py-3 bg-surface-container-highest text-on-surface font-semibold rounded-lg border border-outline-variant/20 hover:bg-surface-bright transition-colors text-center"
                  >
                    Ask Sage Molly First
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-8">Who Is Sage Molly For?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-xl font-semibold mb-3">🙋 Curious Newcomers</h3>
                <ul className="text-on-surface-variant space-y-2">
                  <li>What is a wallet?</li>
                  <li>How does Bitcoin actually work?</li>
                  <li>Is crypto safe?</li>
                  <li>What are stablecoins?</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-xl font-semibold mb-3">👩‍💻 Developers & Builders</h3>
                <ul className="text-on-surface-variant space-y-2">
                  <li>How does gas work in a payment flow?</li>
                  <li>What is X402 and agentic commerce?</li>
                  <li>Ethereum vs Bitcoin architecture?</li>
                  <li>How do smart contracts work?</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-xl font-semibold mb-3">🤖 AI Agents & Apps</h3>
                <ul className="text-on-surface-variant space-y-2">
                  <li>Crypto-aware chatbots and assistants</li>
                  <li>Educational platforms and courses</li>
                  <li>Compliance and regulatory analysis</li>
                  <li>Programmatic pay-per-query access</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-xl font-semibold mb-3">🏢 Enterprise</h3>
                <ul className="text-on-surface-variant space-y-2">
                  <li>Fintech product development</li>
                  <li>Investment research automation</li>
                  <li>Customer education tools</li>
                  <li>Risk assessment systems</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Sage Molly</h3>
              <p className="text-on-surface-variant mb-4">
                Expert crypto education powered by &ldquo;Cryptocurrencies Decrypted&rdquo; &mdash;
                the first crypto education agent you can pay for with crypto.
              </p>
              <p className="text-on-surface-variant/50 text-xs italic">
                Sage Molly educates, not advises. Nothing here is financial advice.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-on-surface-variant">
                <li>
                  <Link href="/docs" className="hover:text-primary transition-colors">
                    API Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
                    target="_blank"
                    className="hover:text-primary transition-colors"
                  >
                    Buy the Book
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-on-surface-variant">
                <li>Author: Oskar Hurme</li>
                <li>Fractional CPO</li>
                <li>Fintech / Web3 / Digital Health</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-outline-variant/10 pt-8 mt-8 text-center text-on-surface-variant">
            <p>
              &copy; 2026 Sage Molly. Built with Next.js, FastAPI, and X402 micropayments.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
