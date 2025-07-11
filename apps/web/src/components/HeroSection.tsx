import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';

export function HeroSection() {
  const t = useTranslations('HomePage');

  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">{t('title')}</h1>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">{t('description')}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="text-lg px-8 py-3">
          {t('getStarted')}
        </Button>
        <Button variant="outline" size="lg" className="text-lg px-8 py-3">
          {t('learnMore')}
        </Button>
      </div>
    </div>
  );
}
