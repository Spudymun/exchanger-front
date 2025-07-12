import { setRequestLocale } from 'next-intl/server';

import { CTASection } from '../../src/components/CTASection';
import { FeaturesSection } from '../../src/components/FeaturesSection';
import { HeroSection } from '../../src/components/HeroSection';
import { RatesSection } from '../../src/components/RatesSection';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 space-y-16">
        <HeroSection />
        <FeaturesSection />
        <RatesSection />
        <CTASection />
      </div>
    </div>
  );
}
