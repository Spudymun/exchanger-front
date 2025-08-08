import * as React from 'react';

import type { HeaderContextValue } from '../components/header-compound';
import { Button } from '../components/ui/button';

export function renderAuthenticatedUser(
  userName: string | undefined,
  onSignOut: (() => void) | undefined,
  labels?: { signOut?: string; signOutShort?: string }
) {
  return (
    <>
      {userName && (
        <span className="text-sm text-muted-foreground hidden sm:inline">{userName}</span>
      )}
      <Button variant="outline" size="compact" onClick={onSignOut}>
        <span className="sm:hidden">{labels?.signOutShort || 'Out'}</span>
        <span className="hidden sm:inline">{labels?.signOut || 'Sign Out'}</span>
      </Button>
    </>
  );
}

export function renderUnauthenticatedUser(
  onSignIn: (() => void) | undefined,
  labels?: { signIn?: string; signInShort?: string }
) {
  return (
    <Button variant="default" size="compact" onClick={onSignIn}>
      <span className="sm:hidden">{labels?.signInShort || 'In'}</span>
      <span className="hidden sm:inline">{labels?.signIn || 'Sign In'}</span>
    </Button>
  );
}

interface UserMenuOptions {
  isAuth: boolean;
  userName?: string;
  onSignOut?: () => void;
  onSignIn?: () => void;
  labels?: {
    signIn?: string;
    signInShort?: string;
    signOut?: string;
    signOutShort?: string;
  };
}

export function getUserMenuContent(
  children: React.ReactNode | undefined,
  options: UserMenuOptions
) {
  const { isAuth, userName, onSignOut, onSignIn, labels } = options;
  return (
    children ||
    (isAuth
      ? renderAuthenticatedUser(userName, onSignOut, labels)
      : renderUnauthenticatedUser(onSignIn, labels))
  );
}

function shouldEnhanceProp(contextValue: unknown, childProp: unknown): boolean {
  return contextValue !== undefined && !childProp;
}

function addCurrentLocale(
  enhancedProps: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.currentLocale, childProps.currentLocale)) {
    enhancedProps.currentLocale = context?.currentLocale;
  }
}

function addOnLocaleChange(
  enhancedProps: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.onLocaleChange, childProps.onLocaleChange)) {
    enhancedProps.onLocaleChange = context?.onLocaleChange;
  }
}

function addIsAuthenticated(
  enhancedProps: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.isAuthenticated, childProps.isAuthenticated)) {
    enhancedProps.isAuthenticated = context?.isAuthenticated;
  }
}

function addOnSignIn(
  enhancedProps: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.onSignIn, childProps.onSignIn)) {
    enhancedProps.onSignIn = context?.onSignIn;
  }
}

function addOnSignOut(
  enhancedProps: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.onSignOut, childProps.onSignOut)) {
    enhancedProps.onSignOut = context?.onSignOut;
  }
}

function addContextProps(
  enhancedProps: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  addCurrentLocale(enhancedProps, context, childProps);
  addOnLocaleChange(enhancedProps, context, childProps);
  addIsAuthenticated(enhancedProps, context, childProps);
  addOnSignIn(enhancedProps, context, childProps);
  addOnSignOut(enhancedProps, context, childProps);
}

export function enhanceChildWithContext(
  child: React.ReactNode,
  context: HeaderContextValue | undefined
) {
  if (!React.isValidElement(child) || typeof child.type === 'string') {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps: Record<string, unknown> = {};

  // Явное добавление свойств
  addContextProps(enhancedProps, context, childProps);

  return React.cloneElement(child, enhancedProps);
}
