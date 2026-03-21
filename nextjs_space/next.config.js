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
    config.resolve.alias = {
      ...config.resolve.alias,
      // Stub unused optional backends
      '@mediapipe/pose': false,
      '@tensorflow/tfjs-backend-webgpu': false,
      '@tensorflow/tfjs-backend-wasm': false,
      // Force all TF.js packages to share ONE copy of core — prevents
      // the "n.incRef is not a function" error caused by dual instances
      '@tensorflow/tfjs-core': require.resolve('@tensorflow/tfjs-core'),
    };
    return config;
  },
};

module.exports = nextConfig;
