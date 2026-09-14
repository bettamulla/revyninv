const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force Node.js runtime — needed for bcryptjs, neon-http with WebSocket polyfill, and node-cron
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

module.exports = nextConfig;
