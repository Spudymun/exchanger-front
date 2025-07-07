// This file is kept for backward compatibility
// All validation functions have been moved to specialized modules:
// - basic-validators.ts for simple validations
// - business-validators.ts for domain-specific validations
// - composite-validators.ts for complex data structures
// - order-validators.ts for complete order validation

// Re-export ValidationResult for compatibility
export type { ValidationResult } from './basic-validators';
