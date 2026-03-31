'use client'

import { useState } from 'react'
import Link from 'next/link'

const SAMPLE_QUESTION = 'What is money?'
const SAMPLE_ANSWER = [
  {
    content: 'At its essence, money is a social technology\u2014a tool that facilitates the transfer of value over time and space. It serves as a medium of exchange, a store of value, and a unit of measurement. But to truly understand money, we need to explore the underlying concepts that make it work.',
    source: 'Cryptocurrencies Decrypted \u2014 Oskar Hurme',
  },
  {
    content: 'Throughout history, different cultures have used different technologies as money. At its simplest, when a hunter gives a piece of deer meat to his friend, a bond is created\u2014an expectation that at some point his friend will return the favor.',
    source: 'Cryptocurrencies Decrypted \u2014 Oskar Hurme',
  },
]

export function HeroSection() {
  const [view, setView] = useState<'humans' | 'agents'>('humans')

  return (
    <section className="pt-20 pb-20 max-w-7xl mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-br from-on-surface to-on-surface-variant bg-clip-text text-transparent">
            Crypto Knowledge,
            <span className="block text-primary">Made Clear</span>
          </h2>

          <div className="flex bg-surface-container-lowest p-1 rounded-full border border-outline-variant/20 w-fit mb-6">
            <button
              onClick={() => setView('humans')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                view === 'humans'
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              For Humans
            </button>
            <button
              onClick={() => setView('agents')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                view === 'agents'
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              For AI Agents
            </button>
          </div>

          {view === 'humans' ? (
            <p className="text-on-surface-variant text-lg lg:text-xl max-w-xl leading-relaxed mb-8">
              Ask anything about crypto and get clear, expert answers from &ldquo;Cryptocurrencies Decrypted&rdquo; by Oskar Hurme. Start with 3 free questions &mdash; no wallet needed.
            </p>
          ) : (
            <p className="text-on-surface-variant text-lg lg:text-xl max-w-xl leading-relaxed mb-8">
              Integrate expert crypto knowledge into your AI agent or app. Pay per query with USDC on Base L2 via the X402 protocol &mdash; no API keys, no subscriptions.
            </p>
          )}

          <p className="text-on-surface-variant/60 text-xs mb-8 italic">
            Sage Molly educates, not advises. Nothing here is financial advice. Always do your own research.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#demo"
              className="px-6 py-3 engine-gradient text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Ask Sage Molly
            </a>
            <Link
              href="https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
              target="_blank"
              className="px-6 py-3 bg-surface-container-highest text-on-surface font-semibold rounded-lg border border-outline-variant/20 hover:bg-surface-bright transition-colors"
            >
              Buy the Book
            </Link>
          </div>
        </div>

        {/* Right panel — switches by audience */}
        <div className="hidden lg:block relative">
          <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full"></div>

          {view === 'humans' ? (
            <div className="relative bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs font-mono text-on-surface-variant/60 uppercase tracking-widest">Live example</span>
              </div>
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/15 p-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60 block mb-2">Question</span>
                <p className="text-on-surface font-semibold">{SAMPLE_QUESTION}</p>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-green-400/60 block">Answer from Sage Molly</span>
                {SAMPLE_ANSWER.map((item, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-lg border border-outline-variant/15 p-4">
                    <p className="text-on-surface text-sm leading-relaxed mb-2">{item.content}</p>
                    <p className="text-[10px] text-on-surface-variant/50 italic">{item.source}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
                <p className="mt-4 text-on-surface-variant/40">---</p>
                <p><span className="text-on-surface-variant/40">07</span> <span className="text-secondary"># Or use the Python SDK:</span></p>
                <p><span className="text-on-surface-variant/40">08</span> <span className="text-green-400">from</span> x402.client <span className="text-green-400">import</span> Client</p>
                <p><span className="text-on-surface-variant/40">09</span> client = Client(wallet=my_wallet)</p>
                <p><span className="text-on-surface-variant/40">10</span> resp = client.get(<span className="text-tertiary">&quot;sagemolly.com/api/v1/search&quot;</span>)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
