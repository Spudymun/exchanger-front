'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SectionLayout,
  StandardPageLayout,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import * as React from 'react';

interface TermItem {
  term: string;
  definition: string;
}

/**
 * Hero Section Component
 */
function HeroSection({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="text-center space-y-4 mb-12">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {t('hero.title')}
      </h1>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{t('hero.subtitle')}</p>
    </div>
  );
}

/**
 * Terms and Definitions Section
 */
function TermsSection({ t }: { t: ReturnType<typeof useTranslations> }) {
  const items = t.raw('sections.terms.items') as Record<string, TermItem>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('sections.terms.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(items).map(([key, item]) => (
          <div key={key} className="space-y-2">
            <h3 className="font-semibold text-lg">{item.term}</h3>
            <p className="text-muted-foreground leading-relaxed">{item.definition}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * List Section Component - reusable for sections with list items
 */
function ListSection({
  t,
  sectionKey,
}: {
  t: ReturnType<typeof useTranslations>;
  sectionKey: string;
}) {
  const items = t.raw(`sections.${sectionKey}.items`) as string[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t(`sections.${sectionKey}.title`)}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4 list-decimal list-inside">
          {items.map((item, index) => (
            <li key={index} className="text-muted-foreground leading-relaxed pl-2">
              <span className="ml-2">{item}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/**
 * Rules Page Component
 *
 * Displays the Terms of Service for ExchangeGO platform
 */
export default function RulesPage() {
  const t = useTranslations('RulesPage');

  return (
    <StandardPageLayout maxWidth="7xl">
      <SectionLayout spacing="lg" className="py-12">
        <HeroSection t={t} />
        <TermsSection t={t} />
        <ListSection t={t} sectionKey="general" />
        <ListSection t={t} sectionKey="subject" />
        <ListSection t={t} sectionKey="services" />
        <ListSection t={t} sectionKey="privacy" />
        <ListSection t={t} sectionKey="aml" />
        <ListSection t={t} sectionKey="liability" />
        <ListSection t={t} sectionKey="disputes" />

        {/* Last Updated */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          {t('hero.lastUpdated')}: {new Date().toLocaleDateString()}
        </div>
      </SectionLayout>
    </StandardPageLayout>
  );
}
