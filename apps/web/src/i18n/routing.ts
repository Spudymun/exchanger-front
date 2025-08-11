import { SUPPORTED_LOCALES, I18N_CONFIG } from '@repo/constants';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: SUPPORTED_LOCALES,

  // Used when no locale matches - using centralized default
  defaultLocale: I18N_CONFIG.DEFAULT_LOCALE,
});
