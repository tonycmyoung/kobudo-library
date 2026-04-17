/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable server-side source maps so stack traces in trace logs show original
    // TypeScript source paths instead of compiled chunk paths (e.g. in Vercel preview/prod)
    serverSourceMaps: true,
  },
  images: {
    // Enable Next.js image optimization for better LCP on mobile
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  env: {
    // Build timestamp - generated at build time
    NEXT_PUBLIC_BUILD_TIMESTAMP: new Date().toISOString(),
    // App version from package.json
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.1.0",
    // Vercel automatically provides these, but we expose them with NEXT_PUBLIC prefix
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "local",
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || "local",
  },
}

export default nextConfig
