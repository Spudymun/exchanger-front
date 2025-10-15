/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/constants', '@repo/utils'],
  serverExternalPackages: ['@trpc/server', 'telegraf', 'bullmq'],

  // Оптимизация для backend-only usage
  poweredByHeader: false,
  reactStrictMode: false, // Не нужно для backend

  // Отключаем ненужные для backend оптимизации
  images: {
    unoptimized: true,
  },

  // API Routes only
  rewrites: async () => {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },
};

export default nextConfig;
