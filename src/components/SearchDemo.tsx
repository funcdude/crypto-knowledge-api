'use client'

import { useState } from 'react'

const TIERS = [
  { id: 'snippet', label: 'Snippet', price: '$0.001' },
  { id: 'explanation', label: 'Explanation', price: '$0.005' },
  { id: 'analysis', label: 'Analysis', price: '$0.01' },
  { id: 'chapter_summary', label: 'Summary', price: '$0.02' },
]

const TIER_COSTS: Record<string, string> = {
  snippet: '$0.001',
  explanation: '$0.005',
  analysis: '$0.01',
  chapter_summary: '$0.02',
}

export function SearchDemo() {
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState('explanation')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/search?q=${encodeURIComponent(query)}&tier=${tier}`
      )

      const data = await response.json()

      if (response.status === 402) {
        setResult({ type: 'payment_required', data })
      } else if (response.ok) {
        setResult({ type: 'success', data })
      } else {
        setError(data.message || 'Search failed')
      }
    } catch (err) {
      setError('Network error — API may not be running')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* Left: Query Form */}
      <div className="lg:col-span-7">
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/15 p-6 space-y-6">

          {/* Tier Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

          {/* Search Input */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-on-surface-variant mb-2">
              Search Crypto Knowledge
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. How does Bitcoin mining work?"
              rows={3}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Cost Preview */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-on-surface-variant">
              Estimated cost:{' '}
              <span className="font-mono text-primary">{TIER_COSTS[tier]} USDC</span>
            </span>
            <span className="text-xs text-outline font-mono italic">Base L2 · ~2s settlement</span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full engine-gradient py-3 px-6 rounded-lg font-black text-on-primary uppercase text-sm tracking-tight hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Pay & Search'}
          </button>
        </div>
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-5">
        <div className="h-full min-h-[280px] bg-surface-container rounded-xl border border-outline-variant/15 p-6 flex flex-col">

          {/* Empty state */}
          {!result && !error && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="text-on-surface-variant/30 text-4xl font-mono">_</div>
              <p className="text-on-surface-variant/50 text-sm">Results will appear here</p>
              <p className="text-on-surface-variant/30 text-xs">Enter a question and run a search</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="text-on-surface-variant text-xs">Searching...</p>
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

          {/* Payment Required */}
          {result?.type === 'payment_required' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">Payment Required</span>
                <span className="text-xs font-mono text-on-surface-variant">HTTP 402</span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed mb-4">
                💳 X402 Payment System Working! In production, AI agents would automatically pay{' '}
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
                <span className="text-xs font-mono text-green-400">HTTP 200</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                {result.data.results?.map((item: any, index: number) => (
                  <div key={index} className="bg-surface-container-lowest rounded border border-outline-variant/15 p-3">
                    <p className="text-on-surface text-sm leading-relaxed mb-1">{item.content}</p>
                    {item.source && (
                      <p className="text-[10px] text-on-surface-variant/60 truncate">
                        {item.source?.book} — {item.chapter}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/10">
                <div>
                  <span className="text-[10px] text-outline uppercase font-mono block">Cost</span>
                  <span className="font-mono text-sm font-bold text-primary">${result.data.cost_usd} USDC</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-outline uppercase font-mono block">Processing</span>
                  <span className="font-mono text-sm text-on-surface-variant">{result.data.processing_time_ms}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
