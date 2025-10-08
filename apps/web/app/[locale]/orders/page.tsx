import { PageLayout } from '@repo/ui';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OrdersContainer } from '../../../src/components/orders/OrdersContainer';

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    sortBy?: string;
  }>;
}

export async function generateMetadata({ params }: OrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'OrdersPage' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <PageLayout className="orders-page">
      <OrdersContainer
        initialPage={resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1}
        initialStatus={resolvedSearchParams.status}
        initialSearch={resolvedSearchParams.search}
        initialSortBy={resolvedSearchParams.sortBy}
      />
    </PageLayout>
  );
}
