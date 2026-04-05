import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // We check types separately; this speeds up builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
