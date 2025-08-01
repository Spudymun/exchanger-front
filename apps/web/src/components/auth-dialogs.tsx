'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import React from 'react';

import { AuthForms } from './forms/AuthForms';

interface AuthDialogsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onAuthSuccess?: () => void;
}

export function AuthDialogs({
  isLoginOpen,
  isRegisterOpen,
  onLoginClose,
  onRegisterClose,
  onAuthSuccess,
}: AuthDialogsProps) {
  const t = useTranslations('Layout.auth');

  return (
    <>
      {/* Модальное окно входа */}
      <Dialog open={isLoginOpen} onOpenChange={open => !open && onLoginClose()}>
        <DialogContent className="sm:max-w-md" closeButtonAriaLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('signIn')}</DialogTitle>
          </DialogHeader>
          <AuthForms defaultMode="login" onAuthSuccess={onAuthSuccess} />
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
    </>
  );
}
