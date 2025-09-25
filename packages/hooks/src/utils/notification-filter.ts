/**
 * Утилиты для фильтрации уведомлений
 * Интегрируется с централизованной конфигурацией NOTIFICATION_CONFIG
 */

import { NOTIFICATION_CONFIG } from '@repo/constants';

import type { NotificationCategory, NotificationSource } from '../state/notification-store';

/**
 * Проверяет, разрешено ли показывать уведомление для данной категории и источника
 *
 * @param category - Категория уведомления ('ui', 'business', 'system', 'error')
 * @param source - Источник уведомления ('theme', 'exchange', 'auth', etc.)
 * @returns true если уведомление разрешено, false если заблокировано
 */
export function shouldShowNotification(
  category?: NotificationCategory,
  source?: NotificationSource
): boolean {
  // Если категория не указана, показываем уведомление (обратная совместимость)
  if (!category) {
    return true;
  }

  // Проверяем, включена ли категория
  const categoryConfig = NOTIFICATION_CONFIG.categories[category];
  if (!categoryConfig || !categoryConfig.enabled) {
    return false;
  }

  // Если источник не указан, но категория включена - показываем
  if (!source) {
    return true;
  }

  // Проверяем, включен ли конкретный источник
  return categoryConfig.sources[source] === true;
}

/**
 * Получает дефолтную категорию для уведомления по его типу
 * Используется для обратной совместимости со старыми уведомлениями
 */
export function getDefaultCategory(
  type: 'success' | 'error' | 'warning' | 'info'
): NotificationCategory {
  switch (type) {
    case 'error':
      return 'error';
    case 'warning':
      return 'system';
    case 'success':
    case 'info':
    default:
      return 'business'; // По умолчанию business (разрешены)
  }
}

/**
 * Логирует заблокированные уведомления для отладки
 */
export function logFilteredNotification(
  category?: NotificationCategory,
  source?: NotificationSource,
  title?: string
): void {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console -- Development logging для отладки фильтрации
    console.log(
      `[Notification Filtered] Category: ${category}, Source: ${source}, Title: ${title}`
    );
  }
}
