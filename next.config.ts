import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode is a best practice and should be kept enabled.
  reactStrictMode: true,

  // The 'typescript' and 'eslint' blocks have been removed.
  // This will now correctly show you all the hidden errors when you run the build command.
};

export default nextConfig;