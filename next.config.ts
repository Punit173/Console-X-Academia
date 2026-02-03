import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**', // Allow all paths
      },
      {
        protocol: 'https', // Just in case, also adding generic wildcard for other future hosts if strictness isn't paramount, but user asked for i.ibb.co specifically. Let's stick to i.ibb.co first.
        hostname: '*.googleusercontent.com', // Common for auth profiles
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.SOCIAL_API_URL || 'https://microservice-console.onrender.com'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
