'use client';

import * as React from 'react';

/**
 * ✅ AuthModalContext - глобальный контекст для управления модалками авторизации
 * 
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ:
 * - Единственный источник истины для состояния модалок
 * - Позволяет открывать модалки из любого компонента
 * - Следует паттерну существующих providers (theme-provider.tsx)
 * 
 * USE CASES:
 * - Автоматическое открытие логина при UNAUTHORIZED ошибке
 * - Ручное открытие из кнопок/ссылок
 * - Переключение между модалками (login ↔ register ↔ forgotPassword)
 */

interface AuthModalContextValue {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  isForgotPasswordOpen: boolean;
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  closeAll: () => void;
}

const AuthModalContext = React.createContext<AuthModalContextValue | undefined>(undefined);

export function useAuthModal() {
  const context = React.useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
}

interface AuthModalProviderProps {
  children: React.ReactNode;
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState(false);

  const openLogin = React.useCallback(() => {
    setIsRegisterOpen(false);
    setIsForgotPasswordOpen(false);
    setIsLoginOpen(true);
  }, []);

  const openRegister = React.useCallback(() => {
    setIsLoginOpen(false);
    setIsForgotPasswordOpen(false);
    setIsRegisterOpen(true);
  }, []);

  const openForgotPassword = React.useCallback(() => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
    setIsForgotPasswordOpen(true);
  }, []);

  const closeAll = React.useCallback(() => {
    setIsLoginOpen(false);
    setIsRegisterOpen(false);
    setIsForgotPasswordOpen(false);
  }, []);

  const value = React.useMemo(
    () => ({
      isLoginOpen,
      isRegisterOpen,
      isForgotPasswordOpen,
      openLogin,
      openRegister,
      openForgotPassword,
      closeAll,
    }),
    [isLoginOpen, isRegisterOpen, isForgotPasswordOpen, openLogin, openRegister, openForgotPassword, closeAll]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}
