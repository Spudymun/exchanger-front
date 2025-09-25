/**
 * Конфигурация системы уведомлений
 * Согласно ai-agent-rules.yml (Правило 20) - централизованные настройки
 */

// Дублируем типы здесь для избежания циклических зависимостей
type NotificationCategory = 'ui' | 'business' | 'system' | 'error';

interface CategoryConfig {
  enabled: boolean;
  sources: Record<string, boolean>;
}

interface NotificationConfigType {
  categories: Record<NotificationCategory, CategoryConfig>;
}

/**
 * Централизованная конфигурация уведомлений
 * Решает проблему избыточных уведомлений о смене темы и других UI действиях
 */
export const NOTIFICATION_CONFIG: NotificationConfigType = {
  categories: {
    // UI уведомления - ОТКЛЮЧЕНЫ по умолчанию для решения проблемы с темой
    ui: {
      enabled: false,
      sources: {
        theme: false, // Конкретно отключаем уведомления о смене темы
        sidebar: false, // Отключаем уведомления о сайдбаре
        modal: false, // Отключаем уведомления о модальных окнах
      },
    },

    // Бизнес уведомления - ВКЛЮЧЕНЫ (важные для пользователя)
    business: {
      enabled: true,
      sources: {
        exchange: true, // Операции обмена
        wallet: true, // Операции с кошельками
        order: true, // Статус заказов
        form: true, // Успешная отправка форм
      },
    },

    // Системные уведомления - ВКЛЮЧЕНЫ (важная информация)
    system: {
      enabled: true,
      sources: {
        api: true, // API операции
        auth: true, // Аутентификация
      },
    },

    // Ошибки - ВСЕГДА ВКЛЮЧЕНЫ (критическая информация)
    error: {
      enabled: true,
      sources: {
        validation: true, // Ошибки валидации
        network: true, // Сетевые ошибки
        server: true, // Серверные ошибки
        api: true, // API ошибки
      },
    },
  },
} as const;

// Утилиты для работы с конфигурацией
export type NotificationConfigCategory = keyof typeof NOTIFICATION_CONFIG.categories;
export type NotificationConfigSource<T extends NotificationConfigCategory> =
  keyof (typeof NOTIFICATION_CONFIG.categories)[T]['sources'];
