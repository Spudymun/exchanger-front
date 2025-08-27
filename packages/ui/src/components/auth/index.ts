/**
 * Экспорт переиспользуемых компонентов аутентификации
 * Централизованное место для импорта всех auth компонентов
 */

// Main compound component
export { default as AuthForm } from '../auth-form-compound';

// Enhanced components with automatic context support - использую оригинальные компоненты
export { AuthPasswordField } from './AuthPasswordField';
export { AuthSubmitButton } from './AuthSubmitButton';

// Regular components (original versions - work with direct props)
export { AuthConfirmPasswordField } from './AuthConfirmPasswordField';
export { AuthCaptchaField } from './AuthCaptchaField';
export { AuthSwitchButton } from './AuthSwitchButton';
export { AuthFormLayout } from './AuthFormLayout';
