import bundleAnalyzer from '@next/bundle-analyzer';
import pkg from '@next/env';
import createNextIntlPlugin from 'next-intl/plugin';

const { loadEnvConfig } = pkg;

// ⚡ Загружаем переменные окружения
const projectDir = process.cwd(); // eslint-disable-line no-undef
loadEnvConfig(projectDir);

// eslint-disable-next-line no-console, no-undef
console.log('🔧 Next.js config loading env vars...');
// eslint-disable-next-line no-console, no-undef
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'loaded' : 'missing');
// eslint-disable-next-line no-console, no-undef
console.log('REDIS_URL:', process.env.REDIS_URL ? 'loaded' : 'missing');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true', // eslint-disable-line no-undef
});

// ✅ Empty module for blocking server-side dependencies in Turbopack
const EMPTY_MODULE = './lib/empty.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/exchange-core', '@repo/constants', '@repo/ui', '@repo/utils'],
  serverExternalPackages: ['@trpc/server', '@repo/session-management', 'ioredis'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL, // eslint-disable-line no-undef
    REDIS_URL: process.env.REDIS_URL, // eslint-disable-line no-undef
    FORCE_MOCK_MODE: process.env.FORCE_MOCK_MODE, // eslint-disable-line no-undef
  },
  
  // ✅ Turbopack config for dev mode
  turbopack: {
    resolveAlias: {
      // ✅ Block external server-only packages from client bundle in Turbopack  
      'ioredis': EMPTY_MODULE,
      // ✅ Block Node.js built-ins
      'dns': EMPTY_MODULE,
      'net': EMPTY_MODULE, 
      'tls': EMPTY_MODULE,
      'fs': EMPTY_MODULE
    }
  },
  
  // ✅ Webpack config for production builds (fallback when not using Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        'ioredis': false
      };
      
      // ✅ Полностью исключаем server-only пакеты из client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@repo/session-management': false,
        'ioredis': false
      };
    }
    return config;
  }
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
