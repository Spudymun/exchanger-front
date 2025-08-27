/**
 * Универсальные поля форм
 * Рефакторинг: централизованы из auth/ для переиспользования во всех формах
 */

export { FormEmailField } from './FormEmailField';
export { FormCaptchaField } from './FormCaptchaField';

// Re-export типов для удобства
export type { EmailFormFields, CaptchaFormFields } from '../../types/auth-fields';
