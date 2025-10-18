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

// ✅ Empty module for blocking server-side dependencies in Turbopack (unused after Turbopack disabled)
// const EMPTY_MODULE = './lib/empty.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@repo/exchange-core',
    '@repo/constants',
    '@repo/ui',
    '@repo/utils',
    '@repo/hooks',
  ],
  serverExternalPackages: [
    '@trpc/server',
    '@repo/session-management',
    '@repo/email-service',
    'ioredis',
    '@sendgrid/mail', // ✅ Исключаем из бандлинга (использует Node.js 'fs')
    'bullmq',
  ],
  env: {
    DATABASE_URL: process.env.DATABASE_URL, // eslint-disable-line no-undef
    REDIS_URL: process.env.REDIS_URL, // eslint-disable-line no-undef
    FORCE_MOCK_MODE: process.env.FORCE_MOCK_MODE, // eslint-disable-line no-undef
  },

  // 🔐 Security Headers - OWASP recommendations
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev mode
              "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind and styled-components
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.telegram.org", // Allow tRPC and Telegram API
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // ✅ Turbopack отключен - используем только webpack конфигурацию

  // ✅ Webpack config for production builds (fallback when not using Turbopack)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        stream: false,
        path: false,
        ioredis: false,
      };

      // ✅ Полностью исключаем server-only пакеты из client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        '@repo/session-management': false,
        '@repo/email-service': false,
        ioredis: false,
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
