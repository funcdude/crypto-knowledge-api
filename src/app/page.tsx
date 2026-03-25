import { SearchDemo } from '@/components/SearchDemo'
import { PricingDisplay } from '@/components/PricingDisplay'
import { ApiDocumentation } from '@/components/ApiDocumentation'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#121315] border-b border-outline-variant/10">
        <div className="text-xl font-black tracking-tighter text-on-surface uppercase">
          Crypto Knowledge API
        </div>
        <div className="hidden md:flex bg-surface-container-lowest p-1 rounded-full border border-outline-variant/20">
          <span className="px-4 py-1.5 rounded-full text-sm font-bold text-primary border-b-2 border-primary">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                X402 PROTOCOL — BASE L2 ACTIVE
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-br from-on-surface to-on-surface-variant bg-clip-text text-transparent">
                Expert Crypto Knowledge
                <span className="block text-primary">for AI Agents</span>
              </h1>
              <p className="text-on-surface-variant text-lg lg:text-xl max-w-xl leading-relaxed mb-8">
                Transform <em>Cryptocurrencies Decrypted</em> into an AI-accessible knowledge service.
                Pay per query with USDC micropayments on Base L2.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#demo"
                  className="px-6 py-3 engine-gradient text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  Try the API
                </a>
                <Link
                  href="/docs"
                  className="px-6 py-3 bg-surface-container-highest text-on-surface font-semibold rounded-lg border border-outline-variant/20 hover:bg-surface-bright transition-colors"
                >
                  View Schema
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
                  <p><span className="text-on-surface-variant/40">03</span> X-X402-Payment-Request: 0.005 USDC</p>
                  <p><span className="text-on-surface-variant/40">04</span> <span className="text-secondary"># Agent signs Base transaction...</span></p>
                  <p><span className="text-on-surface-variant/40">05</span> X-Payment: 0x7a2d...f3e1</p>
                  <p><span className="text-on-surface-variant/40">06</span> <span className="text-green-400">HTTP 200 OK</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="border-y border-outline-variant/10 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-50 hover:opacity-80 transition-opacity duration-500">
            <span className="font-mono text-xs tracking-widest font-bold text-on-surface-variant">X402 PROTOCOL</span>
            <span className="font-mono text-xs tracking-widest font-bold text-on-surface-variant">BASE NETWORK</span>
            <span className="font-mono text-xs tracking-widest font-bold text-on-surface-variant">USDC NATIVE</span>
            <span className="font-mono text-xs tracking-widest font-bold text-on-surface-variant">CRYPTOCURRENCIES DECRYPTED</span>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary text-lg">🧠</span>
              </div>
              <h3 className="text-base font-bold mb-2 text-on-surface">Expert Knowledge</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Content from fintech practitioner and fractional CPO, not AI-generated responses
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary text-lg">⚡</span>
              </div>
              <h3 className="text-base font-bold mb-2 text-on-surface">X402 Payments</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Micropayments starting at <span className="font-mono text-primary">$0.001 USDC</span> with 2-second settlement on Base
              </p>
            </div>

            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container transition-colors">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary text-lg">🤖</span>
              </div>
              <h3 className="text-base font-bold mb-2 text-on-surface">AI-Native</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                No API keys or subscriptions. AI agents pay autonomously per query
              </p>
            </div>
          </div>
        </section>

        {/* Live Demo */}
        <section id="demo" className="py-16 max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">Try the API</h2>
            <p className="text-on-surface-variant mt-1 text-sm font-mono">LIVE_DEMO — DEV MODE</p>
          </div>
          <SearchDemo />
        </section>

        {/* Pricing */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-on-surface">Pricing Tiers</h2>
              <p className="text-on-surface-variant mt-1 text-sm font-mono">PAY_PER_QUERY — NO_SUBSCRIPTION</p>
            </div>
            <PricingDisplay />
          </div>
        </section>

        {/* API Documentation */}
        <section className="py-16 max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">API Integration</h2>
            <p className="text-on-surface-variant mt-1 text-sm font-mono">ENDPOINTS — CODE_EXAMPLES — X402_FLOW</p>
          </div>
          <ApiDocumentation />
        </section>

        {/* Stats */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10 text-on-surface">Platform Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15">
                <div className="text-3xl font-bold font-mono text-primary mb-1">$0.001</div>
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
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">About the Source</h2>
            <p className="text-on-surface-variant mt-1 text-sm font-mono">FEATURED_SOURCE — CRYPTOCURRENCIES_DECRYPTED</p>
          </div>
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/15 p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/3 flex justify-center">
                <div className="w-44 h-60 rounded-lg border border-primary/20 bg-gradient-to-b from-surface-container to-surface-container-highest flex flex-col items-center justify-center p-4 text-center terminal-glow">
                  <div className="text-3xl mb-3 text-primary">₿</div>
                  <div className="text-xs font-mono font-bold leading-tight mb-2 text-on-surface">CRYPTOCURRENCIES DECRYPTED</div>
                  <div className="text-xs font-mono text-on-surface-variant leading-tight">Hope and Economic Freedom for a Broken Financial System</div>
                  <div className="mt-auto text-xs font-mono text-on-surface-variant/50">Oskar Hurme</div>
                </div>
              </div>
              <div className="md:w-2/3 text-left">
                <h3 className="text-2xl font-bold mb-4 text-on-surface">
                  "Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System"
                </h3>
                <p className="text-on-surface-variant mb-4 text-sm">
                  <span className="text-on-surface font-semibold">Author:</span> Oskar Hurme, Fractional CPO specializing in Fintech, Web3, and Digital Health
                </p>
                <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                  A balanced, expert analysis of cryptocurrency's transformative potential,
                  written by someone who's built real fintech applications and understands
                  both the promise and challenges of digital money.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
                    target="_blank"
                    className="px-6 py-3 engine-gradient text-on-primary font-bold rounded-lg hover:opacity-90 text-center text-sm"
                  >
                    Buy on Amazon
                  </Link>
                  <a
                    href="#demo"
                    className="px-6 py-3 bg-surface-container-highest text-on-surface font-semibold rounded-lg border border-outline-variant/20 hover:bg-surface-bright transition-colors text-center text-sm"
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
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-on-surface">Use Cases</h2>
              <p className="text-on-surface-variant mt-1 text-sm font-mono">WHO_USES_THIS — USE_CASE_GRID</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-base font-bold mb-3 text-on-surface">🤖 AI Applications</h3>
                <ul className="text-on-surface-variant text-sm space-y-2">
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Crypto-aware chatbots and assistants</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Educational platforms and courses</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Trading algorithm research</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Compliance and regulatory analysis</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-base font-bold mb-3 text-on-surface">🏢 Enterprise</h3>
                <ul className="text-on-surface-variant text-sm space-y-2">
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Fintech product development</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Investment research automation</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Customer education tools</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Risk assessment systems</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-base font-bold mb-3 text-on-surface">🎓 Education</h3>
                <ul className="text-on-surface-variant text-sm space-y-2">
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Interactive learning platforms</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Automated tutoring systems</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Research paper assistance</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Course content generation</li>
                </ul>
              </div>

              <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
                <h3 className="text-base font-bold mb-3 text-on-surface">🚀 Startups</h3>
                <ul className="text-on-surface-variant text-sm space-y-2">
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Product market research</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Competitive analysis</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Token economics design</li>
                  <li className="flex items-center gap-2"><span className="text-primary/50">—</span> Go-to-market strategy</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-base font-bold mb-4 text-on-surface uppercase tracking-tight">Crypto Knowledge API</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                The first AI-monetized book, transforming expert knowledge into accessible,
                pay-per-use API services.
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-4 text-on-surface uppercase tracking-tight">Resources</h3>
              <ul className="space-y-2 text-on-surface-variant text-sm">
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
              <h3 className="text-base font-bold mb-4 text-on-surface uppercase tracking-tight">Contact</h3>
              <ul className="space-y-2 text-on-surface-variant text-sm font-mono">
                <li>Author: Oskar Hurme</li>
                <li>Fractional CPO</li>
                <li>Fintech • Web3 • Digital Health</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-outline-variant/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-on-surface font-black tracking-tighter uppercase">Crypto Knowledge API</span>
            <p className="text-on-surface-variant/50 text-xs font-mono">
              © 2026 CRYPTO KNOWLEDGE API. POWERED BY X402 & BASE L2.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
