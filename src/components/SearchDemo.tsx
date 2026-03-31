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

const PRELOADED_RESULT = {
  type: 'sample' as const,
  data: {
    results: [
      {
        content: 'At its essence, money is a social technology\u2014a tool that facilitates the transfer of value over time and space. It serves as a medium of exchange, a store of value, and a unit of measurement. But to truly understand money, we need to explore the underlying concepts that make it work.',
        source: { author: 'Cryptocurrencies Decrypted \u2014 Oskar Hurme' },
      },
      {
        content: 'Throughout history, different cultures have used different technologies as money. At its simplest, when a hunter gives a piece of deer meat to his friend, a bond is created\u2014an expectation that at some point his friend will return the favor.',
        source: { author: 'Cryptocurrencies Decrypted \u2014 Oskar Hurme' },
      },
    ],
  },
}

function ConsentModal({ email, onAccept, onDecline }: { email: string; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-on-surface mb-1">Join the Sage Molly list?</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            By continuing, <span className="font-mono text-primary">{email}</span> will be added to our mailing list.
            You may receive occasional updates and promotional content about crypto education.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant text-sm font-semibold rounded-lg hover:border-outline-variant/50 transition-colors"
          >
            No thanks
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2.5 engine-gradient text-on-primary text-sm font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            I agree
          </button>
        </div>
        <p className="text-[10px] text-on-surface-variant/40 text-center">
          You can unsubscribe at any time.
        </p>
      </div>
    </div>
  )
}

export function SearchDemo() {
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState('explanation')
  const [result, setResult] = useState<any>(PRELOADED_RESULT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [queriesUsed, setQueriesUsed] = useState(0)
  const [limitReached, setLimitReached] = useState(false)

  const [showConsent, setShowConsent] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('sage_molly_email')
    if (stored) {
      setEmail(stored)
      setEmailSubmitted(true)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/free-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: stored }),
      })
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
    setPendingEmail(trimmed)
    setShowConsent(true)
  }

  const handleConsentAccept = () => {
    setShowConsent(false)
    localStorage.setItem('sage_molly_email', pendingEmail)
    localStorage.setItem('sage_molly_consent', 'true')
    setEmailSubmitted(true)

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/crm-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingEmail }),
    }).catch(() => {})
  }

  const handleConsentDecline = () => {
    setShowConsent(false)
    localStorage.setItem('sage_molly_email', pendingEmail)
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
        } else if (data.status === 'low_match') {
          setQueriesUsed(data.queries_used)
          localStorage.setItem('sage_molly_queries_used', String(data.queries_used))
          setResult({ type: 'low_match', data })
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

      {showConsent && (
        <ConsentModal
          email={pendingEmail}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}

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

          {/* Low Match */}
          {result?.type === 'low_match' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-widest">Low Relevance</span>
                {result.data.top_match_percent !== undefined && (
                  <span className="text-xs font-mono text-on-surface-variant">{result.data.top_match_percent}% match</span>
                )}
              </div>
              <p className="text-on-surface text-sm leading-relaxed mb-2">{result.data.message}</p>
              <p className="text-on-surface-variant/60 text-xs leading-relaxed">
                Sage Molly&apos;s knowledge is based on &ldquo;Cryptocurrencies Decrypted&rdquo; — try rephrasing your question around crypto, blockchain, DeFi, or monetary systems.
              </p>
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

          {/* Sample — preloaded example */}
          {result?.type === 'sample' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">Sample Answer</span>
                <span className="text-xs font-mono text-on-surface-variant/50">&ldquo;What is money?&rdquo;</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                {result.data.results?.map((item: any, index: number) => (
                  <div key={index} className="bg-surface-container-lowest rounded border border-outline-variant/15 p-3">
                    {item.match_percent !== undefined && (
                      <span className="text-[10px] font-mono text-primary/70 block mb-1">{item.match_percent}% match</span>
                    )}
                    <p className="text-on-surface text-sm leading-relaxed mb-1">{item.content}</p>
                    {item.source && (
                      <p className="text-[10px] text-on-surface-variant/60">
                        {item.source?.author}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] text-on-surface-variant/40 italic">
                This is a real answer from Sage Molly. Enter your email to ask your own questions.
              </p>
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
                {result.data.results?.map((item: any, index: number) => {
                  const shareText = `${item.content?.slice(0, 200)}… — via Sage Molly (sagemolly.com)`
                  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://sagemolly.com'
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
                  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
                  const handleCopy = () => {
                    navigator.clipboard.writeText(`${item.content}\n\n— via Sage Molly (${shareUrl})`)
                  }
                  return (
                    <div key={index} className="bg-surface-container-lowest rounded border border-outline-variant/15 p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-primary/70">{item.match_percent ?? Math.min(Math.max(Math.round(((item.relevance_score || 0) - 0.70) / 0.16 * 100), 0), 100)}% match</span>
                        <div className="flex gap-2 items-center">
                          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" title="Share on X" className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          </a>
                          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" title="Share on LinkedIn" className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          </a>
                          <button onClick={handleCopy} title="Copy answer" className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-on-surface text-sm leading-relaxed mb-1">{item.content}</p>
                      {item.source && (
                        <p className="text-[10px] text-on-surface-variant/60">
                          {item.source?.author}
                        </p>
                      )}
                    </div>
                  )
                })}
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
