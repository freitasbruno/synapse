import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow any HTTPS image — needed for user-supplied URLs in content blocks.
      { protocol: 'https', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        // Allow the embed pages to be framed from any origin. Other routes are unchanged.
        source: '/embed/:path*',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
      },
    ]
  },
};

export default nextConfig;
