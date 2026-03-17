export function ApiDocumentation() {
  const codeExamples = [
    {
      title: 'cURL Example',
      language: 'bash',
      code: `# Query without payment (returns HTTP 402)
curl "http://localhost:8000/api/v1/search?q=bitcoin&tier=explanation"

# Query with X402 payment
curl "http://localhost:8000/api/v1/search?q=bitcoin&tier=explanation" \\
  -H "X-Payment: 0x1234...transaction-hash"`
    },
    {
      title: 'JavaScript/TypeScript',
      language: 'javascript',
      code: `const queryKnowledge = async (query, tier = 'explanation') => {
  const url = 'http://localhost:8000/api/v1/search'
  const params = new URLSearchParams({ q: query, tier })
  
  const response = await fetch(\`\${url}?\${params}\`)
  
  if (response.status === 402) {
    const paymentInfo = await response.json()
    console.log('Payment required:', paymentInfo)
    
    // Make USDC payment on Base L2
    const txHash = await payWithUSDC(paymentInfo.payment)
    
    // Retry with payment proof
    const retryResponse = await fetch(\`\${url}?\${params}\`, {
      headers: { 'X-Payment': txHash }
    })
    
    return await retryResponse.json()
  }
  
  return await response.json()
}`
    },
    {
      title: 'Python',
      language: 'python',
      code: `import httpx
import asyncio

async def query_crypto_knowledge(query: str, tier: str = "explanation"):
    url = "http://localhost:8000/api/v1/search"
    params = {"q": query, "tier": tier}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        
        if response.status_code == 402:
            payment_info = response.json()
            print("Payment required:", payment_info)
            
            # Make USDC payment
            tx_hash = await pay_with_usdc(payment_info["payment"])
            
            # Retry with payment
            headers = {"X-Payment": tx_hash}
            response = await client.get(url, params=params, headers=headers)
        
        return response.json()

# Usage
result = await query_crypto_knowledge("How does Bitcoin work?")`
    },
    {
      title: 'MCP Server Integration',
      language: 'json',
      code: `{
  "mcpServers": {
    "crypto-knowledge": {
      "command": "npx",
      "args": ["crypto-knowledge-mcp"],
      "env": {
        "API_URL": "http://localhost:8000",
        "WALLET_PRIVATE_KEY": "your-private-key"
      }
    }
  }
}`
    }
  ]

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/search',
      description: 'Search crypto knowledge with semantic matching',
      params: 'q, tier, topics, complexity, max_results'
    },
    {
      method: 'POST',
      path: '/api/v1/search',
      description: 'Search with JSON payload for complex queries',
      params: 'JSON body with query object'
    },
    {
      method: 'GET',
      path: '/api/v1/concepts/{concept}',
      description: 'Get detailed explanation of specific concept',
      params: 'concept (path), tier (query)'
    },
    {
      method: 'GET',
      path: '/api/v1/compare',
      description: 'Compare two crypto concepts side-by-side',
      params: 'concept1, concept2, tier'
    },
    {
      method: 'GET',
      path: '/api/v1/timeline/{topic}',
      description: 'Get historical timeline for crypto topic',
      params: 'topic (path), tier (query)'
    },
    {
      method: 'GET',
      path: '/api/v1/pricing',
      description: 'Get current pricing tiers (free endpoint)',
      params: 'None'
    }
  ]

  return (
    <div className="space-y-8">
      {/* API Endpoints */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-2xl font-bold mb-6">API Endpoints</h3>
        <div className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border-l-4 border-primary-500 pl-4">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  endpoint.method === 'GET' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {endpoint.path}
                </code>
              </div>
              <p className="text-gray-600 text-sm mb-1">{endpoint.description}</p>
              <p className="text-xs text-gray-500">Parameters: {endpoint.params}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">Integration Examples</h3>
        
        {codeExamples.map((example, index) => (
          <div key={index} className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
              <h4 className="text-white font-semibold">{example.title}</h4>
              <span className="text-xs text-gray-400">{example.language}</span>
            </div>
            <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
              <code>{example.code}</code>
            </pre>
          </div>
        ))}
      </div>

      {/* Payment Flow */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6">
        <h3 className="text-2xl font-bold mb-4">X402 Payment Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="text-2xl mb-2">🤖</div>
              <div className="text-sm font-semibold">AI Agent Query</div>
            </div>
            <p className="text-xs text-gray-600">Agent makes API request</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="text-2xl mb-2">💳</div>
              <div className="text-sm font-semibold">HTTP 402</div>
            </div>
            <p className="text-xs text-gray-600">Payment required response</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-semibold">USDC Payment</div>
            </div>
            <p className="text-xs text-gray-600">Pay on Base L2 (~2s)</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="text-2xl mb-2">🧠</div>
              <div className="text-sm font-semibold">Knowledge</div>
            </div>
            <p className="text-xs text-gray-600">Expert insights delivered</p>
          </div>
        </div>
      </div>
    </div>
  )
}