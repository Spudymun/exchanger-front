import { type SupportedLocale, SUPPORTED_LOCALES, I18N_CONFIG } from '@repo/constants';
import { type User, userManager } from '@repo/exchange-core';
import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';

import { createErrorMessageFunction } from '../utils/i18n-errors';

/**
 * Parse Accept-Language header to get preferred locale
 */
function getLocaleFromAcceptLanguage(acceptLanguage: string): SupportedLocale {
  if (!acceptLanguage) {
    return I18N_CONFIG.FALLBACK_LOCALE;
  }

  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q = 'q=1'] = lang.trim().split(';');
      if (!locale) return null;
      const quality = parseFloat(q.replace('q=', ''));
      return { locale: locale.toLowerCase(), quality };
    })
    .filter((lang): lang is { locale: string; quality: number } => lang !== null)
    .sort((a, b) => b.quality - a.quality);

  // Find first supported locale
  for (const { locale } of languages) {
    const shortLocale = locale.split('-')[0];
    if (shortLocale && SUPPORTED_LOCALES.includes(shortLocale as SupportedLocale)) {
      return shortLocale as SupportedLocale;
    }
  }

  return I18N_CONFIG.FALLBACK_LOCALE; // Default fallback
}

export const createContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get IP for rate limiting
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';

  // Check authentication via cookie or header
  let user: User | null = null;
  const sessionId = req.cookies.sessionId || req.headers.authorization?.replace('Bearer ', '');

  if (sessionId) {
    // Find user by session ID (mock)
    const foundUser = userManager.getAll().find(u => u.sessionId === sessionId);
    if (foundUser) {
      user = foundUser;
    }
  }

  // Get user locale from Accept-Language header
  const acceptLanguage = req.headers['accept-language'] || '';
  const locale = getLocaleFromAcceptLanguage(acceptLanguage);

  // Create error message function bound to user's locale using next-intl
  const getErrorMessage = createErrorMessageFunction(locale);

  return {
    req,
    res,
    ip,
    user,
    sessionId,
    locale,
    getErrorMessage,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
