import { APP_ROUTES } from '@repo/constants';
import { Button, CenteredPageLayout } from '@repo/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '../../../src/i18n/navigation';

interface NotFoundPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NotFoundPage({ params }: NotFoundPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('NotFound');

  return (
    <CenteredPageLayout
      maxWidth="md"
      heading="404"
      title={t('title')}
      description={t('description')}
    >
      <Button asChild>
        <Link href={APP_ROUTES.HOME}>{t('goHome')}</Link>
      </Button>
    </CenteredPageLayout>
  );
}
