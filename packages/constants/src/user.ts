// Области приложений
export const APP_SCOPE = {
  ADMIN_PANEL: 'admin-panel',
  WEB_APP: 'web',
} as const;

// Маппинг ролей к приложениям (импортируем USER_ROLES из business.ts)
import { USER_ROLES } from './business';

export const ROLE_TO_APP_MAPPING = {
  [USER_ROLES.ADMIN]: [APP_SCOPE.ADMIN_PANEL],
  [USER_ROLES.OPERATOR]: [APP_SCOPE.WEB_APP],
  [USER_ROLES.SUPPORT]: [APP_SCOPE.WEB_APP],
  [USER_ROLES.USER]: [APP_SCOPE.WEB_APP], // Клиенты тоже используют web app
} as const;

// Типы для ролей
export type AppScope = (typeof APP_SCOPE)[keyof typeof APP_SCOPE];

// User API константы
export const USER_MESSAGES = {
  NOT_FOUND: 'Пользователь не найден',
  ORDER_NOT_FOUND: 'Заявка не найдена',
  NO_ORDER_ACCESS: 'Нет доступа к этой заявке',
  INVALID_PASSWORD: 'Неверный текущий пароль',
  WRONG_PASSWORD: 'Неверный пароль',
  EMAIL_VERIFIED: 'Email уже подтвержден',
  CANNOT_CANCEL: 'Заявку нельзя отменить в текущем статусе',
  ACTIVE_ORDERS_EXIST: (count: number) => `Нельзя удалить аккаунт с активными заявками (${count})`,
  UPDATE_ERROR: 'Ошибка при обновлении заявки',
} as const;

export const USER_CONFIG = {
  DEFAULT_ORDERS_LIMIT: 20,
  MAX_ORDERS_LIMIT: 100,
  VERIFICATION_CODE_BASE: 36,
  VERIFICATION_CODE_LENGTH: 8,
} as const;

export const USER_SUCCESS_MESSAGES = {
  PASSWORD_CHANGED: 'Пароль успешно изменен',
  PROFILE_UPDATED: 'Настройки профиля обновлены',
  ORDER_CANCELLED: 'Заявка успешно отменена',
  VERIFICATION_SENT: 'Код подтверждения отправлен на ваш email',
  ACCOUNT_DELETED: 'Аккаунт успешно удален',
} as const;

// Order statuses centralized in exchange.ts (Rule 20 - no redundancy)
// Use EXCHANGE_ORDER_STATUSES instead of duplicating

// Statuses that allow order cancellation - using exchange.ts values
export const CANCELLABLE_ORDER_STATUSES = ['pending', 'processing'] as const;
