import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { AppLayout } from '../../src/components/app-layout';
import { routing } from '../../src/i18n/routing';

const SITE_TITLE = 'ExchangeGO - Enterprise Crypto Exchange';
const SITE_DESCRIPTION =
  'Modern cryptocurrency exchange platform built with Next.js, tRPC, and enterprise-grade architecture';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: 'crypto, exchange, trading, blockchain, nextjs, trpc, enterprise, exchangego',
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'en_US',
    siteName: 'ExchangeGO',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';

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

  return (
    <NextIntlClientProvider>
      <AppLayout>{children}</AppLayout>
    </NextIntlClientProvider>
  );
}
