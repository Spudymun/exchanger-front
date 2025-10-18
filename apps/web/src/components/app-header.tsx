'use client';

import { APP_ROUTES, LEGAL_ROUTES, UI_REFRESH_INTERVALS } from '@repo/constants';
import { useAuthModal } from '@repo/providers';
import { Header, Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui';

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
  const { data: session } = trpc.auth.getSession.useQuery(undefined, {
    refetchInterval: UI_REFRESH_INTERVALS.SESSION_STATUS_REFRESH,
  });
  const utils = trpc.useUtils();

  // ✅ Используем глобальный контекст вместо локального state
  const authModal = useAuthModal();

  // ✅ ФИКС: Добавляем logout мутацию
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Инвалидируем сессию чтобы кнопка обновилась
      utils.auth.getSession.invalidate();
    },
  });

  // ✅ ФИКС: Добавляем обработчик logout
  const handleSignOut = React.useCallback(() => {
    logout.mutate();
  }, [logout]);

  // ✅ ФИКС: При успешной аутентификации инвалидируем все queries для обновления данных
  const handleAuthSuccess = React.useCallback(async () => {
    // Сначала инвалидируем и ЖДЕМ пока данные обновятся
    await utils.auth.getSession.invalidate();
    await utils.invalidate();
    // Только ПОСЛЕ обновления данных закрываем модалку
    authModal.closeAll();
  }, [authModal, utils]);

  return {
    session,
    ...authModal, // isLoginOpen, isRegisterOpen, isForgotPasswordOpen, openLogin, openRegister, openForgotPassword, closeAll
    handleAuthSuccess,
    handleSignOut,
  };
}

// Компонент мобильной версии хедера
function AppHeaderMobile({
  session,
  handleOpenLogin,
  handleSignOut,
  t,
}: {
  session: { user: { id: string; email: string; isVerified: boolean } | null } | undefined;
  handleOpenLogin: () => void;
  handleSignOut: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="block lg:hidden">
      <div className="flex justify-between items-center h-10">
        <AppHeaderLogoMobile />
        <div className="flex items-center space-x-2">
          <Header.LanguageSwitcher />
          <ThemeToggleI18n />
          <Header.UserMenu
            isAuthenticated={!!session?.user}
            onSignIn={handleOpenLogin}
            onSignOut={handleSignOut}
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
  handleSignOut,
}: {
  pathname: string | null;
  t: (key: string) => string;
  session: { user: { id: string; email: string; isVerified: boolean } | null } | undefined;
  handleOpenLogin: () => void;
  handleSignOut: () => void;
}) {
  return (
    <div className="hidden lg:block">
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
            onSignOut={handleSignOut}
            signInText={t('auth.signIn')}
            signOutText={t('auth.signOut')}
          />
        </Header.Actions>
      </div>
    </div>
  );
}

// Mobile Navigation Links для переиспользования
function MobileNavigationLinks({
  pathname,
  t,
  onLinkClick,
}: {
  pathname: string | null;
  t: (key: string) => string;
  onLinkClick: () => void;
}) {
  return (
    <>
      <Link
        href={APP_ROUTES.EXCHANGE}
        className={getNavLinkClass(pathname, APP_ROUTES.EXCHANGE)}
        onClick={onLinkClick}
      >
        {t('navigation.exchange')}
      </Link>
      <Link
        href={APP_ROUTES.ORDERS}
        className={getNavLinkClass(pathname, APP_ROUTES.ORDERS)}
        onClick={onLinkClick}
      >
        {t('navigation.orders')}
      </Link>
      <Link
        href={LEGAL_ROUTES.RULES}
        className={getNavLinkClass(pathname, LEGAL_ROUTES.RULES)}
        onClick={onLinkClick}
      >
        {t('navigation.rules')}
      </Link>
      <Link
        href={LEGAL_ROUTES.AML_POLICY}
        className={getNavLinkClass(pathname, LEGAL_ROUTES.AML_POLICY)}
        onClick={onLinkClick}
      >
        {t('navigation.amlPolicy')}
      </Link>
      <Link
        href={APP_ROUTES.CONTACTS}
        className={getNavLinkClass(pathname, APP_ROUTES.CONTACTS)}
        onClick={onLinkClick}
      >
        {t('navigation.contact')}
      </Link>
    </>
  );
}

// Компонент мобильного navigation drawer
function MobileNavigationDrawer({
  isOpen,
  onClose,
  pathname,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  pathname: string | null;
  t: (key: string) => string;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>{t('navigation.menu')}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-6">
          <MobileNavigationLinks pathname={pathname} t={t} onLinkClick={onClose} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function AppHeader({ className }: AppHeaderProps) {
  const t = useTranslations('Layout');
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  // ✅ Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const toggleMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);
  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const {
    session,
    isLoginOpen,
    isRegisterOpen,
    isForgotPasswordOpen,
    openLogin,
    openForgotPassword,
    closeAll,
    handleAuthSuccess,
    handleSignOut,
  } = useAuthDialogs();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <>
      <Header
        currentLocale={locale}
        onLocaleChange={handleLocaleChange}
        className={className}
        isMenuOpen={isMobileMenuOpen}
        onToggleMenu={toggleMobileMenu}
      >
        <Header.Container>
          <AppHeaderMobile
            session={session}
            handleOpenLogin={openLogin}
            handleSignOut={handleSignOut}
            t={t}
          />
          <AppHeaderDesktop
            pathname={pathname}
            t={t}
            session={session}
            handleOpenLogin={openLogin}
            handleSignOut={handleSignOut}
          />
        </Header.Container>
      </Header>

      <MobileNavigationDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        pathname={pathname}
        t={t}
      />

      <AuthDialogs
        isLoginOpen={isLoginOpen}
        isRegisterOpen={isRegisterOpen}
        isForgotPasswordOpen={isForgotPasswordOpen}
        onLoginClose={closeAll}
        onRegisterClose={closeAll}
        onForgotPasswordClose={closeAll}
        onAuthSuccess={handleAuthSuccess}
        onOpenForgotPassword={openForgotPassword}
        onOpenLogin={openLogin}
      />
    </>
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
    <nav className="hidden lg:flex space-x-6">
      <Link href={APP_ROUTES.EXCHANGE} className={getNavLinkClass(pathname, APP_ROUTES.EXCHANGE)}>
        {t('navigation.exchange')}
      </Link>
      <Link href={APP_ROUTES.ORDERS} className={getNavLinkClass(pathname, APP_ROUTES.ORDERS)}>
        {t('navigation.orders')}
      </Link>
      <Link href={LEGAL_ROUTES.RULES} className={getNavLinkClass(pathname, LEGAL_ROUTES.RULES)}>
        {t('navigation.rules')}
      </Link>
      <Link
        href={LEGAL_ROUTES.AML_POLICY}
        className={getNavLinkClass(pathname, LEGAL_ROUTES.AML_POLICY)}
      >
        {t('navigation.amlPolicy')}
      </Link>
      <Link href={APP_ROUTES.CONTACTS} className={getNavLinkClass(pathname, APP_ROUTES.CONTACTS)}>
        {t('navigation.contact')}
      </Link>
    </nav>
  );
}
