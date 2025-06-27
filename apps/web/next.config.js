import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['@trpc/server']
}

export default withNextIntl(nextConfig)
