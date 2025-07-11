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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <HeroSection />
        <FeaturesSection />
        <RatesSection />
        <CTASection />
      </div>
    </div>
  );
}
