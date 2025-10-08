import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { AppLayout } from '../../src/components/app-layout';
import { routing } from '../../src/i18n/routing';

// Metadata и viewport управляются из root layout (apps/web/app/layout.tsx)
// согласно архитектуре Next.js 15 App Router
// Locale layout отвечает только за i18n контекст

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
  // Using modular translation files - load all required modules
  const [
    homePageMessages,
    layoutMessages,
    advancedExchangeMessages,
    serverErrorsMessages,
    notificationsMessages,
    exchangeTradingMessages,
    commonUiMessages,
    dashboardNavMessages,
    orderPageMessages,
    ordersPageMessages,
  ] = await Promise.all([
    import(`../../messages/${locale}/home-page.json`).then(m => m.default),
    import(`../../messages/${locale}/layout.json`).then(m => m.default),
    import(`../../messages/${locale}/advanced-exchange.json`).then(m => m.default),
    import(`../../messages/${locale}/server-errors.json`).then(m => m.default),
    import(`../../messages/${locale}/notifications.json`).then(m => m.default),
    import(`../../messages/${locale}/exchange-trading.json`).then(m => m.default),
    import(`../../messages/${locale}/common-ui.json`).then(m => m.default),
    import(`../../messages/${locale}/dashboard-nav.json`).then(m => m.default),
    import(`../../messages/${locale}/order-page.json`).then(m => m.default),
    import(`../../messages/${locale}/orders-page.json`).then(m => m.default),
  ]);

  // Merge all messages into single object
  const messages = {
    ...homePageMessages,
    ...layoutMessages,
    ...advancedExchangeMessages,
    ...serverErrorsMessages,
    ...notificationsMessages,
    ...exchangeTradingMessages,
    ...commonUiMessages,
    'common-ui': commonUiMessages,
    ...dashboardNavMessages,
    ...orderPageMessages,
    ...ordersPageMessages,
  };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppLayout>{children}</AppLayout>
    </NextIntlClientProvider>
  );
}
