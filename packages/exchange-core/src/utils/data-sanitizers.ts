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

/**
 * Sanitize HTML content by removing dangerous characters and patterns
 * Protects against XSS attacks in template variables
 */
export function sanitizeHtmlContent(content: string): string {
  if (typeof content !== 'string') {
    return '';
  }

  return (
    content
      // Remove script tags
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      // Remove iframe tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove dangerous data URIs
      .replace(/data:(?!image\/(?:png|jpe?g|gif|svg\+xml))[^;]*;/gi, '')
      // Remove HTML entities that could be used for XSS
      .replace(/&#x?[0-9a-f]+;?/gi, '')
      // Remove eval() calls
      .replace(/eval\s*\(/gi, '')
      // Remove CSS expression()
      .replace(/expression\s*\(/gi, '')
      // Remove VBScript URLs
      .replace(/vbscript:/gi, '')
      // Remove form action hijacking
      .replace(/formaction\s*=/gi, '')
      // Trim whitespace
      .trim()
  );
}
