export function PricingDisplay() {
  const tiers = [
    {
      name: 'Snippet',
      price: '$0.001',
      priceNum: 0.001,
      description: 'Quick answer, 1-2 sentences',
      features: [
        'Simple fact checking',
        'Basic concept definitions',
        'Quick yes/no answers',
        '~100 tokens max'
      ],
      popular: false
    },
    {
      name: 'Explanation',
      price: '$0.005',
      priceNum: 0.005,
      description: 'Detailed explanation, 1-2 paragraphs',
      features: [
        'Concept understanding',
        'How-to explanations',
        'Context and background',
        '~300 tokens max'
      ],
      popular: true
    },
    {
      name: 'Analysis',
      price: '$0.01',
      priceNum: 0.01,
      description: 'Multi-concept analysis, comprehensive',
      features: [
        'Complex comparisons',
        'Pros and cons analysis',
        'Multiple perspectives',
        '~800 tokens max'
      ],
      popular: false
    },
    {
      name: 'Chapter Summary',
      price: '$0.02',
      priceNum: 0.02,
      description: 'Full chapter insights and context',
      features: [
        'Deep research insights',
        'Historical context',
        'Complete frameworks',
        '~1500 tokens max'
      ],
      popular: false
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map((tier, index) => (
        <div
          key={index}
          className={`relative bg-white rounded-xl shadow-sm border-2 p-6 ${
            tier.popular
              ? 'border-primary-500 ring-2 ring-primary-200'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-3 py-1 text-sm font-semibold rounded-full">
                Most Popular
              </span>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
            <div className="mb-2">
              <span className="text-3xl font-bold text-primary-600">{tier.price}</span>
              <span className="text-gray-500"> USDC</span>
            </div>
            <p className="text-gray-600 text-sm">{tier.description}</p>
          </div>

          <ul className="space-y-3 mb-6">
            {tier.features.map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-600 text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <div className="text-xs text-gray-500 mb-3">
              Pay with USDC on Base L2<br />
              ~2 second settlement
            </div>
            <button
              className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                tier.popular
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Try {tier.name}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}