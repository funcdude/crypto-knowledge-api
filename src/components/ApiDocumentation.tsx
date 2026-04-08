'use client'

import { useState } from 'react'

const TABS = ['Endpoints', 'Code Examples', 'X402 Flow', 'Pricing', 'Agent Integration']

export function ApiDocumentation() {
  const [activeTab, setActiveTab] = useState('Endpoints')

  const codeExamples = [
    {
      title: 'cURL Example',
      language: 'bash',
      code: `# Query without payment (returns HTTP 402)
curl "https://sagemolly.net/api/v1/search?q=bitcoin+consensus&tier=explanation"

# Query with X402 payment
curl "https://sagemolly.net/api/v1/search?q=bitcoin+consensus&tier=explanation" \\
  -H "X-Payment: 0x7a2d...f3e1"

# Get pricing tiers (free, no payment needed)
curl "https://sagemolly.net/api/v1/pricing"`,
    },
    {
      title: 'JavaScript/TypeScript',
      language: 'javascript',
      code: `const querySageMolly = async (query, tier = 'explanation') => {
  const url = 'https://sagemolly.net/api/v1/search'
  const params = new URLSearchParams({ q: query, tier })
  
  const response = await fetch(\`\${url}?\${params}\`)
  
  if (response.status === 402) {
    const paymentInfo = await response.json()
    // paymentInfo.price_usd = "0.01"
    // paymentInfo.payment.address = "0x..."
    
    // Make USDC payment on Base L2
    const txHash = await payWithUSDC(paymentInfo.payment)
    
    // Retry with payment proof
    return await fetch(\`\${url}?\${params}\`, {
      headers: { 'X-Payment': txHash }
    }).then(r => r.json())
  }
  
  return await response.json()
}

// Tiers: explanation ($0.01) | summary ($0.02) | analysis ($0.03)
const result = await querySageMolly("How does DeFi work?", "summary")`,
    },
    {
      title: 'Python',
      language: 'python',
      code: `import httpx

async def query_sage_molly(query: str, tier: str = "explanation"):
    url = "https://sagemolly.net/api/v1/search"
    params = {"q": query, "tier": tier}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        
        if response.status_code == 402:
            payment_info = response.json()
            # payment_info["price_usd"] = "0.01"
            
            # Make USDC payment on Base L2
            tx_hash = await pay_with_usdc(payment_info["payment"])
            
            # Retry with payment proof
            headers = {"X-Payment": tx_hash}
            response = await client.get(url, params=params, headers=headers)
        
        return response.json()

# Tiers: explanation ($0.01) | summary ($0.02) | analysis ($0.03)
result = await query_sage_molly("What is fractional reserve?", "analysis")`,
    },
  ]

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/search',
      description: 'Search crypto knowledge with semantic matching',
      params: 'q, tier, topics, complexity, max_results',
    },
    {
      method: 'POST',
      path: '/api/v1/search',
      description: 'Search with JSON payload for complex queries',
      params: 'JSON body with query object',
    },
    {
      method: 'GET',
      path: '/api/v1/concepts/{concept}',
      description: 'Get detailed explanation of specific concept',
      params: 'concept (path), tier (query)',
    },
    {
      method: 'GET',
      path: '/api/v1/compare',
      description: 'Compare two crypto concepts side-by-side',
      params: 'concept1, concept2, tier',
    },
    {
      method: 'GET',
      path: '/api/v1/pricing',
      description: 'Get current pricing tiers (free endpoint)',
      params: 'None',
    },
  ]

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden">

      {/* Tab Bar */}
      <div className="flex border-b border-outline-variant/10 bg-surface-container-lowest overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6 lg:p-10">

        {/* Endpoints Tab */}
        {activeTab === 'Endpoints' && (
          <div className="space-y-3">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="group bg-surface-container-lowest/50 border border-outline-variant/10 hover:border-primary/30 rounded-lg p-4 transition-all"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono ${
                    endpoint.method === 'GET'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="font-mono text-sm text-on-surface">{endpoint.path}</code>
                  <span className="text-sm text-on-surface-variant ml-auto hidden md:block">{endpoint.description}</span>
                </div>
                <p className="text-xs font-mono text-outline mt-2 ml-12">params: {endpoint.params}</p>
              </div>
            ))}
          </div>
        )}

        {/* Code Examples Tab */}
        {activeTab === 'Code Examples' && (
          <div className="space-y-6">
            {codeExamples.map((example, index) => (
              <div key={index} className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/15">
                <div className="bg-surface-container px-4 py-3 flex items-center justify-between border-b border-outline-variant/10">
                  <h4 className="text-on-surface font-semibold text-sm">{example.title}</h4>
                  <span className="text-xs font-mono text-on-surface-variant px-2 py-0.5 bg-surface-container-highest rounded">{example.language}</span>
                </div>
                <pre className="p-5 text-sm font-mono text-secondary leading-relaxed overflow-x-auto">
                  <code>{example.code}</code>
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* X402 Flow Tab */}
        {activeTab === 'X402 Flow' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: '🤖', title: 'AI Agent Query', desc: 'Agent makes API request' },
                { icon: '💳', title: 'HTTP 402', desc: 'Payment required response' },
                { icon: '⚡', title: 'USDC Payment', desc: 'Pay on Base L2 (~2s)' },
                { icon: '🧠', title: 'Knowledge', desc: 'Expert insights delivered' },
              ].map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/15 mb-3 terminal-glow">
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <div className="text-sm font-bold text-on-surface">{step.title}</div>
                  </div>
                  <p className="text-xs font-mono text-on-surface-variant">{step.desc}</p>
                  {i < 3 && (
                    <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-on-surface-variant/30 text-lg font-mono">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'Pricing' && (
          <div className="space-y-6">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-tight">Machine-Readable Pricing</h3>
                <span className="font-mono text-xs text-on-surface-variant px-2 py-1 bg-surface-container rounded">ENDPOINT: /api/v1/pricing</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <th className="text-left px-6 py-3 text-[10px] font-mono uppercase text-outline">Tier</th>
                      <th className="text-left px-6 py-3 text-[10px] font-mono uppercase text-outline">Param</th>
                      <th className="text-left px-6 py-3 text-[10px] font-mono uppercase text-outline">Cost (USDC)</th>
                      <th className="text-left px-6 py-3 text-[10px] font-mono uppercase text-outline">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { tier: 'Explanation', param: 'explanation', cost: '0.01', response: '1-2 paragraphs' },
                      { tier: 'Summary', param: 'summary', cost: '0.02', response: 'Detailed overview' },
                      { tier: 'Analysis', param: 'analysis', cost: '0.03', response: 'Comprehensive analysis' },
                    ].map((row, i) => (
                      <tr key={i} className={`border-b border-outline-variant/5 ${i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'}`}>
                        <td className="px-6 py-4 font-bold text-primary text-xs">{row.tier}</td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface">{row.param}</td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface">{row.cost}</td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">{row.response}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Agent Integration Tab */}
        {activeTab === 'Agent Integration' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Add Sage Molly to Your AI Agent</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Two ways to integrate Sage Molly&apos;s crypto knowledge into AI agents, tools, and directories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔌</span>
                  <h4 className="text-sm font-bold text-on-surface">MCP Server</h4>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Connect Claude, Cursor, or any MCP-compatible agent directly to Sage Molly&apos;s 5 crypto knowledge tools.
                </p>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-[10px] font-mono uppercase text-outline mb-2">Claude Code</p>
                  <code className="text-xs font-mono text-secondary block break-all">claude mcp add sagemolly https://sagemolly.net/mcp</code>
                </div>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-[10px] font-mono uppercase text-outline mb-2">MCP Config</p>
                  <pre className="text-xs font-mono text-secondary leading-relaxed">{`{
  "mcpServers": {
    "sagemolly": {
      "url": "https://sagemolly.net/mcp"
    }
  }
}`}</pre>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪪</span>
                  <h4 className="text-sm font-bold text-on-surface">ERC-8004 Agent Card</h4>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Standard identity card for agent directories like 8004scan.io. Includes name, capabilities, MCP endpoint, and payment wallet.
                </p>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-[10px] font-mono uppercase text-outline mb-2">Agent Card URL</p>
                  <a
                    href="https://sagemolly.net/.well-known/agent.json"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-primary hover:underline break-all"
                  >
                    https://sagemolly.net/.well-known/agent.json
                  </a>
                </div>
                <p className="text-[10px] text-on-surface-variant/60">
                  Submit this URL to 8004scan.io to list Sage Molly in the agent registry.
                </p>
              </div>

            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-6">
              <h4 className="text-sm font-bold text-on-surface mb-3">MCP Tools Available</h4>
              <div className="space-y-2">
                {[
                  { name: 'search_crypto_knowledge', desc: 'Semantic search across 975 book passages', params: 'query, tier, max_results, topics, complexity' },
                  { name: 'get_concept', desc: 'Detailed explanation of a specific crypto concept', params: 'concept, tier' },
                  { name: 'compare_concepts', desc: 'Side-by-side comparison of two concepts', params: 'concept1, concept2, tier' },
                  { name: 'get_pricing', desc: 'Current pricing tiers (free, no payment)', params: 'none' },
                ].map((tool, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-4 py-2 border-b border-outline-variant/5 last:border-0">
                    <code className="font-mono text-xs text-primary font-bold">{tool.name}</code>
                    <span className="text-xs text-on-surface-variant">{tool.desc}</span>
                    <span className="text-[10px] font-mono text-outline ml-auto hidden md:block">params: {tool.params}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
