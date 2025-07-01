/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/exchange-core', '@repo/constants', '@repo/utils'],
};

export default nextConfig;
