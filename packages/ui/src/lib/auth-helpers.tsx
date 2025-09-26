'use client';

import { createEnhancementFunction } from './form-enhancement';

// ✅ ИСПОЛЬЗУЕМ унифицированную функцию из form-enhancement.ts
export const enhanceChildWithContext = createEnhancementFunction('auth');
