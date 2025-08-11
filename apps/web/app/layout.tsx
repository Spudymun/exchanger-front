import { LAYOUT_SHARED_CONFIG, I18N_CONFIG, GLOBAL_CSS_CLASSES } from '@repo/constants';
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

export const viewport = LAYOUT_SHARED_CONFIG.VIEWPORT;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get locale from middleware header with centralized fallback
  const headersList = await headers();
  const locale = headersList.get('x-locale') || I18N_CONFIG.DEFAULT_LOCALE;

  return (
    <html lang={locale} suppressHydrationWarning={GLOBAL_CSS_CLASSES.HTML_SUPPRESS_HYDRATION}>
      <head>
        <meta name="color-scheme" content={LAYOUT_SHARED_CONFIG.COLOR_SCHEME} />
        <meta
          name="theme-color"
          content={LAYOUT_SHARED_CONFIG.THEME_COLORS.LIGHT}
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content={LAYOUT_SHARED_CONFIG.THEME_COLORS.DARK}
          media="(prefers-color-scheme: dark)"
        />
        <ThemeScript />
      </head>
      <body className={GLOBAL_CSS_CLASSES.BODY_BASE}>{children}</body>
    </html>
  );
}
