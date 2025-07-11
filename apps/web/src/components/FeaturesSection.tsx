import { useTranslations } from 'next-intl';

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-md border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function FeaturesSection() {
  const t = useTranslations('HomePage.features');

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <FeatureCard title={t('turborepo.title')} description={t('turborepo.description')} />
      <FeatureCard title={t('trpc.title')} description={t('trpc.description')} />
      <FeatureCard title={t('i18n.title')} description={t('i18n.description')} />
      <FeatureCard title={t('ui.title')} description={t('ui.description')} />
      <FeatureCard title={t('state.title')} description={t('state.description')} />
      <FeatureCard title={t('testing.title')} description={t('testing.description')} />
    </div>
  );
}
