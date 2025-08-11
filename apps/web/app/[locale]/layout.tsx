import { LAYOUT_SHARED_CONFIG, META_DEFAULTS } from '@repo/constants';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { AppLayout } from '../../src/components/app-layout';
import { routing } from '../../src/i18n/routing';

const SITE_TITLE = 'ExchangeGO - Enterprise Crypto Exchange';
const SITE_DESCRIPTION =
  'Modern cryptocurrency exchange platform built with Next.js, tRPC, and enterprise-grade architecture';
const SITE_KEYWORDS = 'crypto, exchange, trading, blockchain, nextjs, trpc, enterprise, exchangego';
const SITE_NAME = 'ExchangeGO';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: META_DEFAULTS.OPEN_GRAPH.TYPE,
    locale: META_DEFAULTS.OPEN_GRAPH.LOCALE,
    siteName: SITE_NAME,
  },
  twitter: {
    card: META_DEFAULTS.TWITTER.CARD,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: META_DEFAULTS.ROBOTS.INDEX,
    follow: META_DEFAULTS.ROBOTS.FOLLOW,
  },
};

export const viewport = LAYOUT_SHARED_CONFIG.VIEWPORT;

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Load messages for client components
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppLayout>{children}</AppLayout>
    </NextIntlClientProvider>
  );
}
