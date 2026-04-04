const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid picking a parent-folder lockfile as the workspace root when multiple exist.
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

module.exports = nextConfig;
