/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-ancestors 'self'" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
      {
        source: '/health/:path*',
        destination: 'http://localhost:8000/health/:path*',
      },
      {
        source: '/x402/:path*',
        destination: 'http://localhost:8000/x402/:path*',
      },
      {
        source: '/.well-known/:path*',
        destination: 'http://localhost:8000/.well-known/:path*',
      },
      {
        source: '/mcp/:path*',
        destination: 'http://localhost:8000/mcp/:path*',
      },
    ];
  },

  // Environment variables available to the client
  // NEXT_PUBLIC_API_URL is empty — calls are relative URLs, proxied above.
  env: {
    NEXT_PUBLIC_API_URL: '',
    NEXT_PUBLIC_PAYMENT_ADDRESS: process.env.NEXT_PUBLIC_PAYMENT_ADDRESS || '0x28e6b3e3e32308787f50e6d99e2b98745b381946',
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '8453',
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle Node.js modules in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  // ESLint configuration
  eslint: {
    // Only run ESLint on specific directories during production builds
    dirs: ['src'],
  },

  // TypeScript configuration
  typescript: {
    // Allow production builds to successfully complete even if there are type errors
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    domains: ['localhost'],
  },

};

module.exports = nextConfig;