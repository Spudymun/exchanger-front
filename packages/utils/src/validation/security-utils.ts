// Security utilities for XSS protection and validation
import { VALIDATION_LIMITS } from '@repo/constants';
import { z } from 'zod';

/**
 * Advanced XSS detection patterns following OWASP guidelines
 * Detects: script tags, event handlers, data URIs, javascript: URLs,
 * HTML entities, SQL injection attempts
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi, // Script tags
  /<iframe[^>]*>.*?<\/iframe>/gi, // Iframe tags
  /javascript:/gi, // JavaScript URLs
  /data:(?!image\/(?:png|jpe?g|gif|svg\+xml))[^;]*;/gi, // Dangerous data URIs
  /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
  /&#x?[0-9a-f]+;?/gi, // HTML entities
  /eval\s*\(/gi, // eval() calls
  /expression\s*\(/gi, // CSS expression()
  /vbscript:/gi, // VBScript URLs
  /formaction\s*=/gi, // Form hijacking
  /(union|select|insert|update|delete|drop|exec|script)\s/gi, // SQL injection
] as const;

/**
 * Checks if a string contains potential XSS patterns
 * @param value - String to check for XSS
 * @returns boolean indicating if XSS patterns are detected
 */
export function containsPotentialXSS(value: string): boolean {
  if (typeof value !== 'string') return false;

  const normalizedValue = value.toLowerCase().replace(/\s+/g, ' ');

  return XSS_PATTERNS.some(pattern => pattern.test(normalizedValue));
}

/**
 * Creates XSS-protected string schema with validation
 * @param minLength - Minimum string length (default: 0)
 * @param maxLength - Maximum string length (default: 500)
 * @returns Zod schema with XSS protection
 */
export function createXSSProtectedString(
  minLength: number = 0,
  maxLength: number = 500
): z.ZodEffects<z.ZodString, string, string> {
  return z
    .string()
    .min(minLength, `Минимальная длина: ${minLength} символов`)
    .max(maxLength, `Максимальная длина: ${maxLength} символов`)
    .refine(val => !containsPotentialXSS(val), {
      message: 'Обнаружен потенциально опасный контент',
    });
}

/**
 * Base XSS-protected string schema for general use
 */
export const xssProtectedStringSchema = createXSSProtectedString();

/**
 * Security validation limits for consistent validation across the app
 * NOTE: Common limits imported from @repo/constants to avoid duplication
 */
export const SECURITY_VALIDATION_LIMITS = {
  // Authentication limits - imported from centralized constants
  PASSWORD_MIN_LENGTH: VALIDATION_LIMITS.PASSWORD_MIN_LENGTH, // was: 8
  PASSWORD_MAX_LENGTH: VALIDATION_LIMITS.PASSWORD_MAX_LENGTH, // was: 128
  EMAIL_MAX_LENGTH: VALIDATION_LIMITS.EMAIL_MAX_LENGTH, // was: 254, now 255 (unified)
  NAME_MAX_LENGTH: 100,
  NAME_MIN_LENGTH: 2,

  // Content limits
  MESSAGE_MAX_LENGTH: 1000,
  MESSAGE_MIN_LENGTH: 10,
  SUBJECT_MAX_LENGTH: 200,
  SUBJECT_MIN_LENGTH: 5,
  BIO_MAX_LENGTH: 500,
  COMMENT_MAX_LENGTH: 500,

  // System limits
  TAG_MAX_LENGTH: 50,
  AUTH_CODE_MAX_LENGTH: 10,
  SEARCH_QUERY_MAX_LENGTH: VALIDATION_LIMITS.SEARCH_QUERY_MAX_LENGTH, // was: 100

  // Additional validation limits
  AMOUNT_MAX_LENGTH: 50,
  CARD_NUMBER_MIN_LENGTH: 16,
  CARD_NUMBER_MAX_LENGTH: 19,
  PHONE_MAX_LENGTH: 20,
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,

  // Content-specific limits
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 10000,
  SLUG_MIN_LENGTH: 3,
  SLUG_MAX_LENGTH: 100,
  TAG_MIN_LENGTH: 2,
  TAGS_MAX_COUNT: 10,

  // Search defaults
  SEARCH_DEFAULT_LIMIT: 10,
} as const;

/**
 * Security patterns for consistent validation
 *
 * NOTE: XSS detection patterns moved to XSS_PATTERNS array above.
 * All XSS protection uses the comprehensive XSS_PATTERNS through containsPotentialXSS() function.
 */
export const SECURITY_PATTERNS = {
  // Безопасный phone pattern
  PHONE: /^\+?[\d\s\-()]+$/,

  // Безопасный slug pattern
  SLUG: /^[a-z0-9-]+$/,
} as const;
