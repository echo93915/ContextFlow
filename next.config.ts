import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Updated for Next.js 15 - moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['pdf-parse'],
  
  // Configure Turbopack for better compatibility
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle PDF libraries and their dependencies
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
        'utf-8-validate': 'utf-8-validate',
        'bufferutil': 'bufferutil',
      });
      
      // Add fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
