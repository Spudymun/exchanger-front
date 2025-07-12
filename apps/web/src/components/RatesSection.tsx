import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Mock data - в реальном проекте будет из API
const mockRates = [
  { symbol: 'BTC/USD', price: 67234.56, change: 2.34, trending: 'up' },
  { symbol: 'ETH/USD', price: 3456.78, change: -1.23, trending: 'down' },
  { symbol: 'BNB/USD', price: 634.12, change: 0.89, trending: 'up' },
  { symbol: 'ADA/USD', price: 1.23, change: 4.56, trending: 'up' },
] as const;

function RateCard({ symbol, price, change, trending }: (typeof mockRates)[number]) {
  const isPositive = change > 0;
  const trendIcon = trending === 'up' ? '↗' : '↘';

  return (
    <div className="bg-card border border-border/70 dark:border-border/60 p-4 rounded-lg shadow-md shadow-black/8 dark:shadow-black/20">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{symbol}</h3>
        <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trendIcon}
        </span>
      </div>
      <div className="text-lg font-semibold text-foreground">${price.toLocaleString()}</div>
      <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}
        {change.toFixed(2)}%
      </div>
    </div>
  );
}

export function RatesSection() {
  const t = useTranslations('HomePage.rates');

  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">{t('title')}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('description')}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mockRates.map(rate => (
          <RateCard key={rate.symbol} {...rate} />
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/exchange"
          className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
        >
          {t('viewAll')}
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
