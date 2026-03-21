import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    '@raio-x/types',
    '@raio-x/utils',
  ],
};

export default nextConfig;
