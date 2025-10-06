/**
 * Универсальные поля форм
 * Рефакторинг: централизованы из auth/ для переиспользования во всех формах
 */

export { FormEmailField } from './FormEmailField';
export { FormCaptchaField } from './FormCaptchaField';
export { FormResetCodeField } from './FormResetCodeField';

// Re-export типов для удобства
export type { EmailFormFields, CaptchaFormFields } from '../../types/auth-fields';
export type { ResetCodeFormFields } from './FormResetCodeField';
