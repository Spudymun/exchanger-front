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
    BUTTON_COMPLETE: '✅ Завершить заявку',
    BUTTON_CONFIRM_YES: '✅ Да, завершить',
    BUTTON_CANCEL: '❌ Отмена',
    BUTTON_CANCEL_ORDER: '❌ Отменить заявку',
    BUTTON_CONFIRM_CANCEL_YES: '✅ Да, отменить',
    BUTTON_BACK: '◀️ Назад',
    CALLBACK_TAKE_ORDER: (orderId: string) => `take_order_${orderId}`,
    CALLBACK_ORDER_DETAILS: (orderId: string) => `order_details_${orderId}`,
    CALLBACK_COMPLETE_ORDER: (orderId: string) => `complete_order_${orderId}`,
    CALLBACK_CONFIRM_COMPLETE: (orderId: string) => `confirm_complete_${orderId}`,
    CALLBACK_CANCEL_COMPLETE: (orderId: string) => `cancel_complete_${orderId}`,
    CALLBACK_CANCEL_ORDER: (orderId: string) => `cancel_order_${orderId}`,
    CALLBACK_SELECT_CANCEL_REASON: (orderId: string, reason: string) => `select_cancel_reason_${orderId}_${reason}`,
    CALLBACK_CONFIRM_CANCEL: (orderId: string) => `confirm_cancel_${orderId}`,
    CALLBACK_BACK_TO_ORDER: (orderId: string) => `back_to_order_${orderId}`,
    TAKEORDER_COMMAND: (orderId: string) => `/takeorder ${orderId}`,
    COMPLETE_COMMAND: (orderId: string) => `/complete ${orderId}`,
    COMPLETE_ORDER: (orderId: string) => `Используйте /complete ${orderId} для завершения заявки`,
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
    ORDER_CANCELLED_MESSAGE: (
      order: {
        id: string;
        email: string;
        cryptoAmount: string;
        currency: string;
        uahAmount: string;
      },
      initiator?: 'user' | 'operator' | 'system'
    ) => {
      // Определяем заголовок и причину в зависимости от инициатора
      const title = initiator === 'system' 
        ? '⏱️ **Заявка отменена автоматически**'
        : '❌ **Заявка отменена пользователем**';
      
      const reason = initiator === 'system'
        ? '⏰ Причина: Истекло время оплаты'
        : '👤 Инициатор: Пользователь';

      return [
        title,
        ``,
        `📋 Заявка: #${order.id}`,
        `📧 Email: ${order.email}`,
        `💎 Сумма: ${order.cryptoAmount} ${order.currency}`,
        `💰 Эквивалент: ${order.uahAmount} UAH`,
        reason,
        ``,
        `ℹ️ Заявка была отменена до завершения обработки`,
      ].join('\n');
    },

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

// ========================================
// 🆕 CLIENT SUPPORT: Сообщения для клиентов
// ========================================

export const TELEGRAM_CLIENT_MESSAGES = {
  ICONS: {
    SUPPORT: '💬',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
  },
  
  GREETINGS: {
    START: () => [
      '👋 Добро пожаловать в службу поддержки ExchangeGO!',
      '',
      'Опишите вашу проблему или задайте вопрос.',
      'Наши операторы ответят вам в ближайшее время.',
      '',
      '⏱ Среднее время ответа: 1-3 часа',
      '⚡ Мы работаем 24/7',
    ].join('\n'),
    
    HELP: () => [
      '📋 Как получить помощь:',
      '',
      '1️⃣ Опишите вашу проблему в сообщении',
      '2️⃣ Укажите номер заявки (если есть)',
      '3️⃣ Дождитесь ответа оператора',
      '',
      '⏱ Мы отвечаем в течение 1-3 часов',
      '💬 Оператор свяжется с вами в личных сообщениях',
    ].join('\n'),
  },
  
  RESPONSES: {
    MESSAGE_RECEIVED: () => [
      '✅ Ваше сообщение получено!',
      '',
      'Оператор свяжется с вами в ближайшее время.',
      'Среднее время ответа: 1-3 часа',
    ].join('\n'),
    
    RATE_LIMIT_EXCEEDED: () => [
      '⚠️ Слишком много сообщений',
      '',
      'Пожалуйста, подождите минуту перед отправкой следующего сообщения.',
      'Лимит: 5 сообщений в минуту',
    ].join('\n'),
    
    OPERATOR_COMMAND_DENIED: () => [
      '❌ Эта команда доступна только операторам',
    ].join('\n'),
  },
} as const;

// Причины отмены заявки оператором
export const OPERATOR_CANCEL_REASONS = {
  CLIENT_NOT_RESPONDING: {
    id: 'client_not_responding',
    label: 'Клиент не выходит на связь',
    description: 'Клиент не отвечает на сообщения или не предоставляет необходимую информацию',
  },
  INCORRECT_DATA: {
    id: 'incorrect_data',
    label: 'Некорректные данные клиента',
    description: 'Предоставленные клиентом данные неверны или неполны',
  },
  PAYMENT_TIMEOUT: {
    id: 'payment_timeout',
    label: 'Истекло время оплаты',
    description: 'Клиент не произвел оплату в установленные сроки',
  },
  TECHNICAL_ISSUE: {
    id: 'technical_issue',
    label: 'Технические проблемы',
    description: 'Возникли технические проблемы при обработке заявки',
  },
  CLIENT_REQUEST: {
    id: 'client_request',
    label: 'По просьбе клиента',
    description: 'Клиент попросил отменить заявку',
  },
  OTHER: {
    id: 'other',
    label: 'Другая причина',
    description: 'Другая причина отмены заявки',
  },
} as const;

// Типы для TypeScript
export type TelegramApiEndpoint = keyof typeof TELEGRAM_API;
export type TelegramIcon = keyof typeof TELEGRAM_OPERATOR_MESSAGES.ICONS;
export type TelegramHeader = keyof typeof TELEGRAM_OPERATOR_MESSAGES.HEADERS;
export type TelegramStatus = keyof typeof TELEGRAM_OPERATOR_MESSAGES.STATUS_MESSAGES;
export type TelegramAction = keyof typeof TELEGRAM_OPERATOR_MESSAGES.ACTIONS;
export type TelegramTemplate = keyof typeof TELEGRAM_OPERATOR_MESSAGES.TEMPLATES;
export type TelegramClientIcon = keyof typeof TELEGRAM_CLIENT_MESSAGES.ICONS;
export type TelegramClientGreeting = keyof typeof TELEGRAM_CLIENT_MESSAGES.GREETINGS;
export type TelegramClientResponse = keyof typeof TELEGRAM_CLIENT_MESSAGES.RESPONSES;
export type OperatorCancelReasonId = keyof typeof OPERATOR_CANCEL_REASONS;

// Типы для Telegram Order Messages и уведомлений
export type TelegramNotificationType = 
  | 'new_order' 
  | 'order_paid' 
  | 'order_cancelled'
  | 'manual_rate_outdated'; // Уведомление об устаревшем ручном курсе

export interface TelegramOrderMessageInfo {
  orderId: string;
  chatId: string;
  messageId: number;
  topicId?: number;
  notificationType: TelegramNotificationType;
}
// ========================================
// 🆕 TELEGRAM NOTIFICATIONS: Типы для BullMQ очереди
// ========================================

/**
 * Payload для Telegram уведомления через BullMQ
 *
 * @architecture Используется в web (Producer) и telegram-bot (Consumer)
 * @note Синхронизирован с NotificationPayload из notify-operators.ts
 */
export interface TelegramNotificationPayload {
  order?: {
    id: string; // publicId для отображения
    internalId: string; // UUID для БД операций
    email: string;
    cryptoAmount: string;
    currency: string;
    uahAmount: string;
    status?: string;
    createdAt?: string;
  };
  depositAddress?: string;
  walletType?: 'fresh' | 'reused';
  notificationType: TelegramNotificationType;
  metadata?: {
    initiator?: 'user' | 'operator' | 'system';
    cancelledAt?: string;
  };
  // Для manual_rate_outdated уведомлений
  currency?: string;
  lastUpdateHours?: number;
  currentRate?: string;
}
