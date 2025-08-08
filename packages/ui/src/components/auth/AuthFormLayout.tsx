import React from 'react';

import { Button } from '../ui/button';

interface AuthFormLayoutProps {
    mode: 'login' | 'register';
    onModeChange: (mode: 'login' | 'register') => void;
    t: (key: string) => string;
    children: React.ReactNode;
}

/**
 * Auth Form Layout Component
 * 
 * Централизованный layout для auth форм:
 * - Заголовок с переключением режимов
 * - Единообразный стиль для всех auth форм
 * - Использует централизованные CSS классы
 */
export function AuthFormLayout({ mode, onModeChange, t, children }: AuthFormLayoutProps) {
    const switchToLogin = React.useCallback(() => onModeChange('login'), [onModeChange]);
    const switchToRegister = React.useCallback(() => onModeChange('register'), [onModeChange]);

    return (
        <div className="auth-form-container">
            <div className="auth-form-wrapper">
                <AuthFormHeader mode={mode} t={t} />
                <AuthFormToggle
                    mode={mode}
                    onSwitch={{ switchToLogin, switchToRegister }}
                    t={t}
                />
                {children}
            </div>
        </div>
    );
}

interface AuthFormHeaderProps {
    mode: 'login' | 'register';
    t: (key: string) => string;
}

const AuthFormHeader: React.FC<AuthFormHeaderProps> = React.memo(({ mode, t }) => (
    <div className="text-center-with-margin">
        <h2 className="text-2xl font-bold text-foreground">
            {mode === 'login' ? t('loginTitle') : t('registerTitle')}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
            {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
        </p>
    </div>
));

AuthFormHeader.displayName = 'AuthFormHeader';

interface AuthFormToggleProps {
    mode: 'login' | 'register';
    onSwitch: {
        switchToLogin: () => void;
        switchToRegister: () => void;
    };
    t: (key: string) => string;
}

const AuthFormToggle: React.FC<AuthFormToggleProps> = React.memo(({ mode, onSwitch, t }) => (
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
));

AuthFormToggle.displayName = 'AuthFormToggle';