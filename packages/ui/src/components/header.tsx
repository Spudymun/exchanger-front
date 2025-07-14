import React from 'react';

import { cn } from '../lib/utils';

import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface HeaderNavigationProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface HeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface HeaderLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export interface HeaderMobileMenuProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'isOpen' | 'onToggle'> {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export interface HeaderLanguageSwitcherProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'currentLocale' | 'onLocaleChange'> {
  className?: string;
  currentLocale?: string;
  onLocaleChange?: (locale: string) => void;
}

export interface HeaderUserMenuProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'isAuthenticated' | 'userName' | 'onSignIn' | 'onSignOut'
  > {
  className?: string;
  isAuthenticated?: boolean;
  userName?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

// Main Header Component
export const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn('bg-background border-b border-border sticky top-0 z-50 shadow-sm', className)}
      role="banner"
      {...props}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">{children}</div>
      </div>
    </header>
  )
);
Header.displayName = 'Header';

// Header Logo Component
export const HeaderLogo = React.forwardRef<HTMLDivElement, HeaderLogoProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center space-x-2', className)} {...props}>
      {children}
    </div>
  )
);
HeaderLogo.displayName = 'HeaderLogo';

// Header Navigation Component
export const HeaderNavigation = React.forwardRef<HTMLElement, HeaderNavigationProps>(
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
HeaderNavigation.displayName = 'HeaderNavigation';

// Header Actions Component
export const HeaderActions = React.forwardRef<HTMLDivElement, HeaderActionsProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center space-x-1 sm:space-x-2 lg:space-x-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);
HeaderActions.displayName = 'HeaderActions';

// Header Mobile Menu Component
export const HeaderMobileMenu = React.forwardRef<HTMLButtonElement, HeaderMobileMenuProps>(
  ({ className, isOpen = false, onToggle, ...restProps }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn('md:hidden', className)}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label="Toggle mobile menu"
      {...restProps}
    >
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
    </Button>
  )
);
HeaderMobileMenu.displayName = 'HeaderMobileMenu';

// Header Language Switcher Component
export const HeaderLanguageSwitcher = React.forwardRef<HTMLDivElement, HeaderLanguageSwitcherProps>(
  ({ className, currentLocale = 'en', onLocaleChange, ...restProps }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center space-x-1', className)} {...restProps}>
        <Button
          variant={currentLocale === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLocaleChange?.('en')}
          aria-label="Switch to English"
        >
          EN
        </Button>
        <Button
          variant={currentLocale === 'ru' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLocaleChange?.('ru')}
          aria-label="Переключить на русский"
        >
          RU
        </Button>
      </div>
    );
  }
);
HeaderLanguageSwitcher.displayName = 'HeaderLanguageSwitcher';

// Header User Menu Component
export const HeaderUserMenu = React.forwardRef<HTMLDivElement, HeaderUserMenuProps>(
  ({ className, isAuthenticated = false, userName, onSignIn, onSignOut, ...restProps }, ref) => (
    <div ref={ref} className={cn('flex items-center space-x-2', className)} {...restProps}>
      {isAuthenticated ? (
        <>
          <span className="text-sm text-muted-foreground">{userName}</span>
          <Button variant="outline" size="sm" onClick={onSignOut}>
            Sign Out
          </Button>
        </>
      ) : (
        <Button variant="default" size="sm" onClick={onSignIn}>
          Sign In
        </Button>
      )}
    </div>
  )
);
HeaderUserMenu.displayName = 'HeaderUserMenu';

// Combined Header with Theme Toggle
export const HeaderWithTheme = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, children, ...props }, ref) => (
    <Header ref={ref} className={className} {...props}>
      {children}
      <HeaderActions>
        <ThemeToggle />
      </HeaderActions>
    </Header>
  )
);
HeaderWithTheme.displayName = 'HeaderWithTheme';
