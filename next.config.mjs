/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  transpilePackages: ['three', 'sonner'],
  experimental: {
    serverMinification: false,
  },
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' };
    return config;
  },
};

export default nextConfig;

