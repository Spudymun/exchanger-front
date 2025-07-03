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
  MIN_PASSWORD_LENGTH: 8,
  BCRYPT_SALT_ROUNDS: 10,
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

// Статусы заказов для фильтрации
export const USER_ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
] as const;

// Статусы, при которых можно отменить заявку
export const CANCELLABLE_ORDER_STATUSES = ['PENDING', 'PROCESSING'] as const;
