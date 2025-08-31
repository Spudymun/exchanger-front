import { PageLayout } from '@repo/ui';
import { securityEnhancedOrderByIdSchema } from '@repo/utils';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OrderDevTools } from '../../../../src/components/OrderDevTools';
import { OrderStatus } from '../../../../src/components/OrderStatus';
import { redirect } from '../../../../src/i18n/navigation';

interface OrderPageProps {
  params: Promise<{
    locale: string;
    orderId: string;
  }>;
}

export async function generateMetadata({ params }: OrderPageProps) {
  const { locale, orderId } = await params;
  const t = await getTranslations({ locale, namespace: 'order-page' });

  return {
    title: t('metadata.title', { orderId }),
    description: t('metadata.description', { orderId }),
    openGraph: {
      title: t('metadata.ogTitle', { orderId }),
      description: t('metadata.ogDescription'),
    },
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { locale, orderId } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Validate orderId using security-enhanced schema
  const validation = securityEnhancedOrderByIdSchema.safeParse({ orderId });
  if (!validation.success) {
    // Redirect to localized 404 page to maintain consistency with project architecture
    // This follows the same pattern as app/not-found.tsx and ensures single source of truth
    // for 404 UI without duplicating not-found components across route segments
    redirect({ href: '/not-found-page', locale });
  }

  return (
    <PageLayout className="order-page">
      <OrderStatus orderId={orderId} showDetails={true} collapsibleTechnicalDetails={true} />
      <OrderDevTools orderId={orderId} />
    </PageLayout>
  );
}
