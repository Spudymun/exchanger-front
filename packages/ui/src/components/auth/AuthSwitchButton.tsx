import React from 'react';

/**
 * Переиспользуемая кнопка переключения между формами
 * Унифицирует стили и поведение
 * 
 * АРХИТЕКТУРНОЕ ИСПРАВЛЕНИЕ:
 * - Убрана зависимость от next-intl (UI пакет должен быть переносимым)
 * - Заменен хардкод цветов на семантические переменные
 * - Текст передается через пропсы
 */
interface AuthSwitchButtonProps {
    onSwitch?: () => void;
    isLoading: boolean;
    children: React.ReactNode;
}

export const AuthSwitchButton: React.FC<AuthSwitchButtonProps> = ({
    onSwitch,
    isLoading,
    children
}) => {
    // Валидация обязательных пропсов
    if (typeof isLoading !== 'boolean') {
        throw new Error('AuthSwitchButton: isLoading must be a boolean');
    }
    if (!children) {
        throw new Error('AuthSwitchButton: children prop is required');
    }

    if (!onSwitch) return null;

    return (
        <div className="auth-switch-container">
            <button
                type="button"
                onClick={onSwitch}
                className="auth-switch-button"
                disabled={isLoading}
            >
                {children}
            </button>
        </div>
    );
};