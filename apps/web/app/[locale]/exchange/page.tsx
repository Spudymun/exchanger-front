import { getTranslations } from 'next-intl/server';

import { ExchangeContainer } from './components/ExchangeContainer';

interface ExchangePageProps {
  params: {
    locale: string;
  };
  searchParams: Promise<{
    from?: string;
    to?: string;
    bank?: string;
    amount?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ExchangePageProps) {
  const t = await getTranslations('AdvancedExchangeForm');
  const params = await searchParams;

  const fromCurrency = params.from || 'USDT-TRC20';
  const toCurrency = params.to || 'UAH-CARD';
  const selectedBank = params.bank;

  return {
    title: t('metadata.title', { from: fromCurrency, to: toCurrency }),
    description: t('metadata.description', {
      from: fromCurrency,
      to: toCurrency,
      bank: selectedBank || '',
    }),
    openGraph: {
      title: t('metadata.ogTitle', { from: fromCurrency, to: toCurrency }),
      description: t('metadata.ogDescription'),
    },
  };
}

export default async function ExchangePage({ params, searchParams }: ExchangePageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <main role="main" className="exchange-page min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <ExchangeContainer
          locale={params.locale}
          initialParams={{
            from: resolvedSearchParams.from,
            to: resolvedSearchParams.to,
            bank: resolvedSearchParams.bank,
            amount: resolvedSearchParams.amount
              ? parseFloat(resolvedSearchParams.amount)
              : undefined,
          }}
        />
      </div>
    </main>
  );
}
