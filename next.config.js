/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Environment variables available to the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
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

  // Experimental features
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;