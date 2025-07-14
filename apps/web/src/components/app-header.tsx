'use client';

import { Header, ThemeToggle } from '@repo/ui';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import * as React from 'react';

import { Link } from '../../src/i18n/navigation';

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
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    if (pathname) {
      const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
      router.push(newPath);
    }
  };

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <Header
      className={className}
      currentLocale={locale}
      isAuthenticated={false}
      onLocaleChange={handleLocaleChange}
      onSignIn={() => router.push('/sign-in')}
      onSignOut={() => router.push('/sign-out')}
      isMenuOpen={isMenuOpen}
      onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
    >
      <AppHeaderLogo />
      <AppHeaderNavigation t={t} pathname={pathname} />
      <AppHeaderActions />
      <Header.MobileMenu />
    </Header>
  );
}

function AppHeaderLogo() {
  return (
    <Header.Logo>
      <Link href="/" className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">EG</span>
        </div>
        <span className="font-bold text-xl">ExchangeGO</span>
      </Link>
    </Header.Logo>
  );
}

function AppHeaderNavigation({
  t,
  pathname,
}: {
  t: ReturnType<typeof useTranslations>;
  pathname: string | null;
}) {
  return (
    <Header.Navigation>
      <Link href="/" className={getNavLinkClass(pathname, '/', true)}>
        {t('navigation.home')}
      </Link>
      <Link href="/exchange" className={getNavLinkClass(pathname, '/exchange')}>
        {t('navigation.exchange')}
      </Link>
      <Link href="/orders" className={getNavLinkClass(pathname, '/orders')}>
        {t('navigation.orders')}
      </Link>
      <Link href="/contact" className={getNavLinkClass(pathname, '/contact')}>
        {t('navigation.contact')}
      </Link>
    </Header.Navigation>
  );
}

function AppHeaderActions() {
  return (
    <Header.Actions>
      <Header.LanguageSwitcher />
      <ThemeToggle />
      <Header.UserMenu />
    </Header.Actions>
  );
}
