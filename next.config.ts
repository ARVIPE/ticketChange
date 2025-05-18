// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ✅ Use 'export' output for static site generation
  eslint: {
    ignoreDuringBuilds: true, // ✅ Ignore ESLint errors during build
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Ignore TypeScript type errors during build
  },
};

module.exports = nextConfig;
