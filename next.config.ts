import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow any HTTPS image — needed for user-supplied URLs in content blocks.
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
