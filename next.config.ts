import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  }
  // Removing turbopack configuration due to lightningcss compatibility issues
};

export default nextConfig;
