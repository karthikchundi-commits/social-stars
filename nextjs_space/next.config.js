const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // Stub optional TF.js backends/deps we don't use (avoids build errors)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mediapipe/pose': false,
      '@tensorflow/tfjs-backend-webgpu': false,
      '@tensorflow/tfjs-backend-wasm': false,
    };
    return config;
  },
};

module.exports = nextConfig;
