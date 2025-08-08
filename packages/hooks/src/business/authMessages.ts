/**
 * Типы для сообщений аутентификации
 * Выделено в отдельный файл согласно CODE_STYLE_GUIDE.md
 */
export interface AuthMessages {
    registerSuccess: string;
    registerSuccessDescription: string;
    passwordResetSent: string;
    passwordResetSentDescription: string;
    passwordChanged: string;
    passwordChangedDescription: string;
    emailVerified: string;
    emailVerifiedDescription: string;
}

/**
 * Дефолтные сообщения на английском языке
 */
export const DEFAULT_AUTH_MESSAGES: AuthMessages = {
    registerSuccess: 'Registration successful',
    registerSuccessDescription: 'Check your email to confirm your account',
    passwordResetSent: 'Instructions sent',
    passwordResetSentDescription: 'Check your email',
    passwordChanged: 'Password changed',
    passwordChangedDescription: 'You can sign in with your new password',
    emailVerified: 'Email verified',
    emailVerifiedDescription: 'Your account is now active',
};