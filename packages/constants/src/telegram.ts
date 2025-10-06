/**
 * Константы для Telegram Bot API и уведомлений
 */

// Telegram Bot API URLs
export const TELEGRAM_API = {
  BASE_URL: 'https://api.telegram.org',
  SEND_MESSAGE: '/sendMessage',
  EDIT_MESSAGE: '/editMessageText',
  DELETE_MESSAGE: '/deleteMessage',
  SEND_PHOTO: '/sendPhoto',
  ANSWER_CALLBACK_QUERY: '/answerCallbackQuery',
  
  // HTTP параметры
  PARAMS: {
    PARSE_MODE: 'Markdown' as const,
    CONTENT_TYPE: 'application/json' as const,
    METHOD: 'POST' as const,
  },
} as const;

// Telegram сообщения для операторов
export const TELEGRAM_OPERATOR_MESSAGES = {
  // Базовые элементы сообщений
  ICONS: {
    NEW_ORDER: '🆕',
    REUSED_WALLET: '🔄', 
    FRESH_WALLET: '✅',
    WARNING: '⚠️',
    MONEY: '💰',
    EMAIL: '📧',
    DIAMOND: '💎',
    LOCATION: '📍',
    STATUS: '🔄',
    PRIORITY_NORMAL: '⚡',
    PRIORITY_HIGH: '🔴',
    SEARCH: '🔍',
    CHART: '📊',
    SUCCESS: '✅',
    TAKE_ORDER: '✅',
    DETAILS: '📋',
    // НОВОЕ: Иконки для источников курсов
    RATE_BINANCE: '🟡',
    RATE_COINGECKO: '🦎',
    RATE_FALLBACK: '⚠️',
    RATE_MOCK: '🔧',
    // 🆕 TASK: Иконки для отмены заявки
    CANCELLED: '❌',
    USER_ACTION: '👤',
    // 🆕 TASK: Иконки для статуса "оплачено"
    PAID: '💳',
    PAYMENT_CONFIRMED: '✅',
  },
  
  // Заголовки сообщений
  HEADERS: {
    NEW_ORDER: (orderId: string) => `💰 Новая заявка #${orderId}`,
    FRESH_WALLET_ASSIGNED: '✅ **Выделен свободный кошелек**',
    REUSED_WALLET_ASSIGNED: '⚠️ **Переиспользован занятый кошелек**',
    // 🆕 TASK: Заголовок для отмены заявки
    ORDER_CANCELLED: (orderId: string) => `❌ Заявка #${orderId} отменена пользователем`,
    // 🆕 TASK: Заголовок для оплаты заявки
    ORDER_PAID: (orderId: string) => `💳 Заявка #${orderId} оплачена пользователем`,
  },
  
  // Статусы и состояния
  STATUS_MESSAGES: {
    PENDING_PAYMENT: '🔄 Статус: PENDING → Ожидание перевода от клиента',
    PRIORITY_NORMAL: '⚡ Приоритет: Обычный',
    PRIORITY_HIGH: '⚡ Приоритет: Повышенный',
    REQUIRES_ATTENTION: '🔍 Требует внимания: Возможны конфликты адресов',
    INSUFFICIENT_WALLETS: '📊 Причина: Нехватка свободных адресов в пуле',
  },

  // НОВОЕ: Сообщения о состоянии курсов
  RATE_STATUS: {
    BINANCE_SUCCESS: '🟡 Курс получен от Binance API',
    COINGECKO_SUCCESS: '🦎 Курс получен от CoinGecko API',
    FALLBACK_MODE: '⚠️ Используется резервный курс (+5%)',
    MOCK_MODE: '🔧 Используется статический курс',
    API_DEGRADED: (currency: string, reason: string) =>
      `⚠️ Проблема с API курсов ${currency}: ${reason}`,
  },
  
  // Действия и кнопки
  ACTIONS: {
    TAKE_ORDER: (orderId: string) => `Используйте /takeorder ${orderId} для принятия заявки`,
    BUTTON_TAKE: '✅ Взять в работу',
    BUTTON_DETAILS: '📋 Детали',
    CALLBACK_TAKE_ORDER: (orderId: string) => `take_order_${orderId}`,
    CALLBACK_ORDER_DETAILS: (orderId: string) => `order_details_${orderId}`,
    TAKEORDER_COMMAND: (orderId: string) => `/takeorder ${orderId}`,
  },
  
  // Шаблоны полных сообщений
  TEMPLATES: {
    ORDER_INFO: (order: { id: string; email: string; cryptoAmount: string; currency: string; uahAmount: string }, depositAddress: string) => [
      `📧 Email: ${order.email}`,
      `💎 Сумма: ${order.cryptoAmount} ${order.currency}`,
      `💰 Эквивалент: ${order.uahAmount} UAH`,
      `📍 Адрес: \`${depositAddress}\``,
    ].join('\n'),
    
    FRESH_WALLET_MESSAGE: (baseInfo: string, orderId: string) => [
      `🆕 ${baseInfo}`,
      ``,
      `✅ **Выделен свободный кошелек**`,
      `🔄 Статус: PENDING → Ожидание перевода от клиента`,
      `⚡ Приоритет: Обычный`,
      ``,
      `Используйте /takeorder ${orderId} для принятия заявки`,
    ].join('\n'),
    
    REUSED_WALLET_MESSAGE: (baseInfo: string, orderId: string) => [
      `🔄 ${baseInfo}`,
      ``,
      `⚠️ **Переиспользован занятый кошелек**`,
      `📊 Причина: Нехватка свободных адресов в пуле`,
      `🔍 Требует внимания: Возможны конфликты адресов`,
      `⚡ Приоритет: Повышенный`,
      ``,
      `Используйте /takeorder ${orderId} для принятия заявки`,
    ].join('\n'),

    // 🆕 TASK: Шаблон для уведомления об отмене заявки
    ORDER_CANCELLED_MESSAGE: (order: {
      id: string;
      email: string;
      cryptoAmount: string;
      currency: string;
      uahAmount: string;
    }) => [
      `❌ **Заявка отменена пользователем**`,
      ``,
      `📋 Заявка: #${order.id}`,
      `📧 Email: ${order.email}`,
      `💎 Сумма: ${order.cryptoAmount} ${order.currency}`,
      `💰 Эквивалент: ${order.uahAmount} UAH`,
      `👤 Инициатор: Пользователь`,
      ``,
      `ℹ️ Заявка была отменена до завершения обработки`,
    ].join('\n'),

    // 🆕 TASK: Шаблон для уведомления об оплате заявки
    ORDER_PAID_MESSAGE: (order: {
      id: string;
      email: string;
      cryptoAmount: string;
      currency: string;
      uahAmount: string;
    }) => [
      `💳 **Заявка оплачена пользователем**`,
      ``,
      `📋 Заявка: #${order.id}`,
      `📧 Email: ${order.email}`,
      `💎 Сумма: ${order.cryptoAmount} ${order.currency}`,
      `💰 Эквивалент: ${order.uahAmount} UAH`,
      `✅ Статус: PENDING → PAID`,
      `👤 Инициатор: Пользователь`,
      ``,
      `⚡ Действие: Проверьте поступление средств и начните обработку`,
    ].join('\n'),
  },
} as const;

// Типы для TypeScript
export type TelegramApiEndpoint = keyof typeof TELEGRAM_API;
export type TelegramIcon = keyof typeof TELEGRAM_OPERATOR_MESSAGES.ICONS;
export type TelegramHeader = keyof typeof TELEGRAM_OPERATOR_MESSAGES.HEADERS;
export type TelegramStatus = keyof typeof TELEGRAM_OPERATOR_MESSAGES.STATUS_MESSAGES;
export type TelegramAction = keyof typeof TELEGRAM_OPERATOR_MESSAGES.ACTIONS;
export type TelegramTemplate = keyof typeof TELEGRAM_OPERATOR_MESSAGES.TEMPLATES;