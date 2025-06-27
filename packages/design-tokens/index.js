// Main export for design tokens
export { colors } from './colors.js';
export { typography } from './typography.js';
export { spacing, borderRadius, boxShadow } from './spacing.js';

// Re-export as default object
import { colors } from './colors.js';
import { typography } from './typography.js';
import spacing from './spacing.js';

export default {
    colors,
    typography,
    ...spacing,
};
