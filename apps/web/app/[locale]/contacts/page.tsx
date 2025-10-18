'use client';

import { CONTACT_INFO, SOCIAL_LINKS } from '@repo/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, SectionLayout } from '@repo/ui';
import { Mail, MessageCircle, Clock, Globe, Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

interface ContactChannelProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  contactInfo: string;
}

function ContactChannel({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  contactInfo,
}: ContactChannelProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">{contactInfo}</p>
        <a
          href={actionHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full"
        >
          {actionLabel}
        </a>
      </CardContent>
    </Card>
  );
}

interface InfoCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: string;
}

function InfoCard({ icon: Icon, title, value }: InfoCardProps) {
  return (
    <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-base font-semibold text-foreground mt-1">{value}</p>
      </div>
    </div>
  );
}

// Helper: Создание данных каналов связи
function useContactChannels() {
  const t = useTranslations('ContactsPage');

  return [
    {
      icon: MessageCircle,
      title: t('channels.telegram.title'),
      description: t('channels.telegram.description'),
      actionLabel: t('channels.telegram.button'),
      actionHref: SOCIAL_LINKS.SUPPORT_TELEGRAM.href,
      contactInfo: t('channels.telegram.handle'),
    },
    {
      icon: Mail,
      title: t('channels.email.title'),
      description: t('channels.email.description'),
      actionLabel: t('channels.email.button'),
      actionHref: `mailto:${CONTACT_INFO.SUPPORT_EMAIL}`,
      contactInfo: t('channels.email.address'),
    },
  ];
}

// Helper: Создание информационных карточек
function useInfoCards() {
  const t = useTranslations('ContactsPage');

  return [
    {
      icon: Clock,
      title: t('info.availability.title'),
      value: t('info.availability.value'),
    },
    {
      icon: Timer,
      title: t('info.responseTime.title'),
      value: t('info.responseTime.value'),
    },
    {
      icon: Globe,
      title: t('info.languages.title'),
      value: t('info.languages.value'),
    },
  ];
}

// Component: Hero секция
function ContactsHero() {
  const t = useTranslations('ContactsPage');

  return (
    <SectionLayout spacing="lg" maxWidth="7xl" className="text-center">
      <div className="space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">{t('hero.title')}</h1>
        <p className="text-xl text-muted-foreground">{t('hero.subtitle')}</p>
      </div>
    </SectionLayout>
  );
}

// Component: Секция каналов связи
function ContactChannelsSection({ channels }: { channels: ReturnType<typeof useContactChannels> }) {
  const t = useTranslations('ContactsPage');

  return (
    <SectionLayout spacing="lg" background="muted" maxWidth="7xl">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">{t('sections.support.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('sections.support.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {channels.map((channel, index) => (
            <ContactChannel key={index} {...channel} />
          ))}
        </div>
      </div>
    </SectionLayout>
  );
}

// Component: Секция дополнительной информации
function AdditionalInfoSection({ infoCards }: { infoCards: ReturnType<typeof useInfoCards> }) {
  const t = useTranslations('ContactsPage');

  return (
    <SectionLayout spacing="lg" maxWidth="7xl">
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">{t('sections.responseTime.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('sections.responseTime.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {infoCards.map((info, index) => (
            <InfoCard key={index} {...info} />
          ))}
        </div>
      </div>
    </SectionLayout>
  );
}

// Main Page Component
export default function ContactsPage() {
  const channels = useContactChannels();
  const infoCards = useInfoCards();

  return (
    <>
      <ContactsHero />
      <ContactChannelsSection channels={channels} />
      <AdditionalInfoSection infoCards={infoCards} />
    </>
  );
}
