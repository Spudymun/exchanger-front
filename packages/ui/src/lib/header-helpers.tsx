import * as React from 'react';

import { Button } from '../components/ui/button';

import { createEnhancementFunction } from './form-enhancement';

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

// ✅ PHASE 1: Заменяем duplicate enhanceChildWithContext на унифицированную систему
export const enhanceChildWithContext = createEnhancementFunction('header');
