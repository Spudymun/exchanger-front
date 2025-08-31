import { PageLayout } from '@repo/ui';
import { getTranslations } from 'next-intl/server';

import { ExchangeContainer } from '../../../src/components/exchange/ExchangeContainer';

interface ExchangePageProps {
  params: Promise<{
    locale: string;
  }>;
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
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <PageLayout className="exchange-page">
      <ExchangeContainer
        locale={resolvedParams.locale}
        initialParams={{
          from: resolvedSearchParams.from,
          to: resolvedSearchParams.to,
          bank: resolvedSearchParams.bank,
          amount: resolvedSearchParams.amount ? parseFloat(resolvedSearchParams.amount) : undefined,
        }}
      />
    </PageLayout>
  );
}
