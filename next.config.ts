import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['72.61.250.231', 'karthiktraders.in', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure we can use the self-hosted Supabase URL
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  },
};

export default nextConfig;
