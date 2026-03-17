'use client'

import { useState } from 'react'

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
        setResult({
          type: 'payment_required',
          data: data
        })
      } else if (response.ok) {
        setResult({
          type: 'success',
          data: data
        })
      } else {
        setError(data.message || 'Search failed')
      }
    } catch (err) {
      setError('Network error - API may not be running')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <div className="space-y-6">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Crypto Knowledge
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. How does Bitcoin mining work?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Tier Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Response Tier
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="snippet">Snippet ($0.001) - Quick answer</option>
            <option value="explanation">Explanation ($0.005) - Detailed response</option>
            <option value="analysis">Analysis ($0.01) - Comprehensive analysis</option>
            <option value="chapter_summary">Chapter Summary ($0.02) - Full insights</option>
          </select>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Knowledge'}
        </button>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result?.type === 'payment_required' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              💳 Payment Required (Demo Mode)
            </h3>
            <div className="bg-white p-4 rounded border">
              <pre className="text-sm text-gray-600 overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
            <p className="text-blue-700 mt-4">
              ✅ <strong>X402 Payment System Working!</strong> In production, AI agents would automatically pay 
              {result.data.price_usd} USDC on Base L2 to access this knowledge.
            </p>
          </div>
        )}

        {result?.type === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              ✅ Knowledge Retrieved
            </h3>
            <div className="space-y-4">
              {result.data.results?.map((item: any, index: number) => (
                <div key={index} className="bg-white p-4 rounded border">
                  <p className="text-gray-800 mb-2">{item.content}</p>
                  <div className="text-sm text-gray-500">
                    Source: {item.source?.book} - {item.chapter}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-green-700">
              Cost: ${result.data.cost_usd} | Processing: {result.data.processing_time_ms}ms
            </div>
          </div>
        )}
      </div>
    </div>
  )
}