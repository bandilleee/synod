import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for better production builds
  output: "standalone",
  
  // Disable ESLint during builds (we run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during builds (we run it separately)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
