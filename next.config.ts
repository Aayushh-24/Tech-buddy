import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Re-enabling React Strict Mode is highly recommended as it helps
  // identify potential problems in your application during development.
  reactStrictMode: true,

  // WARNING: The following options are kept to prevent your build from failing
  // due to existing errors in your code. It is strongly recommended to fix
  // the underlying TypeScript and ESLint errors and remove these lines
  // for a stable production application.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // The custom webpack configuration has been removed as it interferes with
  // Vercel's optimized build and deployment process.
};

export default nextConfig;