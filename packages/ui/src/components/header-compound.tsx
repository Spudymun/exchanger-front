'use client';

import * as React from 'react';

import { cn } from '../lib/utils';

import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

// ===== COMPOUND COMPONENTS ARCHITECTURE v2.0 =====
// Header Compound Component following ExchangeForm pattern
// Context API + React.cloneElement for prop enhancement

// Header Context
export interface HeaderContextValue {
  isMenuOpen?: boolean;
  currentLocale?: string;
  isAuthenticated?: boolean;
  userName?: string;
  onToggleMenu?: () => void;
  onLocaleChange?: (locale: string) => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

const HeaderContext = React.createContext<HeaderContextValue | undefined>(undefined);

export const useHeaderContext = () => {
  return React.useContext(HeaderContext);
};

// ===== ROOT COMPONENT =====
export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
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
      ...props
    },
    ref
  ) => {
    const contextValue: HeaderContextValue = {
      isMenuOpen,
      currentLocale,
      isAuthenticated,
      userName,
      onToggleMenu,
      onLocaleChange,
      onSignIn,
      onSignOut,
    };

    return (
      <HeaderContext.Provider value={contextValue}>
        <header
          ref={ref}
          className={cn(
            'bg-background border-b border-border sticky top-0 z-50 shadow-sm',
            className
          )}
          role="banner"
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">{children}</div>
          </div>
        </header>
      </HeaderContext.Provider>
    );
  }
);

Header.displayName = 'Header';

// ===== CONTAINER COMPONENT =====
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
        <div className="flex justify-between items-center h-16">{children}</div>
      </div>
    );
  }
);

Container.displayName = 'Header.Container';

// ===== LOGO COMPONENT =====
export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center space-x-2', className)} {...props}>
      {children}
    </div>
  )
);

Logo.displayName = 'Header.Logo';

// ===== NAVIGATION COMPONENT =====
export interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn('hidden md:flex items-center space-x-6', className)}
      role="navigation"
      aria-label="Main navigation"
      {...props}
    >
      {children}
    </nav>
  )
);

Navigation.displayName = 'Header.Navigation';

// ===== ACTIONS COMPONENT =====
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

// ===== MOBILE MENU COMPONENT =====
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
        className={cn('md:hidden', className)}
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

// ===== LANGUAGE SWITCHER COMPONENT =====
export interface LanguageSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const LanguageSwitcher = React.forwardRef<HTMLDivElement, LanguageSwitcherProps>(
  ({ className, children, ...props }, ref) => {
    const context = useHeaderContext();
    const currentLocale = context?.currentLocale ?? 'en';

    return (
      <div ref={ref} className={cn('flex items-center space-x-1', className)} {...props}>
        {children || (
          <>
            <Button
              variant={currentLocale === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => context?.onLocaleChange?.('en')}
              aria-label="Switch to English"
            >
              EN
            </Button>
            <Button
              variant={currentLocale === 'ru' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => context?.onLocaleChange?.('ru')}
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

// ===== USER MENU COMPONENT =====
export interface UserMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const UserMenu = React.forwardRef<HTMLDivElement, UserMenuProps>(
  ({ className, children, ...props }, ref) => {
    const context = useHeaderContext();
    const isAuthenticated = context?.isAuthenticated ?? false;
    const userName = context?.userName;

    return (
      <div ref={ref} className={cn('flex items-center space-x-2', className)} {...props}>
        {children || (
          <>
            {isAuthenticated ? (
              <>
                {userName && <span className="text-sm text-muted-foreground">{userName}</span>}
                <Button variant="outline" size="sm" onClick={context?.onSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" onClick={context?.onSignIn}>
                Sign In
              </Button>
            )}
          </>
        )}
      </div>
    );
  }
);

UserMenu.displayName = 'Header.UserMenu';

// ===== ENHANCED CHILD COMPONENTS =====
// Following ExchangeForm pattern for prop enhancement

function addLocaleProps(
  props: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (context?.currentLocale && !childProps.currentLocale) {
    props.currentLocale = context.currentLocale;
  }
  if (context?.onLocaleChange && !childProps.onLocaleChange) {
    props.onLocaleChange = context.onLocaleChange;
  }
}

function addAuthProps(
  props: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (context?.isAuthenticated !== undefined && !childProps.isAuthenticated) {
    props.isAuthenticated = context.isAuthenticated;
  }
  if (context?.onSignIn && !childProps.onSignIn) {
    props.onSignIn = context.onSignIn;
  }
  if (context?.onSignOut && !childProps.onSignOut) {
    props.onSignOut = context.onSignOut;
  }
}

function createEnhancedProps(
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  const enhancedProps: Record<string, unknown> = {};
  addLocaleProps(enhancedProps, context, childProps);
  addAuthProps(enhancedProps, context, childProps);
  return enhancedProps;
}

function enhanceChildWithContext(child: React.ReactNode, context: HeaderContextValue | undefined) {
  if (!React.isValidElement(child)) {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps = createEnhancedProps(context, childProps);
  return React.cloneElement(child, enhancedProps);
}

// ===== THEME TOGGLE INTEGRATION =====
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

// ===== COMPOUND COMPONENT EXPORT =====
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

// ===== INDIVIDUAL EXPORTS =====
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

// Default export as compound component
export default HeaderCompound;
