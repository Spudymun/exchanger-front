/**
 * Централизованные статусы заказов/операций
 * Согласно ai-agent-rules.yml (Правило 20) - запрет избыточности
 *
 * Все статусы в системе должны находиться в этом файле
 */

// Основные статусы заказов ExchangeGO
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

// Конфигурация статусов для UI
export const ORDER_STATUS_CONFIG = {
  [ORDER_STATUSES.PENDING]: {
    label: 'Ожидание оплаты',
    color: 'warning' as const,
    icon: 'clock',
    description: 'Переведите криптовалюту на указанный адрес',
  },
  [ORDER_STATUSES.PAID]: {
    label: 'Оплачено',
    color: 'info' as const,
    icon: 'check-circle',
    description: 'Платеж получен, заявка в обработке',
  },
  [ORDER_STATUSES.PROCESSING]: {
    label: 'В обработке',
    color: 'info' as const,
    icon: 'loader',
    description: 'Обрабатывается оператором',
  },
  [ORDER_STATUSES.COMPLETED]: {
    label: 'Выполнено',
    color: 'success' as const,
    icon: 'check-circle-2',
    description: 'Средства переведены на ваш счет',
  },
  [ORDER_STATUSES.CANCELLED]: {
    label: 'Отменено',
    color: 'destructive' as const,
    icon: 'x-circle',
    description: 'Заявка отменена',
  },
  [ORDER_STATUSES.FAILED]: {
    label: 'Неудачно',
    color: 'destructive' as const,
    icon: 'x-circle',
    description: 'Обработка заявки завершилась неудачно',
  },
} as const;

// Группы статусов для фильтрации и логики
export const ORDER_STATUS_GROUPS = {
  ACTIVE: [ORDER_STATUSES.PENDING, ORDER_STATUSES.PAID, ORDER_STATUSES.PROCESSING],
  COMPLETED: [ORDER_STATUSES.COMPLETED],
  FAILED: [ORDER_STATUSES.CANCELLED, ORDER_STATUSES.FAILED],
  NEEDS_PAYMENT: [ORDER_STATUSES.PENDING],
  IN_PROGRESS: [ORDER_STATUSES.PAID, ORDER_STATUSES.PROCESSING],
  FINAL: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED, ORDER_STATUSES.FAILED],
} as const;

// Статусы тикетов поддержки
export const TICKET_STATUSES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

// Type exports - централизованные типы статусов
export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];
export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

// Массивы статусов для Zod schemas
export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUSES);
export const TICKET_STATUS_VALUES = Object.values(TICKET_STATUSES);

// Status groups remain in constants as they are configuration data
