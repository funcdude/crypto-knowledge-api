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
        '~100 tokens max',
      ],
      popular: false,
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
        '~300 tokens max',
      ],
      popular: true,
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
        '~800 tokens max',
      ],
      popular: false,
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
        '~1500 tokens max',
      ],
      popular: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map((tier, index) => (
        <div
          key={index}
          className={`relative rounded-xl p-6 transition-all ${
            tier.popular
              ? 'bg-surface-container border-2 border-primary shadow-[0_0_30px_rgba(173,198,255,0.08)]'
              : 'bg-surface-container-low border border-outline-variant/15 hover:bg-surface-container'
          }`}
        >
          {tier.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="engine-gradient text-on-primary px-3 py-1 text-[10px] font-bold rounded-full tracking-widest uppercase font-mono">
                Most Popular
              </span>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-base font-bold text-on-surface mb-2 uppercase tracking-tight">{tier.name}</h3>
            <div className="mb-2 flex items-baseline gap-1">
              <span className={`text-2xl font-bold font-mono ${tier.popular ? 'text-primary' : 'text-on-surface'}`}>
                {tier.price}
              </span>
              <span className="text-on-surface-variant text-sm">USDC</span>
            </div>
            <p className="text-on-surface-variant text-xs leading-relaxed">{tier.description}</p>
          </div>

          <ul className="space-y-2 mb-6">
            {tier.features.map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start gap-2">
                <svg
                  className={`h-4 w-4 mt-0.5 flex-shrink-0 ${tier.popular ? 'text-primary' : 'text-green-400'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-on-surface-variant text-xs leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          <div>
            <div className="text-[10px] font-mono text-outline mb-3">
              Pay with USDC on Base L2<br />
              ~2 second settlement
            </div>
            <button
              className={`w-full py-2 px-4 rounded-lg text-sm font-bold uppercase tracking-tight transition-all ${
                tier.popular
                  ? 'engine-gradient text-on-primary hover:opacity-90 active:scale-95'
                  : 'bg-surface-container-highest text-on-surface border border-outline-variant/20 hover:bg-surface-bright'
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
