import { ThemeScript } from '@repo/providers';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExchangeGO - Enterprise Crypto Exchange',
  description:
    'Modern cryptocurrency exchange platform built with Next.js, tRPC, and enterprise-grade architecture',
  keywords: 'crypto, exchange, trading, blockchain, nextjs, trpc, enterprise, exchangego',
};

export const viewport = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get locale from middleware header
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'en';

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <ThemeScript />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
