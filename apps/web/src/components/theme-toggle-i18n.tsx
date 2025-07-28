'use client';

import { ThemeToggle } from '@repo/ui';
import { useTranslations } from 'next-intl';

/**
 * Internationalized wrapper for ThemeToggle component
 *
 * Provides localized labels for theme options using next-intl
 * while maintaining the core functionality from @repo/ui
 */
export function ThemeToggleI18n() {
  const t = useTranslations('theme');

  const labels = {
    light: t('light'),
    dark: t('dark'),
    system: t('system'),
    toggle: t('light'), // Using 'light' as fallback for toggle label
  };

  return <ThemeToggle labels={labels} />;
}
