import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    const polyfillPath = path.resolve(__dirname, 'src/polyfills/async-hooks.ts');
    config.resolve.alias['node:async_hooks'] = polyfillPath;
    config.resolve.alias['async_hooks'] = polyfillPath;
    return config;
  },
  turbopack: {
    resolveAlias: {
      'node:async_hooks': './src/polyfills/async-hooks.ts',
      'async_hooks': './src/polyfills/async-hooks.ts',
    },
  },
};

export default nextConfig;
