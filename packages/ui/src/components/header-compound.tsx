'use client';

import * as React from 'react';

import { enhanceChildWithContext } from '../lib/header-helpers';
import type { HeaderContextValue } from '../lib/header-types';
import { cn } from '../lib/utils';

const FLEX_ITEMS_CENTER_SPACE_X_2 = 'flex items-center space-x-2';

import { BaseErrorBoundary } from './error-boundaries';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

const HeaderContext = React.createContext<HeaderContextValue | undefined>(undefined);

export const useHeaderContext = () => {
  return React.useContext(HeaderContext);
};
export interface HeaderProps {
  className?: string;
  isMenuOpen?: boolean;
  currentLocale?: string;
  isAuthenticated?: boolean;
  userName?: string;
  onToggleMenu?: () => void;
  onLocaleChange?: (locale: string) => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  children: React.ReactNode;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      children,
      isMenuOpen,
      currentLocale,
      isAuthenticated,
      userName,
      onToggleMenu,
      onLocaleChange,
      onSignIn,
      onSignOut,
    },
    ref
  ) => {
    const contextValue: HeaderContextValue = React.useMemo(
      () => ({
        isMenuOpen,
        currentLocale,
        isAuthenticated,
        userName,
        onToggleMenu,
        onLocaleChange,
        onSignIn,
        onSignOut,
      }),
      [
        isMenuOpen,
        currentLocale,
        isAuthenticated,
        userName,
        onToggleMenu,
        onLocaleChange,
        onSignIn,
        onSignOut,
      ]
    );

    return (
      <BaseErrorBoundary componentName="Header">
        <HeaderContext.Provider value={contextValue}>
          <header
            ref={ref}
            className={cn(
              'bg-background border-b border-border sticky top-0 z-50 shadow-sm',
              className
            )}
            role="banner"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-1 sm:py-2 lg:py-2">{children}</div>
            </div>
          </header>
        </HeaderContext.Provider>
      </BaseErrorBoundary>
    );
  }
);

Header.displayName = 'Header';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'fluid' | 'compact';
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const getVariantClass = (v: 'default' | 'fluid' | 'compact') => {
      switch (v) {
        case 'default':
          return 'container mx-auto px-4 sm:px-6 lg:px-8';
        case 'fluid':
          return 'w-full px-4 sm:px-6 lg:px-8';
        case 'compact':
          return 'container mx-auto px-2 sm:px-4';
        default:
          return 'container mx-auto px-4 sm:px-6 lg:px-8';
      }
    };

    return (
      <div ref={ref} className={cn(getVariantClass(variant), className)} {...props}>
        <div className="flex flex-col space-y-0 min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-[3rem]">
          {children}
        </div>
      </div>
    );
  }
);

Container.displayName = 'Header.Container';

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(FLEX_ITEMS_CENTER_SPACE_X_2, className)} {...props}>
      {children}
    </div>
  )
);

Logo.displayName = 'Header.Logo';

export interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn('hidden lg:flex items-center space-x-6', className)}
      role="navigation"
      aria-label="Main navigation"
      {...props}
    >
      {children}
    </nav>
  )
);

Navigation.displayName = 'Header.Navigation';

export interface ActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Actions = React.forwardRef<HTMLDivElement, ActionsProps>(
  ({ className, children, ...props }, ref) => {
    const context = useHeaderContext();

    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildWithContext(child, context)
    );

    return (
      <div ref={ref} className={cn('flex items-center space-x-4', className)} {...props}>
        {enhancedChildren}
      </div>
    );
  }
);

Actions.displayName = 'Header.Actions';

export interface MobileMenuProps extends React.HTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const MobileMenu = React.forwardRef<HTMLButtonElement, MobileMenuProps>(
  ({ className, children, ...props }, ref) => {
    const context = useHeaderContext();
    const isOpen = context?.isMenuOpen ?? false;

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn('lg:hidden', className)}
        onClick={context?.onToggleMenu}
        aria-expanded={isOpen}
        aria-label="Toggle mobile menu"
        {...props}
      >
        {children || (
          <svg
            className="h-5 w-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        )}
      </Button>
    );
  }
);

MobileMenu.displayName = 'Header.MobileMenu';

export interface LanguageSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  currentLocale?: string;
  onLocaleChange?: (locale: string) => void;
}

const LanguageSwitcher = React.forwardRef<HTMLDivElement, LanguageSwitcherProps>(
  (
    {
      className,
      children,
      currentLocale: propCurrentLocale,
      onLocaleChange: propOnLocaleChange,
      ...props
    },
    ref
  ) => {
    const context = useHeaderContext();
    const currentLocale = propCurrentLocale ?? context?.currentLocale ?? 'en';
    const onLocaleChange = propOnLocaleChange ?? context?.onLocaleChange;

    return (
      <div ref={ref} className={cn('flex items-center space-x-1', className)} {...props}>
        {children || (
          <>
            <Button
              variant={currentLocale === 'en' ? 'default' : 'ghost'}
              size="compact"
              className="h-5 px-1.5 text-xs sm:h-5 sm:px-2 sm:text-xs"
              onClick={() => onLocaleChange?.('en')}
              aria-label="Switch to English"
            >
              EN
            </Button>
            <Button
              variant={currentLocale === 'ru' ? 'default' : 'ghost'}
              size="compact"
              className="h-5 px-1.5 text-xs sm:h-5 sm:px-2 sm:text-xs"
              onClick={() => onLocaleChange?.('ru')}
              aria-label="Переключить на русский"
            >
              RU
            </Button>
          </>
        )}
      </div>
    );
  }
);

LanguageSwitcher.displayName = 'Header.LanguageSwitcher';

export interface UserMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  currentLocale?: string;
  onLocaleChange?: (locale: string) => void;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  signInText?: string;
  signOutText?: string;
}

const UserMenu = React.forwardRef<HTMLDivElement, UserMenuProps>(
  (
    {
      className,
      children,
      currentLocale: _currentLocale,
      onLocaleChange: _onLocaleChange,
      isAuthenticated: propIsAuthenticated,
      onSignIn,
      onSignOut,
      signInText = 'Sign In',
      signOutText = 'Sign Out',
      ...props
    },
    ref
  ) => {
    const context = useHeaderContext();
    const isAuth = propIsAuthenticated ?? context?.isAuthenticated ?? false;

    // Solution 1: Official React/Next.js hydration mismatch fix
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
      setIsClient(true);
      // Debug logging (remove in production)
      console.log('🔄 UserMenu: isClient=true, isAuth=', isAuth);
    }, [isAuth]);

    const renderAuthenticatedButtons = () => (
      <Button variant="default" size="compact" onClick={onSignOut ?? context?.onSignOut}>
        {signOutText}
      </Button>
    );

    const renderUnauthenticatedButtons = () => (
      <Button variant="default" size="compact" onClick={onSignIn ?? context?.onSignIn}>
        {signInText}
      </Button>
    );

    if (children) {
      return (
        <div ref={ref} className={cn(FLEX_ITEMS_CENTER_SPACE_X_2, className)} {...props}>
          {children}
        </div>
      );
    }

    // During SSR and initial hydration, show unauthenticated state
    // After client-side mount, show actual authentication state
    return (
      <div ref={ref} className={cn(FLEX_ITEMS_CENTER_SPACE_X_2, className)} {...props}>
        {isClient
          ? isAuth
            ? renderAuthenticatedButtons()
            : renderUnauthenticatedButtons()
          : renderUnauthenticatedButtons()}
      </div>
    );
  }
);

UserMenu.displayName = 'Header.UserMenu';

export interface WithThemeProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const WithTheme = React.forwardRef<HTMLElement, WithThemeProps>(
  ({ className, children, ...props }, ref) => (
    <Header ref={ref} className={className} {...props}>
      {children}
      <Actions>
        <ThemeToggle />
      </Actions>
    </Header>
  )
);

WithTheme.displayName = 'Header.WithTheme';

export const HeaderCompound = Object.assign(Header, {
  Container,
  Logo,
  Navigation,
  Actions,
  MobileMenu,
  LanguageSwitcher,
  UserMenu,
  WithTheme,
});

export {
  Header as Root,
  Container,
  Logo,
  Navigation,
  Actions,
  MobileMenu,
  LanguageSwitcher,
  UserMenu,
  WithTheme,
};

export default HeaderCompound;
