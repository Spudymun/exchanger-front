import { Button } from '@repo/ui';
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <h2 className="text-2xl font-semibold">{t('title')}</h2>
          <p className="text-lg text-muted-foreground">{t('description')}</p>
        </div>

        <div className="space-y-3">
          <Button asChild>
            <Link href="/">{t('goHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
