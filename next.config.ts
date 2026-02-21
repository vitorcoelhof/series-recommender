import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/genai'],
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
