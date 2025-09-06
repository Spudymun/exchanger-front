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

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/exchange-core', '@repo/constants', '@repo/ui', '@repo/utils'],
  serverExternalPackages: ['@trpc/server'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL, // eslint-disable-line no-undef
    REDIS_URL: process.env.REDIS_URL, // eslint-disable-line no-undef
    FORCE_MOCK_MODE: process.env.FORCE_MOCK_MODE, // eslint-disable-line no-undef
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
