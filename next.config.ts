import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
