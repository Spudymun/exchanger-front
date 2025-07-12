import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';

// Mock statistics data
const mockStats = [
  { key: 'users', value: '50K+' },
  { key: 'volume', value: '$2.1B' },
  { key: 'transactions', value: '1M+' },
  { key: 'countries', value: '120+' },
] as const;

function StatCard({ statKey, value }: { statKey: string; value: string }) {
  const t = useTranslations('HomePage.cta.stats');

  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-foreground mb-2">{value}</div>
      <div className="text-sm text-muted-foreground">{t(statKey)}</div>
    </div>
  );
}

function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
      {mockStats.map(stat => (
        <StatCard key={stat.key} statKey={stat.key} value={stat.value} />
      ))}
    </div>
  );
}

export function CTASection() {
  const t = useTranslations('HomePage.cta');

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl p-8 lg:p-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">{t('title')}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">{t('description')}</p>

        <div className="flex justify-center">
          <Button size="lg" className="text-lg px-8 py-3">
            {t('button')}
          </Button>
        </div>
      </div>

      <StatsGrid />
    </div>
  );
}
