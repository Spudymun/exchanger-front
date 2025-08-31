import { I18N_CONFIG } from '@repo/constants';
import { Spinner, CenteredPageLayout } from '@repo/ui';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  // Получаем локаль из middleware header или дефолтную
  const headersList = await headers();
  const locale = headersList.get('x-locale') || I18N_CONFIG.DEFAULT_LOCALE;

  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <CenteredPageLayout maxWidth="md">
      <Spinner size="xl" className="mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground">{t('loading')}</h2>
      <p className="text-muted-foreground mt-2">{t('loadingDescription')}</p>
    </CenteredPageLayout>
  );
}
