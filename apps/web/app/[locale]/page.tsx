import { StandardPageLayout } from '@repo/ui';
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
    <>
      <StandardPageLayout
        maxWidth="7xl"
        centerContent={false}
        className="space-y-8 sm:space-y-12 lg:space-y-16"
      >
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
      </StandardPageLayout>
      <FloatingExchangeButton />
    </>
  );
}
