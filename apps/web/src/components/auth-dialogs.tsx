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

  // Handler для переключения с login на forgot password
  const handleSwitchToForgotPassword = React.useCallback(() => {
    onLoginClose();
    onOpenForgotPassword();
  }, [onLoginClose, onOpenForgotPassword]);

  // Handler для возврата с forgot password на login
  const handleBackToLogin = React.useCallback(() => {
    onForgotPasswordClose();
    onOpenLogin();
  }, [onForgotPasswordClose, onOpenLogin]);

  return (
    <>
      {/* Модальное окно входа */}
      <Dialog open={isLoginOpen} onOpenChange={open => !open && onLoginClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('signIn')}</DialogTitle>
          </DialogHeader>
          <AuthForms 
            defaultMode="login" 
            onAuthSuccess={onAuthSuccess}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
          />
        </DialogContent>
      </Dialog>

      {/* Модальное окно регистрации */}
      <Dialog open={isRegisterOpen} onOpenChange={open => !open && onRegisterClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('signUp')}</DialogTitle>
          </DialogHeader>
          <AuthForms defaultMode="register" onAuthSuccess={onAuthSuccess} />
        </DialogContent>
      </Dialog>

      {/* Модальное окно восстановления пароля */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={open => !open && onForgotPasswordClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('resetPassword')}</DialogTitle>
          </DialogHeader>
          <ForgotPasswordForms onSuccess={onAuthSuccess} onBackToLogin={handleBackToLogin} />
        </DialogContent>
      </Dialog>
    </>
  );
}
