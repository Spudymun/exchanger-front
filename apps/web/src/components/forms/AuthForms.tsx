import { Button } from '@repo/ui';
import React from 'react';

import { LoginForm } from './LoginForm.js';
import { RegisterForm } from './RegisterForm.js';

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

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <AuthFormsHeader mode={mode} />
        <AuthFormsToggle mode={mode} onSwitch={{ switchToLogin, switchToRegister }} />
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
}

const AuthFormsHeader: React.FC<AuthFormsHeaderProps> = ({ mode }) => (
  <div className="text-center mb-6">
    <h2 className="text-2xl font-bold text-gray-900">
      {mode === 'login' ? 'Вход в систему' : 'Регистрация'}
    </h2>
    <p className="text-sm text-gray-600 mt-2">
      {mode === 'login'
        ? 'Войдите в свой аккаунт для продолжения'
        : 'Создайте новый аккаунт для начала работы'}
    </p>
  </div>
);

interface AuthFormsToggleProps {
  mode: 'login' | 'register';
  onSwitch: {
    switchToLogin: () => void;
    switchToRegister: () => void;
  };
}

const AuthFormsToggle: React.FC<AuthFormsToggleProps> = ({ mode, onSwitch }) => (
  <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
    <Button
      variant={mode === 'login' ? 'default' : 'ghost'}
      className="flex-1"
      onClick={onSwitch.switchToLogin}
      type="button"
    >
      Вход
    </Button>
    <Button
      variant={mode === 'register' ? 'default' : 'ghost'}
      className="flex-1"
      onClick={onSwitch.switchToRegister}
      type="button"
    >
      Регистрация
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
