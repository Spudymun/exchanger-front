/**
 * Security-Enhanced Authentication Schemas
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Validation schemas для аутентификации
 * НА ОСНОВЕ: packages/utils/src/validation-schemas.ts
 * ИНТЕГРАЦИЯ: tRPC auth routers
 */

import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

import { emailSchema, passwordSchema } from './schemas-basic';
import {
  createXSSProtectedString,
  containsPotentialXSS,
  SECURITY_VALIDATION_LIMITS,
} from './security-utils';

/**
 * CAPTCHA SCHEMA с enhanced security
 */
export const securityEnhancedCaptchaSchema = z
  .string()
  .min(1)
  .refine(value => {
    if (containsPotentialXSS(value)) {
      return false;
    }
    if (value.trim().length === 0) {
      return false;
    }
    return true;
  });

/**
 * EMAIL SCHEMA с enhanced security
 */
export const securityEnhancedEmailSchema = emailSchema;

/**
 * AUTH FORMS SCHEMAS
 */
export const securityEnhancedLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  captcha: securityEnhancedCaptchaSchema,
});

export const securityEnhancedRegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH),
    captcha: securityEnhancedCaptchaSchema,
  })
  .refine(data => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'PASSWORD_CONFIRMATION_MISMATCH',
  });

/**
 * AUTHENTICATION SCHEMAS
 */
export const securityEnhancedResetPasswordSchema = z.object({
  email: emailSchema,
});

export const securityEnhancedConfirmResetPasswordSchema = z.object({
  email: emailSchema,
  resetCode: createXSSProtectedString(1, SECURITY_VALIDATION_LIMITS.AUTH_CODE_MAX_LENGTH).refine(
    val => val.length > 0,
    'RESET_CODE_REQUIRED'
  ),
  newPassword: passwordSchema,
});

export const securityEnhancedConfirmEmailSchema = z.object({
  email: emailSchema,
  verificationCode: createXSSProtectedString(
    1,
    SECURITY_VALIDATION_LIMITS.AUTH_CODE_MAX_LENGTH
  ).refine(val => val.length > 0, 'VERIFICATION_CODE_REQUIRED'),
});

export const securityEnhancedChangePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'PASSWORD_CONFIRMATION_MISMATCH',
  });

/**
 * TYPE EXPORTS
 */
export type SecurityEnhancedLoginForm = z.infer<typeof securityEnhancedLoginSchema>;
export type SecurityEnhancedRegisterForm = z.infer<typeof securityEnhancedRegisterSchema>;
export type SecurityEnhancedResetPassword = z.infer<typeof securityEnhancedResetPasswordSchema>;
export type SecurityEnhancedConfirmResetPassword = z.infer<
  typeof securityEnhancedConfirmResetPasswordSchema
>;
export type SecurityEnhancedConfirmEmail = z.infer<typeof securityEnhancedConfirmEmailSchema>;
export type SecurityEnhancedChangePassword = z.infer<typeof securityEnhancedChangePasswordSchema>;
export type SecurityEnhancedCaptcha = z.infer<typeof securityEnhancedCaptchaSchema>;
export type SecurityEnhancedEmail = z.infer<typeof securityEnhancedEmailSchema>;
