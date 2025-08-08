/**
 * Server-side internationalization for tRPC error messages
 * Uses native next-intl getTranslations API
 */

import type { SupportedLocale } from '@repo/constants';
import { getTranslations } from 'next-intl/server';

/**
 * Get localized error message using next-intl
 * 
 * @param keyPath - Translation key path (e.g., 'business.userExists')
 * @param locale - Target locale
 * @param values - Interpolation values
 * @returns Promise<string> - Localized message
 */
async function tryGetTranslation(
    locale: SupportedLocale,
    keyPath: string,
    values?: Record<string, string | number>
): Promise<string | null> {
    try {
        const t = await getTranslations({
            locale,
            namespace: 'server.errors'
        });
        return values ? t(keyPath, values) : t(keyPath);
    } catch {
        return null;
    }
}

export async function getServerErrorMessage(
    keyPath: string,
    locale: SupportedLocale,
    values?: Record<string, string | number>
): Promise<string> {
    // Try with requested locale
    const localizedMessage = await tryGetTranslation(locale, keyPath, values);
    if (localizedMessage) {
        return localizedMessage;
    }

    // Fallback to English if not already English
    if (locale !== 'en') {
        const englishMessage = await tryGetTranslation('en', keyPath, values);
        if (englishMessage) {
            return englishMessage;
        }
    }

    // Ultimate fallback to key path
    return keyPath;
}

/**
 * Create error message function bound to specific locale
 * Useful for tRPC context
 */
export function createErrorMessageFunction(locale: SupportedLocale) {
    return (keyPath: string, values?: Record<string, string | number>) =>
        getServerErrorMessage(keyPath, locale, values);
}