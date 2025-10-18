'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import React from 'react';

import { AuthForms } from './forms/AuthForms';
import { ForgotPasswordForms } from './forms/ForgotPasswordForms';

interface AuthDialogsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onForgotPasswordClose: () => void;
  onAuthSuccess?: () => void;
  onOpenForgotPassword: () => void;
  onOpenLogin: () => void;
}

/**
 * Hook для управления режимом auth модалки
 */
function useAuthDialogMode(isOpen: boolean, initialMode: 'login' | 'register') {
  const [mode, setMode] = React.useState<'login' | 'register'>(initialMode);

  // Сброс режима при закрытии модалки
  React.useEffect(() => {
    if (!isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  return [mode, setMode] as const;
}

/**
 * Компонент модалки входа/регистрации
 */
interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
  onAuthSuccess?: () => void;
  onSwitchToForgotPassword?: () => void;
  t: (key: string) => string;
}

function AuthDialog({
  isOpen,
  onClose,
  mode,
  onModeChange,
  onAuthSuccess,
  onSwitchToForgotPassword,
  t,
}: AuthDialogProps) {
  const dialogTitle = mode === 'login' ? t('signIn') : t('signUp');

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <AuthForms
          defaultMode={mode}
          onAuthSuccess={onAuthSuccess}
          onSwitchToForgotPassword={onSwitchToForgotPassword}
          onModeChange={onModeChange}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Компонент модалки восстановления пароля
 */
interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  onBackToLogin: () => void;
  t: (key: string) => string;
}

function ForgotPasswordDialog({
  isOpen,
  onClose,
  onAuthSuccess,
  onBackToLogin,
  t,
}: ForgotPasswordDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
        <DialogHeader>
          <DialogTitle>{t('resetPassword')}</DialogTitle>
        </DialogHeader>
        <ForgotPasswordForms onSuccess={onAuthSuccess} onBackToLogin={onBackToLogin} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook для создания handlers переключения между модалками
 */
function useAuthDialogHandlers(
  onLoginClose: () => void,
  onOpenForgotPassword: () => void,
  onForgotPasswordClose: () => void,
  onOpenLogin: () => void
) {
  return React.useMemo(
    () => ({
      switchToForgotPassword: () => {
        onLoginClose();
        onOpenForgotPassword();
      },
      backToLogin: () => {
        onForgotPasswordClose();
        onOpenLogin();
      },
    }),
    [onLoginClose, onOpenForgotPassword, onForgotPasswordClose, onOpenLogin]
  );
}

export function AuthDialogs({
  isLoginOpen,
  isRegisterOpen,
  isForgotPasswordOpen,
  onLoginClose,
  onRegisterClose,
  onForgotPasswordClose,
  onAuthSuccess,
  onOpenForgotPassword,
  onOpenLogin,
}: AuthDialogsProps) {
  const t = useTranslations('Layout.auth');
  const [loginDialogMode, setLoginDialogMode] = useAuthDialogMode(isLoginOpen, 'login');
  const [registerDialogMode, setRegisterDialogMode] = useAuthDialogMode(isRegisterOpen, 'register');
  const handlers = useAuthDialogHandlers(
    onLoginClose,
    onOpenForgotPassword,
    onForgotPasswordClose,
    onOpenLogin
  );

  return (
    <>
      <AuthDialog
        isOpen={isLoginOpen}
        onClose={onLoginClose}
        mode={loginDialogMode}
        onModeChange={setLoginDialogMode}
        onAuthSuccess={onAuthSuccess}
        onSwitchToForgotPassword={handlers.switchToForgotPassword}
        t={t}
      />
      <AuthDialog
        isOpen={isRegisterOpen}
        onClose={onRegisterClose}
        mode={registerDialogMode}
        onModeChange={setRegisterDialogMode}
        onAuthSuccess={onAuthSuccess}
        t={t}
      />
      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={onForgotPasswordClose}
        onAuthSuccess={onAuthSuccess}
        onBackToLogin={handlers.backToLogin}
        t={t}
      />
    </>
  );
}
