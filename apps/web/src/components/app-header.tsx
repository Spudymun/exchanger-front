'use client';

import { Header } from '@repo/ui';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import * as React from 'react';

import { trpc } from '../../lib/trpc-provider';
import { Link } from '../../src/i18n/navigation';

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

  const handleOpenLogin = () => {
    setIsRegisterDialogOpen(false);
    setIsLoginDialogOpen(true);
  };

  const handleOpenRegister = () => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(true);
  };

  const handleCloseLogin = () => setIsLoginDialogOpen(false);
  const handleCloseRegister = () => setIsRegisterDialogOpen(false);

  const handleAuthSuccess = () => {
    setIsLoginDialogOpen(false);
    setIsRegisterDialogOpen(false);
  };

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
  handleOpenRegister,
  t,
}: {
  session: { user: { id: string; email: string; isVerified: boolean } | null } | undefined;
  handleOpenLogin: () => void;
  handleOpenRegister: () => void;
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
            onSignUp={handleOpenRegister}
            signInText={t('auth.signIn')}
            signUpText={t('auth.signUp')}
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
  handleOpenRegister,
}: {
  pathname: string | null;
  t: (key: string) => string;
  session: { user: { id: string; email: string; isVerified: boolean } | null } | undefined;
  handleOpenLogin: () => void;
  handleOpenRegister: () => void;
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
            onSignUp={handleOpenRegister}
            signInText={t('auth.signIn')}
            signUpText={t('auth.signUp')}
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
    handleOpenRegister,
    handleCloseLogin,
    handleCloseRegister,
    handleAuthSuccess,
  } = useAuthDialogs();

  const handleLocaleChange = (newLocale: string) => {
    const currentPath = pathname?.replace(`/${locale}`, '') || '/';
    router.replace(`/${newLocale}${currentPath}`);
  };

  return (
    <Header currentLocale={locale} onLocaleChange={handleLocaleChange} className={className}>
      <Header.Container>
        <AppHeaderMobile
          session={session}
          handleOpenLogin={handleOpenLogin}
          handleOpenRegister={handleOpenRegister}
          t={t}
        />
        <AppHeaderDesktop
          pathname={pathname}
          t={t}
          session={session}
          handleOpenLogin={handleOpenLogin}
          handleOpenRegister={handleOpenRegister}
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
  const handleExchangeClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      const exchangeSection = document.getElementById('exchange-section');
      if (exchangeSection) {
        exchangeSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="hidden md:flex space-x-6">
      <Link
        href={pathname === '/' ? '#exchange-section' : '/#exchange-section'}
        className={getNavLinkClass(pathname, '/exchange')}
        onClick={handleExchangeClick}
      >
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
