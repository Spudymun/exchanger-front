import { PageLayout } from '@repo/ui';
import { securityEnhancedOrderByIdSchema } from '@repo/utils';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OrderStatus } from '../../../../src/components/OrderStatus';

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
    throw new Error(
      `Invalid order ID format: ${orderId}. ${validation.error.issues.map(issue => issue.message).join(', ')}`
    );
  }

  return (
    <PageLayout className="order-page">
      <OrderStatus orderId={orderId} showDetails={true} collapsibleTechnicalDetails={true} />
    </PageLayout>
  );
}
