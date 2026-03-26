import { SearchDemo } from '@/components/SearchDemo'
import { PricingDisplay } from '@/components/PricingDisplay'
import { ApiDocumentation } from '@/components/ApiDocumentation'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#121315] border-b border-outline-variant/10">
        <div>
          <div className="text-xl font-black tracking-tighter text-on-surface uppercase">
            Crypto Knowledge API
          </div>
          <p className="text-on-surface-variant text-xs mt-0.5">
            First AI-monetized book with X402 micropayments
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

        {/* Hero Section */}
        <section className="pt-20 pb-20 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-br from-on-surface to-on-surface-variant bg-clip-text text-transparent">
                Expert Crypto Knowledge
                <span className="block text-primary">for AI Agents</span>
              </h2>
              <p className="text-on-surface-variant text-lg lg:text-xl max-w-xl leading-relaxed mb-8">
                We've transformed the book &ldquo;Cryptocurrencies Decrypted&rdquo; into an AI-accessible knowledge service.
                Pay per query with USDC micropayments on Base L2.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/docs"
                  className="px-6 py-3 engine-gradient text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  API Docs
                </Link>
                <Link
                  href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
                  target="_blank"
                  className="px-6 py-3 bg-surface-container-highest text-on-surface font-semibold rounded-lg border border-outline-variant/20 hover:bg-surface-bright transition-colors"
                >
                  Buy Book
                </Link>
              </div>
            </div>

            {/* Terminal Code Panel */}
            <div className="hidden lg:block relative">
              <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full"></div>
              <div className="relative bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 font-mono text-sm terminal-glow">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-error/40"></div>
                  <div className="w-3 h-3 rounded-full bg-tertiary/40"></div>
                  <div className="w-3 h-3 rounded-full bg-primary/40"></div>
                </div>
                <div className="space-y-2 text-primary/80">
                  <p><span className="text-on-surface-variant/40">01</span> GET /api/v1/search?q=&quot;bitcoin+consensus&quot;</p>
                  <p><span className="text-on-surface-variant/40">02</span> <span className="text-error">HTTP 402 Payment Required</span></p>
                  <p><span className="text-on-surface-variant/40">03</span> X-X402-Payment-Request: 0.01 USDC</p>
                  <p><span className="text-on-surface-variant/40">04</span> <span className="text-secondary"># Agent signs Base transaction...</span></p>
                  <p><span className="text-on-surface-variant/40">05</span> X-Payment: 0x7a2d...f3e1</p>
                  <p><span className="text-on-surface-variant/40">06</span> <span className="text-green-400">HTTP 200 OK</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="text-lg font-semibold mb-2">Expert Knowledge</h3>
              <p className="text-on-surface-variant text-sm">
                Content from fractional Product Lead Oskar Hurme, not AI-generated responses
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">X402 Payments</h3>
              <p className="text-on-surface-variant text-sm">
                Micropayments starting at $0.01 USDC with 2-second settlement on Base
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">AI-Native</h3>
              <p className="text-on-surface-variant text-sm">
                No API keys or subscriptions. AI agents pay autonomously per query
              </p>
            </div>
          </div>
        </section>

        {/* Live Demo */}
        <section id="demo" className="py-16 max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Try the API</h2>
          <SearchDemo />
        </section>

        {/* Pricing */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-8">Pricing Tiers</h2>
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
                <div className="text-3xl font-bold font-mono text-primary mb-1">$0.01</div>
                <div className="text-on-surface-variant text-sm">Starting Price</div>
              </div>
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15">
                <div className="text-3xl font-bold font-mono text-primary mb-1">~2s</div>
                <div className="text-on-surface-variant text-sm">Settlement Time</div>
              </div>
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15">
                <div className="text-3xl font-bold font-mono text-primary mb-1">Base L2</div>
                <div className="text-on-surface-variant text-sm">Low Gas Fees</div>
              </div>
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15">
                <div className="text-3xl font-bold font-mono text-primary mb-1">24/7</div>
                <div className="text-on-surface-variant text-sm">Availability</div>
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
                <div className="w-48 h-64 rounded-lg border border-primary/20 bg-gradient-to-b from-surface-container to-surface-container-highest flex flex-col items-center justify-center p-4 text-center terminal-glow">
                  <div className="text-4xl mb-3 text-primary">₿</div>
                  <div className="text-xs font-mono font-bold leading-tight mb-2 text-on-surface">CRYPTOCURRENCIES DECRYPTED</div>
                  <div className="text-xs font-mono text-on-surface-variant leading-tight opacity-75">Hope and Economic Freedom for a Broken Financial System</div>
                  <div className="mt-auto text-xs font-mono text-on-surface-variant opacity-60">Oskar Hurme</div>
                </div>
              </div>
              <div className="md:w-2/3 text-left">
                <h3 className="text-2xl font-bold mb-4">
                  "Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System"
                </h3>
                <p className="text-on-surface-variant mb-4">
                  <strong>Author:</strong> Oskar Hurme, Fractional CPO specializing in Fintech, Web3, and Digital Health
                </p>
                <p className="text-on-surface-variant mb-6">
                  A balanced, expert analysis of cryptocurrency's transformative potential,
                  written by someone who's built real fintech applications and understands
                  both the promise and challenges of digital money.
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
                    Try API First
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-8">Use Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-xl font-semibold mb-3">🤖 AI Applications</h3>
                <ul className="text-on-surface-variant space-y-2">
                  <li>• Crypto-aware chatbots and assistants</li>
                  <li>• Educational platforms and courses</li>
                  <li>• Trading algorithm research</li>
                  <li>• Compliance and regulatory analysis</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-xl font-semibold mb-3">🏢 Enterprise</h3>
                <ul className="text-on-surface-variant space-y-2">
                  <li>• Fintech product development</li>
                  <li>• Investment research automation</li>
                  <li>• Customer education tools</li>
                  <li>• Risk assessment systems</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-xl font-semibold mb-3">🎓 Education</h3>
                <ul className="text-on-surface-variant space-y-2">
                  <li>• Interactive learning platforms</li>
                  <li>• Automated tutoring systems</li>
                  <li>• Research paper assistance</li>
                  <li>• Course content generation</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-xl font-semibold mb-3">🚀 Startups</h3>
                <ul className="text-on-surface-variant space-y-2">
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
      <footer className="bg-surface-container-lowest border-t border-outline-variant/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Crypto Knowledge API</h3>
              <p className="text-on-surface-variant mb-4">
                The first AI-monetized book, transforming expert knowledge into accessible,
                pay-per-use API services.
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
                <li>Fintech • Web3 • Digital Health</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-outline-variant/10 pt-8 mt-8 text-center text-on-surface-variant">
            <p>
              © 2026 Crypto Knowledge API. Built with Next.js, FastAPI, and X402 micropayments.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
