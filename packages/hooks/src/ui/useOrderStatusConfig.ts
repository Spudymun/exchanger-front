import { ORDER_STATUS_CONFIG } from '@repo/constants';
import type { Order } from '@repo/exchange-core';
import { getLocalizedStatusLabel, getLocalizedStatusDescription } from '@repo/utils';
import type { useTranslations } from 'next-intl';
import { useMemo } from 'react';

/**
 * Конфигурация статуса для UI отображения
 */
export interface StatusConfig {
  label: string;
  description: string;
  color: 'success' | 'warning' | 'info' | 'destructive';
  icon: string;
}

/**
 * Результат хука конфигурации статуса
 */
export interface UseOrderStatusConfigResult {
  statusConfig: StatusConfig | null;
}

/**
 * UI Hook для конфигурации статуса заказа
 *
 * Отвечает исключительно за UI конфигурацию и локализацию.
 * Разделение ответственности согласно архитектурным принципам:
 * - UI логика изолирована от data fetching
 * - Переиспользует существующие утилиты из @repo/utils
 * - Централизованная локализация через next-intl
 */
export function useOrderStatusConfig(
  orderData: Order | undefined,
  t: ReturnType<typeof useTranslations>
): UseOrderStatusConfigResult {
  const statusConfig = useMemo(() => {
    if (!orderData?.status) return null;

    const originalConfig =
      ORDER_STATUS_CONFIG[orderData.status as keyof typeof ORDER_STATUS_CONFIG];
    if (!originalConfig) return null;

    // Интегрируем локализацию с существующей структурой
    return {
      ...originalConfig,
      label: getLocalizedStatusLabel(orderData.status, t),
      description: getLocalizedStatusDescription(orderData.status, t),
    };
  }, [orderData?.status, t]);

  return {
    statusConfig,
  };
}
