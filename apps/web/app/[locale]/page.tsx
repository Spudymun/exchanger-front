import { setRequestLocale } from 'next-intl/server';

import { FeaturesSection } from '../../src/components/FeaturesSection';
import { FloatingExchangeButton } from '../../src/components/FloatingExchangeButton';
import { HeroSection } from '../../src/components/HeroSection';
import { HowItWorksSection } from '../../src/components/HowItWorksSection';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-12 lg:py-16 space-y-8 sm:space-y-12 lg:space-y-16">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
      </div>
      <FloatingExchangeButton />
    </div>
  );
}
