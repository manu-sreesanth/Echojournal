import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* your existing config options */
  eslint: {
    ignoreDuringBuilds: true, // <-- ignores ESLint errors on Vercel build
  },
};

export default nextConfig;

