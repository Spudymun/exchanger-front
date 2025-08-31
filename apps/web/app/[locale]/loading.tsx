import { Spinner, CenteredPageLayout } from '@repo/ui';
import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('common');

  return (
    <CenteredPageLayout maxWidth="sm">
      <Spinner size="xl" className="mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">{t('loading')}</h2>
      <p className="text-muted-foreground">{t('loadingDescription')}</p>
    </CenteredPageLayout>
  );
}
