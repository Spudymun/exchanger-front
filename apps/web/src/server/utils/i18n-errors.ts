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
export async function getServerErrorMessage(
    keyPath: string,
    locale: SupportedLocale,
    values?: Record<string, string | number>
): Promise<string> {
    try {
        const t = await getTranslations({
            locale,
            namespace: 'server.errors'
        });

        return values ? t(keyPath, values) : t(keyPath);
    } catch {
        // Fallback to English if translation fails
        if (locale !== 'en') {
            try {
                const t = await getTranslations({
                    locale: 'en',
                    namespace: 'server.errors'
                });
                return values ? t(keyPath, values) : t(keyPath);
            } catch {
                // Ultimate fallback to key path
                return keyPath;
            }
        }

        // Ultimate fallback to key path
        return keyPath;
    }
}

/**
 * Create error message function bound to specific locale
 * Useful for tRPC context
 */
export function createErrorMessageFunction(locale: SupportedLocale) {
    return (keyPath: string, values?: Record<string, string | number>) =>
        getServerErrorMessage(keyPath, locale, values);
}