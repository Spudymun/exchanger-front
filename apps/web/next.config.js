import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true', // eslint-disable-line no-undef
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/exchange-core', '@repo/constants', '@repo/ui', '@repo/utils'],
  serverExternalPackages: ['@trpc/server'],
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
