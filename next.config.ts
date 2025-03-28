import type { NextConfig } from "next";

const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.plugins.push(new NodePolyfillPlugin());
    config.resolve.fallback = {
      process: require.resolve("process/browser"),
      ...config.resolve.fallback,
    };
    return config;
  },
};

export default nextConfig;
