import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    TRANSPARENCY_API_KEY: process.env.TRANSPARENCY_API_KEY,
  },
};

export default nextConfig;
