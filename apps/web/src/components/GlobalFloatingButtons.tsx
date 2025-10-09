'use client';

import { usePathname } from 'next/navigation';

import { FloatingButtons } from './FloatingButtons';
import { FloatingSupportButton } from './FloatingSupportButton';

/**
 * Глобальный компонент floating кнопок
 * Решает какие кнопки показывать в зависимости от текущего route:
 * - На главной странице: FloatingButtons (обменник + поддержка с адаптивным позиционированием)
 * - На остальных страницах: только FloatingSupportButton
 */
export function GlobalFloatingButtons() {
  const pathname = usePathname();

  // Определяем главную страницу (с учетом локали)
  // Паттерны: /, /en, /ru, /uk и т.д.
  const isHomePage = pathname ? pathname === '/' || /^\/[a-z]{2}$/.test(pathname) : false;

  if (isHomePage) {
    // На главной - обе кнопки с адаптивным позиционированием
    return <FloatingButtons />;
  }

  // На остальных страницах - только кнопка поддержки (фиксированная позиция)
  return <FloatingSupportButton isExchangeButtonVisible={false} />;
}
