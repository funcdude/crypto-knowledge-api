'use client'

import { useState, useEffect } from 'react'

const TIERS = [
  { id: 'explanation', label: 'Explanation', price: '$0.01' },
  { id: 'summary', label: 'Summary', price: '$0.02' },
  { id: 'analysis', label: 'Analysis', price: '$0.03' },
]

const TIER_COSTS: Record<string, string> = {
  explanation: '$0.01',
  summary: '$0.02',
  analysis: '$0.03',
}

const TIER_MAX_RESULTS: Record<string, number> = {
  explanation: 2,
  summary: 4,
  analysis: 6,
}

const FREE_LIMIT = 3
const BOOK_URL = 'https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ'

export function SearchDemo() {
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState('explanation')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [queriesUsed, setQueriesUsed] = useState(0)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sage_molly_email')
    if (stored) {
      setEmail(stored)
      setEmailSubmitted(true)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/free-status?email=${encodeURIComponent(stored)}`)
        .then((r) => r.json())
        .then((data) => {
          const count = data.queries_used ?? 0
          setQueriesUsed(count)
          localStorage.setItem('sage_molly_queries_used', String(count))
          if (count >= FREE_LIMIT) setLimitReached(true)
        })
        .catch(() => {
          const storedCount = localStorage.getItem('sage_molly_queries_used')
          if (storedCount) {
            const count = parseInt(storedCount, 10)
            setQueriesUsed(count)
            if (count >= FREE_LIMIT) setLimitReached(true)
          }
        })
    }
  }, [])

  const handleEmailSubmit = () => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) return
    localStorage.setItem('sage_molly_email', trimmed)
    setEmailSubmitted(true)
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      if (!limitReached) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/free-search`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              query: query.trim(),
              tier,
              max_results: TIER_MAX_RESULTS[tier] || 2,
            }),
          }
        )

        const data = await response.json()

        if (data.status === 'limit_reached') {
          setLimitReached(true)
          localStorage.setItem('sage_molly_queries_used', String(data.queries_used))
          setQueriesUsed(data.queries_used)
          setResult({ type: 'limit_reached', data })
        } else if (data.status === 'success') {
          setQueriesUsed(data.queries_used)
          localStorage.setItem('sage_molly_queries_used', String(data.queries_used))
          setResult({ type: 'success', data })
        } else {
          setError(data.detail || 'Search failed')
        }
      } else {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/search?q=${encodeURIComponent(query)}&tier=${tier}&max_results=${TIER_MAX_RESULTS[tier] || 3}`
        )
        const data = await response.json()

        if (response.status === 402) {
          setResult({ type: 'payment_required', data })
        } else if (response.ok) {
          setResult({ type: 'success', data })
        } else {
          setError(data.message || 'Search failed')
        }
      }
    } catch (err) {
      setError('Network error — API may not be running')
    } finally {
      setLoading(false)
    }
  }

  const showBookCTA = queriesUsed >= 2

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* Left: Query Form */}
      <div className="lg:col-span-7">
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/15 p-6 space-y-6">

          {/* Email Gate */}
          {!emailSubmitted ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-2">Ask Sage Molly — 3 Free Questions</h3>
                <p className="text-on-surface-variant text-sm">
                  Enter your email to get started. No wallet needed.
                </p>
              </div>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={!email.trim() || !email.includes('@')}
                  className="px-6 py-3 engine-gradient text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start
                </button>
              </div>
              <p className="text-[10px] text-on-surface-variant/40 italic">
                Sage Molly educates, not advises. Nothing here is financial advice. Always do your own research.
              </p>
            </div>
          ) : (
            <>
              {/* Free Queries Counter */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">
                  {limitReached ? (
                    <span className="text-primary font-mono">Free questions used — X402 pay-per-query active</span>
                  ) : (
                    <>
                      <span className="font-mono text-primary">{FREE_LIMIT - queriesUsed}</span> free question{FREE_LIMIT - queriesUsed !== 1 ? 's' : ''} remaining
                    </>
                  )}
                </span>
                {!limitReached && (
                  <div className="flex gap-1">
                    {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < queriesUsed ? 'bg-primary' : 'bg-outline-variant/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tier Selector — only show when free limit reached */}
              {limitReached && (
                <div className="grid grid-cols-3 gap-3">
                  {TIERS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTier(t.id)}
                      className={`p-4 rounded-lg text-left transition-all ${
                        tier === t.id
                          ? 'bg-surface-container-highest border-2 border-primary shadow-[0_0_20px_rgba(173,198,255,0.1)]'
                          : 'bg-surface-container-lowest border border-outline-variant/15 hover:border-primary/50'
                      }`}
                    >
                      <span className={`block text-[10px] uppercase tracking-widest mb-1 ${
                        tier === t.id ? 'text-primary' : 'text-outline'
                      }`}>
                        {t.label}
                      </span>
                      <span className={`block font-mono text-sm font-bold ${
                        tier === t.id ? 'text-primary' : 'text-on-surface'
                      }`}>
                        {t.price}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Input */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-2">
                  Ask Sage Molly
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. How does Bitcoin mining work?"
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Example Prompts */}
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/50 mb-2">Try these</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'What is money?',
                    'Genghis Khan and money?',
                    'What is fractional reserve?',
                    'What are NFTs?',
                    'Ethereum vs Bitcoin?',
                    'What is Solana?',
                    'What is the future of money?',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setQuery(example)}
                      className="px-2.5 py-1 text-xs text-on-surface-variant bg-surface-container-lowest border border-outline-variant/20 rounded-full hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost Preview */}
              {limitReached && (
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-on-surface-variant">
                    Cost:{' '}
                    <span className="font-mono text-primary">{TIER_COSTS[tier]} USDC</span>
                  </span>
                  <span className="text-xs text-outline font-mono italic">Base L2 · ~2s settlement</span>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="w-full engine-gradient py-3 px-6 rounded-lg font-black text-on-primary uppercase text-sm tracking-tight hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : limitReached ? 'Pay & Search' : 'Ask Sage Molly'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-5">
        <div className="h-full min-h-[280px] bg-surface-container rounded-xl border border-outline-variant/15 p-6 flex flex-col">

          {/* Empty state */}
          {!result && !error && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="text-on-surface-variant/30 text-4xl font-mono">_</div>
              <p className="text-on-surface-variant/50 text-sm">Sage Molly&apos;s answers will appear here</p>
              <p className="text-on-surface-variant/30 text-xs">Enter a question and search</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="text-on-surface-variant text-xs">Sage Molly is thinking...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 rounded bg-error/10 text-error text-[10px] font-bold uppercase tracking-widest">Error</span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {/* Limit Reached */}
          {result?.type === 'limit_reached' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">Free Limit Reached</span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed mb-4">
                You&apos;ve used all {FREE_LIMIT} free questions. Select a tier above and pay with USDC on Base L2 for unlimited access.
              </p>
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto block text-center px-4 py-3 engine-gradient text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Want to go deeper? Get the full book
              </a>
            </div>
          )}

          {/* Payment Required */}
          {result?.type === 'payment_required' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">Payment Required</span>
                <span className="text-xs font-mono text-on-surface-variant">HTTP 402</span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed mb-4">
                X402 Payment System active. AI agents automatically pay{' '}
                <span className="font-mono text-primary">{result.data.price_usd} USDC</span> on Base L2 to access this knowledge.
              </p>
              <div className="mt-auto">
                <span className="block text-[10px] uppercase text-outline mb-2 font-mono">Payment Details</span>
                <pre className="bg-surface-container-lowest text-secondary font-mono text-[11px] p-3 rounded border border-outline-variant/15 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Success */}
          {result?.type === 'success' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest">Knowledge Retrieved</span>
                {result.data.queries_remaining !== undefined && (
                  <span className="text-xs font-mono text-on-surface-variant">
                    {result.data.queries_remaining} free left
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                {result.data.results?.map((item: any, index: number) => (
                  <div key={index} className="bg-surface-container-lowest rounded border border-outline-variant/15 p-3">
                    <p className="text-on-surface text-sm leading-relaxed mb-1">{item.content}</p>
                    {item.source && (
                      <p className="text-[10px] text-on-surface-variant/60">
                        {item.source?.author}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Book CTA — after 2nd response */}
              {showBookCTA && (
                <a
                  href={BOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center px-4 py-2.5 bg-surface-container-lowest border border-primary/20 text-primary text-xs font-semibold rounded-lg hover:bg-surface-container-highest transition-colors"
                >
                  Want to go deeper? Get &ldquo;Cryptocurrencies Decrypted&rdquo; on Amazon
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
