/**
 * Централизованные типы для аутентификации
 * Устраняет дублирование типов между формами логина и регистрации
 */

/**
 * Базовые поля формы аутентификации - УПРОЩЕННЫЕ
 * Общие для всех форм аутентификации
 */
export interface BaseAuthFormData {
    email: string;
    password: string;
    captcha: string;
    // Убрано: captchaVerified - избыточность устранена
}

/**
 * Данные формы логина
 * Расширяет базовые поля
 */
export interface LoginFormData extends BaseAuthFormData, Record<string, unknown> { }

/**
 * Данные формы регистрации
 * Добавляет подтверждение пароля к базовым полям
 */
export interface RegisterFormData extends BaseAuthFormData, Record<string, unknown> {
    confirmPassword: string;
}

/**
 * Общие пропсы для полей форм аутентификации
 * ИСПРАВЛЕНО: Используем UseFormReturn из hooks пакета вместо дублирования
 */
export interface AuthFieldProps<T extends Record<string, unknown>> {
    form: import('@repo/hooks').UseFormReturn<T>;
    isLoading: boolean;
    t: (key: string) => string;
}

/**
 * Пропсы для полей логина
 */
export type LoginFieldProps = AuthFieldProps<LoginFormData>;

/**
 * Пропсы для полей регистрации
 */
export type RegisterFieldProps = AuthFieldProps<RegisterFormData>

/**
 * Общие пропсы для форм аутентификации
 */
export interface BaseAuthFormProps {
    onSuccess?: () => void;
}

/**
 * Пропсы для формы логина
 */
export interface LoginFormProps extends BaseAuthFormProps {
    onSwitchToRegister?: () => void;
}

/**
 * Пропсы для формы регистрации
 */
export interface RegisterFormProps extends BaseAuthFormProps {
    onSwitchToLogin?: () => void;
}