/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {
    // Make environment detection available to the client
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
  // Ensure environment variables are available at build time
  experimental: {
    // Enable server actions
    serverActions: true,
  },
  // Configure redirects for environment-specific URLs
  async redirects() {
    return [
      // Redirect old URLs if needed
    ]
  },
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Environment',
            value: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;