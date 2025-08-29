// Security utilities for XSS protection and validation
import { VALIDATION_LIMITS } from '@repo/constants';

import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, SEARCH_QUERY_MAX_LENGTH } from './schemas-basic';

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
 * Security validation limits for consistent validation across the app
 * NOTE: Common limits imported from @repo/constants to avoid duplication
 */
export const SECURITY_VALIDATION_LIMITS = {
  // Authentication limits - imported from centralized constants
  PASSWORD_MIN_LENGTH, // Используем импорт из schemas-basic
  PASSWORD_MAX_LENGTH, // Используем импорт из schemas-basic
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
  SEARCH_QUERY_MAX_LENGTH, // Используем импорт из schemas-basic

  // Additional validation limits
  AMOUNT_MAX_LENGTH: 50,
  // Card validation constants moved to @repo/constants/validation.ts for centralization
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
