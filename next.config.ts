import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '72.61.250.231',
      },
      {
        protocol: 'http',
        hostname: 'karthiktraders.in',
      },
    ],
  },
  // Ensure we can use the self-hosted Supabase URL
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  },
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
