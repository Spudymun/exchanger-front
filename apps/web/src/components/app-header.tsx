'use client';

import { Header } from '@repo/ui';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import * as React from 'react';

import { Link } from '../../src/i18n/navigation';

import { ThemeToggleI18n } from './theme-toggle-i18n';

interface AppHeaderProps {
  className?: string;
}

const ACTIVE_LINK_CLASS = 'text-primary font-medium';
const INACTIVE_LINK_CLASS = 'text-muted-foreground';

const getNavLinkClass = (pathname: string | null, path: string, isExact = false) => {
  if (!pathname) return INACTIVE_LINK_CLASS;

  const isActive = isExact ? pathname === path : pathname.startsWith(path);

  return `hover:text-primary transition-colors ${
    isActive ? ACTIVE_LINK_CLASS : INACTIVE_LINK_CLASS
  }`;
};

export function AppHeader({ className }: AppHeaderProps) {
  const t = useTranslations('Layout');
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    // Используем router из next/navigation для правильной навигации
    const currentPath = pathname?.replace(`/${locale}`, '') || '/';
    router.replace(`/${newLocale}${currentPath}`);
  };

  return (
    <Header currentLocale={locale} onLocaleChange={handleLocaleChange} className={className}>
      <Header.Container>
        {/* Мобильная версия */}
        <div className="block sm:hidden">
          <div className="flex justify-between items-center h-10">
            <AppHeaderLogoMobile />
            <div className="flex items-center space-x-2">
              <Header.LanguageSwitcher />
              <ThemeToggleI18n />
              <Header.UserMenu />
              <Header.MobileMenu />
            </div>
          </div>
        </div>

        {/* Десктопная версия */}
        <div className="hidden sm:block">
          <div className="flex justify-between items-center h-10">
            <AppHeaderLogoDesktop />
            <Header.Navigation>
              <AppHeaderNavigationLinks pathname={pathname} t={t} />
            </Header.Navigation>
            <Header.Actions>
              <Header.LanguageSwitcher />
              <ThemeToggleI18n />
              <Header.UserMenu />
            </Header.Actions>
          </div>
        </div>
      </Header.Container>
    </Header>
  );
}

function AppHeaderLogoMobile() {
  return (
    <Header.Logo>
      <Link href="/" className="flex items-center">
        <div
          className="bg-primary rounded-lg flex items-center justify-center"
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            maxWidth: '36px',
            maxHeight: '36px',
          }}
        >
          <span className="text-primary-foreground font-bold text-sm">EG</span>
        </div>
      </Link>
    </Header.Logo>
  );
}

function AppHeaderLogoDesktop() {
  return (
    <Header.Logo>
      <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
        <div
          className="bg-primary rounded-lg flex items-center justify-center"
          style={{
            width: '40px',
            height: '40px',
            minWidth: '40px',
            minHeight: '40px',
            maxWidth: '40px',
            maxHeight: '40px',
          }}
        >
          <span className="text-primary-foreground font-bold text-sm">EG</span>
        </div>
        <span className="font-bold text-lg sm:text-xl">ExchangeGO</span>
      </Link>
    </Header.Logo>
  );
}

function AppHeaderNavigationLinks({
  pathname,
  t,
}: {
  pathname: string | null;
  t: (key: string) => string;
}) {
  return (
    <nav className="hidden md:flex space-x-6">
      <Link href="/" className={getNavLinkClass(pathname, '/', true)}>
        {t('navigation.home')}
      </Link>
      <Link href="/exchange" className={getNavLinkClass(pathname, '/exchange')}>
        {t('navigation.exchange')}
      </Link>
      <Link href="/orders" className={getNavLinkClass(pathname, '/orders')}>
        {t('navigation.orders')}
      </Link>
      <Link href="/contacts" className={getNavLinkClass(pathname, '/contacts')}>
        {t('navigation.contact')}
      </Link>
    </nav>
  );
}
