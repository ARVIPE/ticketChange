// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Ignore ESLint errors during build
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignore TypeScript type errors during build
  },
};

module.exports = nextConfig;
