import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow a fresh output folder when a synced workspace locks an old build cache.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  reactCompiler: true,
};

export default nextConfig;
