'use client';

import { SOCIAL_LINKS, COMPANY_INFO, APP_ROUTES, INFO_ROUTES, LEGAL_ROUTES } from '@repo/constants';
import { Footer } from '@repo/ui';
import { useTranslations } from 'next-intl';

interface AppFooterProps {
  className?: string;
}

const getSocialLinks = () => [
  {
    name: SOCIAL_LINKS.TELEGRAM.name,
    href: SOCIAL_LINKS.TELEGRAM.href,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    name: SOCIAL_LINKS.TWITTER.name,
    href: SOCIAL_LINKS.TWITTER.href,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
];

const getLegalLinks = (t: ReturnType<typeof useTranslations>) => [
  {
    name: t('footer.legal.rules'),
    href: LEGAL_ROUTES.RULES,
  },
  {
    name: t('footer.legal.aml'),
    href: LEGAL_ROUTES.AML_POLICY,
  },
  {
    name: t('footer.legal.returns'),
    href: LEGAL_ROUTES.RETURNS,
  },
  {
    name: t('footer.legal.privacy'),
    href: LEGAL_ROUTES.PRIVACY,
  },
];

export function AppFooter({ className }: AppFooterProps) {
  const t = useTranslations('Layout');
  const socialLinks = getSocialLinks();
  const legalLinks = getLegalLinks(t);

  return (
    <Footer className={className} companyName={COMPANY_INFO.NAME} theme="dark">
      <Footer.Container variant="grid" columns="four">
        <Footer.Section title={t('footer.company.title')}>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('footer.company.description')}</p>
            <p className="text-sm text-muted-foreground font-medium">
              {t('footer.company.workingHours')}
            </p>
            <p className="text-sm text-muted-foreground">{t('footer.company.serviceType')}</p>
            <p className="text-sm text-muted-foreground">{t('footer.company.responseTime')}</p>
          </div>
        </Footer.Section>

        <Footer.Section title={t('footer.exchange.title')}>
          <Footer.Link href={APP_ROUTES.HOME}>{t('footer.exchange.calculator')}</Footer.Link>
          <Footer.Link href={INFO_ROUTES.RATES}>{t('footer.exchange.rates')}</Footer.Link>
          <Footer.Link href={INFO_ROUTES.RESERVES}>{t('footer.exchange.reserves')}</Footer.Link>
          <Footer.Link href={INFO_ROUTES.LIMITS}>{t('footer.exchange.limits')}</Footer.Link>
        </Footer.Section>

        <Footer.Section title={t('footer.support.title')}>
          <Footer.Link href={SOCIAL_LINKS.SUPPORT_TELEGRAM.href} external>
            {t('footer.support.telegram')}
          </Footer.Link>
          <Footer.Link href={INFO_ROUTES.FAQ}>{t('footer.support.faq')}</Footer.Link>
          <Footer.Link href={INFO_ROUTES.HOW_IT_WORKS}>
            {t('footer.support.howItWorks')}
          </Footer.Link>
          <Footer.Link href={APP_ROUTES.CONTACTS}>{t('footer.support.contacts')}</Footer.Link>
        </Footer.Section>

        <Footer.Section title={t('footer.contacts.title')}>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('footer.contacts.telegram')}</p>
            <p className="text-sm text-muted-foreground">{t('footer.contacts.email')}</p>
            <p className="text-sm text-muted-foreground font-medium">
              {t('footer.contacts.workingHours')}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.contacts.socialDescription')}
            </p>
            <Footer.Social links={socialLinks} />
          </div>
        </Footer.Section>
      </Footer.Container>

      <Footer.Legal links={legalLinks} />
    </Footer>
  );
}
