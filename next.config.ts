import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
    ],
  },
}

export default nextConfig
