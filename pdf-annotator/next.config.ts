import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Support for PDF.js worker
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    return config;
  },
};

export default nextConfig;
