// ✅ Empty module for blocking server-side dependencies in Turbopack
const EMPTY_MODULE = './lib/empty.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@repo/ui", "@repo/exchange-core", "@repo/constants", "@repo/utils"],
    serverExternalPackages: ['@trpc/server', '@repo/session-management', 'ioredis', 'bullmq'],
    
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

export default nextConfig;
