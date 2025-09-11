/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {
    // Make environment detection available to the client
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
    // Make Supabase environment variables available to the client
    STAGING_SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
    STAGING_SUPABASE_ANON_KEY: process.env.STAGING_SUPABASE_ANON_KEY,
    PROD_SUPABASE_URL: process.env.PROD_SUPABASE_URL,
    PROD_SUPABASE_ANON_KEY: process.env.PROD_SUPABASE_ANON_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
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
