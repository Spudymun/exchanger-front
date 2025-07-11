'use client';

import {
  Footer,
  FooterSection,
  FooterLink,
  FooterSocial,
  FooterCompanyInfo,
  FooterLegal,
} from '@repo/ui';
import { useTranslations } from 'next-intl';

interface AppFooterProps {
  className?: string;
}

const getSocialLinks = () => [
  {
    name: 'Twitter',
    href: 'https://twitter.com/exchangego',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/exchangego',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: 'Telegram',
    href: 'https://t.me/exchangego',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
];

const getLegalLinks = (t: ReturnType<typeof useTranslations>) => [
  {
    name: t('footer.legal.terms'),
    href: '/terms',
  },
  {
    name: t('footer.legal.privacy'),
    href: '/privacy',
  },
  {
    name: t('footer.legal.cookies'),
    href: '/cookies',
  },
];

export function AppFooter({ className }: AppFooterProps) {
  const t = useTranslations('Layout');
  const socialLinks = getSocialLinks();
  const legalLinks = getLegalLinks(t);

  return (
    <Footer className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <FooterSection title={t('footer.company.title')}>
          <FooterCompanyInfo
            companyName="ExchangeGO"
            description={t('footer.company.description')}
            address={t('footer.company.address')}
            phone={t('footer.company.phone')}
            email={t('footer.company.email')}
          />
        </FooterSection>

        <FooterSection title={t('footer.services.title')}>
          <div className="space-y-2">
            <FooterLink href="/exchange">{t('footer.services.exchange')}</FooterLink>
            <FooterLink href="/orders">{t('footer.services.orders')}</FooterLink>
            <FooterLink href="/api">{t('footer.services.api')}</FooterLink>
            <FooterLink href="/fees">{t('footer.services.fees')}</FooterLink>
          </div>
        </FooterSection>

        <FooterSection title={t('footer.support.title')}>
          <div className="space-y-2">
            <FooterLink href="/help">{t('footer.support.help')}</FooterLink>
            <FooterLink href="/contact">{t('footer.support.contact')}</FooterLink>
            <FooterLink href="/faq">{t('footer.support.faq')}</FooterLink>
            <FooterLink href="/status">{t('footer.support.status')}</FooterLink>
          </div>
        </FooterSection>

        <FooterSection title={t('footer.social.title')}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('footer.social.description')}</p>
            <FooterSocial links={socialLinks} />
          </div>
        </FooterSection>
      </div>

      <FooterLegal links={legalLinks} />
    </Footer>
  );
}
