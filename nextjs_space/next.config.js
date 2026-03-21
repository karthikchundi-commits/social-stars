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
      // Force all TF.js packages to share ONE copy of core (prevents
      // "n.incRef is not a function" from duplicate module instances).
      // Must point to the package directory, not a file, so that
      // sub-path imports like @tensorflow/tfjs-core/dist/... still resolve.
      '@tensorflow/tfjs-core': path.resolve(__dirname, 'node_modules/@tensorflow/tfjs-core'),
    };
    return config;
  },
};

module.exports = nextConfig;
