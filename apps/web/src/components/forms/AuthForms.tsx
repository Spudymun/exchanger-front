import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import React from 'react';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthFormsProps {
  onAuthSuccess?: () => void;
  defaultMode?: 'login' | 'register';
}

/**
 * Auth Forms Component
 *
 * Централизованный компонент аутентификации:
 * - Использует LoginForm и RegisterForm (централизованные решения)
 * - Переключение между режимами входа и регистрации
 * - Общий layout и обработка успешной аутентификации
 * - Все формы используют централизованные хуки и валидацию
 */
export function AuthForms({ onAuthSuccess, defaultMode = 'login' }: AuthFormsProps) {
  const [mode, setMode] = React.useState<'login' | 'register'>(defaultMode);
  const t = useTranslations('Layout.auth');

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background border rounded-lg shadow-md p-6">
        <AuthFormsHeader mode={mode} t={t} />
        <AuthFormsToggle mode={mode} onSwitch={{ switchToLogin, switchToRegister }} t={t} />
        <AuthFormsContent
          mode={mode}
          onAuthSuccess={onAuthSuccess}
          onSwitch={{ switchToLogin, switchToRegister }}
        />
      </div>
    </div>
  );
}

interface AuthFormsHeaderProps {
  mode: 'login' | 'register';
  t: (key: string) => string;
}

const AuthFormsHeader: React.FC<AuthFormsHeaderProps> = ({ mode, t }) => (
  <div className="text-center mb-6">
    <h2 className="text-2xl font-bold text-foreground">
      {mode === 'login' ? t('loginTitle') : t('registerTitle')}
    </h2>
    <p className="text-sm text-muted-foreground mt-2">
      {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
    </p>
  </div>
);

interface AuthFormsToggleProps {
  mode: 'login' | 'register';
  onSwitch: {
    switchToLogin: () => void;
    switchToRegister: () => void;
  };
  t: (key: string) => string;
}

const AuthFormsToggle: React.FC<AuthFormsToggleProps> = ({ mode, onSwitch, t }) => (
  <div className="flex rounded-lg bg-muted p-1 mb-6">
    <Button
      variant={mode === 'login' ? 'default' : 'ghost'}
      size="compact"
      className="flex-1"
      onClick={onSwitch.switchToLogin}
      type="button"
    >
      {t('loginButton')}
    </Button>
    <Button
      variant={mode === 'register' ? 'default' : 'ghost'}
      size="compact"
      className="flex-1"
      onClick={onSwitch.switchToRegister}
      type="button"
    >
      {t('registerButton')}
    </Button>
  </div>
);

interface AuthFormsContentProps {
  mode: 'login' | 'register';
  onAuthSuccess?: () => void;
  onSwitch: {
    switchToLogin: () => void;
    switchToRegister: () => void;
  };
}

const AuthFormsContent: React.FC<AuthFormsContentProps> = ({ mode, onAuthSuccess, onSwitch }) => {
  if (mode === 'login') {
    return <LoginForm onSuccess={onAuthSuccess} onSwitchToRegister={onSwitch.switchToRegister} />;
  }

  return <RegisterForm onSuccess={onAuthSuccess} onSwitchToLogin={onSwitch.switchToLogin} />;
};
