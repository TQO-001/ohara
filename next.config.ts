import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // We removed the rewrites entirely because /public/uploads 
  // is handled automatically by Next.js.

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Note: If you want to use the <Image /> component for local uploads,
    // you don't need remotePatterns for local paths.
  },
};

export default nextConfig;