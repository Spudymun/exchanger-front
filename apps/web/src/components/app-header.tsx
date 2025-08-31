'use client';

import { APP_ROUTES } from '@repo/constants';
import { Header } from '@repo/ui';

import { useTranslations, useLocale } from 'next-intl';
import * as React from 'react';

import { trpc } from '../../lib/trpc-provider';
import { Link, usePathname, useRouter } from '../i18n/navigation';

import { AuthDialogs } from './auth-dialogs';
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

// Хук для управления аутентификацией в хедере
function useAuthDialogs() {
  const { data: session } = trpc.auth.getSession.useQuery();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = React.useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);

  // ИСПРАВЛЕНИЕ: Мемоизируем все callback функции для предотвращения бесконечного цикла
  const handleOpenLogin = React.useCallback(() => {
    setIsRegisterDialogOpen(false);
    setIsLoginDialogOpen(true);
  }, []);

  const handleOpenRegister = React.useCallback(() => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(true);
  }, []);

  const handleCloseLogin = React.useCallback(() => setIsLoginDialogOpen(false), []);
  const handleCloseRegister = React.useCallback(() => setIsRegisterDialogOpen(false), []);

  const handleAuthSuccess = React.useCallback(() => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(false);
  }, []);

  return {
    session,
    isLoginDialogOpen,
    isRegisterDialogOpen,
    handleOpenLogin,
    handleOpenRegister,
    handleCloseLogin,
    handleCloseRegister,
    handleAuthSuccess,
  };
}

// Компонент мобильной версии хедера
function AppHeaderMobile({
  session,
  handleOpenLogin,
  t,
}: {
  session: { user: { id: string; email: string; isVerified: boolean } | null } | undefined;
  handleOpenLogin: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="block sm:hidden">
      <div className="flex justify-between items-center h-10">
        <AppHeaderLogoMobile />
        <div className="flex items-center space-x-2">
          <Header.LanguageSwitcher />
          <ThemeToggleI18n />
          <Header.UserMenu
            isAuthenticated={!!session?.user}
            onSignIn={handleOpenLogin}
            signInText={t('auth.signIn')}
            signOutText={t('auth.signOut')}
          />
          <Header.MobileMenu />
        </div>
      </div>
    </div>
  );
}

// Компонент десктопной версии хедера
function AppHeaderDesktop({
  pathname,
  t,
  session,
  handleOpenLogin,
}: {
  pathname: string | null;
  t: (key: string) => string;
  session: { user: { id: string; email: string; isVerified: boolean } | null } | undefined;
  handleOpenLogin: () => void;
}) {
  return (
    <div className="hidden sm:block">
      <div className="flex justify-between items-center h-10">
        <AppHeaderLogoDesktop />
        <Header.Navigation>
          <AppHeaderNavigationLinks pathname={pathname} t={t} />
        </Header.Navigation>
        <Header.Actions>
          <Header.LanguageSwitcher />
          <ThemeToggleI18n />
          <Header.UserMenu
            isAuthenticated={!!session?.user}
            onSignIn={handleOpenLogin}
            signInText={t('auth.signIn')}
            signOutText={t('auth.signOut')}
          />
        </Header.Actions>
      </div>
    </div>
  );
}

export function AppHeader({ className }: AppHeaderProps) {
  const t = useTranslations('Layout');
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  const {
    session,
    isLoginDialogOpen,
    isRegisterDialogOpen,
    handleOpenLogin,
    handleCloseLogin,
    handleCloseRegister,
    handleAuthSuccess,
  } = useAuthDialogs();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Header currentLocale={locale} onLocaleChange={handleLocaleChange} className={className}>
      <Header.Container>
        <AppHeaderMobile session={session} handleOpenLogin={handleOpenLogin} t={t} />
        <AppHeaderDesktop
          pathname={pathname}
          t={t}
          session={session}
          handleOpenLogin={handleOpenLogin}
        />
      </Header.Container>

      <AuthDialogs
        isLoginOpen={isLoginDialogOpen}
        isRegisterOpen={isRegisterDialogOpen}
        onLoginClose={handleCloseLogin}
        onRegisterClose={handleCloseRegister}
        onAuthSuccess={handleAuthSuccess}
      />
    </Header>
  );
}

function AppHeaderLogoMobile() {
  return (
    <Header.Logo>
      <Link href={APP_ROUTES.HOME} className="flex items-center">
        <div className="logo-mobile">
          <span className="text-primary-foreground font-bold text-sm">EG</span>
        </div>
      </Link>
    </Header.Logo>
  );
}

function AppHeaderLogoDesktop() {
  return (
    <Header.Logo>
      <Link href={APP_ROUTES.HOME} className="flex items-center space-x-2 sm:space-x-3">
        <div className="logo-desktop">
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
      <Link href={APP_ROUTES.EXCHANGE} className={getNavLinkClass(pathname, APP_ROUTES.EXCHANGE)}>
        {t('navigation.exchange')}
      </Link>
      <Link href={APP_ROUTES.ORDERS} className={getNavLinkClass(pathname, APP_ROUTES.ORDERS)}>
        {t('navigation.orders')}
      </Link>
      <Link href={APP_ROUTES.CONTACTS} className={getNavLinkClass(pathname, APP_ROUTES.CONTACTS)}>
        {t('navigation.contact')}
      </Link>
    </nav>
  );
}
