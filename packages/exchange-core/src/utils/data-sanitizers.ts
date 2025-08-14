/**
 * Data sanitization utilities
 * Separated from validation logic for better organization
 */

/**
 * Sanitize email by converting to lowercase and trimming whitespace
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize user input by trimming whitespace
 */
export function sanitizeInput(input: string): string {
  return input.trim();
}
