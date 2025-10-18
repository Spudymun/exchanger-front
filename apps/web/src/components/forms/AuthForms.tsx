import { AuthFormLayout } from '@repo/ui';
import { useTranslations } from 'next-intl';
import React from 'react';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthFormsProps {
  onAuthSuccess?: () => void;
  defaultMode?: 'login' | 'register';
  onSwitchToForgotPassword?: () => void;
  onModeChange?: (mode: 'login' | 'register') => void;
}

/**
 * Auth Forms Component
 *
 * Централизованный компонент аутентификации:
 * - Использует LoginForm и RegisterForm (централизованные решения)
 * - Переключение между режимами входа и регистрации
 * - Общий layout и обработка успешной аутентификации
 * - Все формы используют централизованные хуки и валидацию
 * - Оптимизирован с помощью React.memo для предотвращения лишних ре-рендеров
 */
export const AuthForms = React.memo<AuthFormsProps>(
  ({ onAuthSuccess, defaultMode = 'login', onSwitchToForgotPassword, onModeChange }) => {
    const [mode, setMode] = React.useState<'login' | 'register'>(defaultMode);
    const t = useTranslations('Layout.auth');

    const handleModeChange = React.useCallback(
      (newMode: 'login' | 'register') => {
        setMode(newMode);
        onModeChange?.(newMode);
      },
      [onModeChange]
    );

    return (
      <AuthFormLayout mode={mode} onModeChange={handleModeChange} t={t}>
        <AuthFormsContent
          mode={mode}
          onAuthSuccess={onAuthSuccess}
          onSwitchToForgotPassword={onSwitchToForgotPassword}
        />
      </AuthFormLayout>
    );
  }
);

AuthForms.displayName = 'AuthForms';

interface AuthFormsContentProps {
  mode: 'login' | 'register';
  onAuthSuccess?: () => void;
  onSwitchToForgotPassword?: () => void;
}

const AuthFormsContent: React.FC<AuthFormsContentProps> = React.memo(
  ({ mode, onAuthSuccess, onSwitchToForgotPassword }) => {
    if (mode === 'login') {
      return (
        <LoginForm onSuccess={onAuthSuccess} onSwitchToForgotPassword={onSwitchToForgotPassword} />
      );
    }

    return <RegisterForm onSuccess={onAuthSuccess} />;
  }
);

AuthFormsContent.displayName = 'AuthFormsContent';
