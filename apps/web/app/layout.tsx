import {
  LAYOUT_SHARED_CONFIG,
  I18N_CONFIG,
  GLOBAL_CSS_CLASSES,
  META_DEFAULTS,
} from '@repo/constants';
import { ThemeScript } from '@repo/providers';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

// App-specific metadata content (не выносится в общие константы согласно seo.ts комментариям)
const APP_TITLE = 'ExchangeGO - Enterprise Crypto Exchange';
const APP_DESCRIPTION =
  'Modern cryptocurrency exchange platform built with Next.js, tRPC, and enterprise-grade architecture';

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  keywords: 'crypto, exchange, trading, blockchain, nextjs, trpc, enterprise, exchangego',
  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    type: META_DEFAULTS.OPEN_GRAPH.TYPE,
    locale: META_DEFAULTS.OPEN_GRAPH.LOCALE,
    siteName: 'ExchangeGO',
  },
  twitter: {
    card: META_DEFAULTS.TWITTER.CARD,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: META_DEFAULTS.ROBOTS.INDEX,
    follow: META_DEFAULTS.ROBOTS.FOLLOW,
  },
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
