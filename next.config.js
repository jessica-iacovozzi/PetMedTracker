/** @type {import('next').NextConfig} */

const nextConfig = {
  // Ensure environment variables are available at build time
  experimental: {
    // Enable server actions
    serverActions: true,
  },
  // Configure redirects for environment-specific URLs
  async redirects() {
    return [
      // Redirect old URLs if needed
    ];
  },
  // Configure headers for security and environment identification
  async headers() {
    const environment = process.env.VERCEL_ENV || "development";

    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Environment",
            value: environment,
          },
          {
            key: "X-App-Version",
            value: process.env.npm_package_version || "unknown",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Environment",
            value: environment,
          },
        ],
      },
    ];
  },
  // Configure public runtime config for client-side environment detection
  publicRuntimeConfig: {
    environment: process.env.VERCEL_ENV || "development",
  },
};

module.exports = nextConfig;
