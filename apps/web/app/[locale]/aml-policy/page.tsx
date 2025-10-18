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

interface RequirementItem {
  title: string;
  description: string;
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
 * Content Section Component - for sections with content array
 */
function ContentSection({
  t,
  sectionKey,
}: {
  t: ReturnType<typeof useTranslations>;
  sectionKey: string;
}) {
  const content = t.raw(`sections.${sectionKey}.content`) as string[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t(`sections.${sectionKey}.title`)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {content.map((paragraph, index) => (
          <p key={index} className="text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Requirements Section Component
 */
function RequirementsSection({ t }: { t: ReturnType<typeof useTranslations> }) {
  const items = t.raw('sections.requirements.items') as RequirementItem[];
  const subtitle = t('sections.requirements.subtitle');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('sections.requirements.title')}</CardTitle>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * List Section Component
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
        <ul className="space-y-3 list-disc list-inside">
          {items.map((item, index) => (
            <li key={index} className="text-muted-foreground leading-relaxed pl-2">
              <span className="ml-2">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * Disclosure Section Component (special handling)
 */
function DisclosureSection({ t }: { t: ReturnType<typeof useTranslations> }) {
  const items = t.raw('sections.disclosure.items') as RequirementItem[];
  const subtitle = t('sections.disclosure.subtitle');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('sections.disclosure.title')}</CardTitle>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Verification Section Component (special handling)
 */
function VerificationSection({ t }: { t: ReturnType<typeof useTranslations> }) {
  const items = t.raw('sections.verification.items') as RequirementItem[];
  const subtitle = t('sections.verification.subtitle');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('sections.verification.title')}</CardTitle>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * AML Policy Page Component
 *
 * Displays the Anti-Money Laundering and KYC policy for ExchangeGO platform
 */
export default function AmlPolicyPage() {
  const t = useTranslations('AmlPolicyPage');

  return (
    <StandardPageLayout maxWidth="7xl">
      <SectionLayout spacing="lg" className="py-12">
        <HeroSection t={t} />
        <ContentSection t={t} sectionKey="introduction" />
        <RequirementsSection t={t} />
        <VerificationSection t={t} />
        <ContentSection t={t} sectionKey="kyc" />
        <DisclosureSection t={t} />
        <ContentSection t={t} sectionKey="monitoring" />
        <ListSection t={t} sectionKey="consequences" />
        <ContentSection t={t} sectionKey="commitment" />

        {/* Last Updated */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          {t('hero.lastUpdated')}: {new Date().toLocaleDateString()}
        </div>
      </SectionLayout>
    </StandardPageLayout>
  );
}
