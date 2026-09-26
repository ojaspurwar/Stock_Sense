import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore
    externalDir: true,
  },
};

export default nextConfig;
