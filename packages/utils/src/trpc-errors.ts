import { TRPCError } from '@trpc/server';

/**
 * Стандартные фабрики для создания TRPCError
 * Централизованные паттерны ошибок для обеспечения консистентности
 */

/**
 * Создает ошибку "Не найдено"
 */
export function createNotFoundError(resource: string, identifier?: string): TRPCError {
  const message = identifier
    ? `${resource} с идентификатором "${identifier}" не найден(а)`
    : `${resource} не найден(а)`;

  return new TRPCError({
    code: 'NOT_FOUND',
    message,
  });
}

/**
 * Создает ошибку "Неверный запрос"
 */
export function createBadRequestError(message: string): TRPCError {
  return new TRPCError({
    code: 'BAD_REQUEST',
    message,
  });
}

/**
 * Создает ошибку "Внутренняя ошибка сервера"
 */
export function createInternalServerError(operation: string): TRPCError {
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Ошибка при выполнении операции: ${operation}`,
  });
}

/**
 * Создает ошибку "Не авторизован"
 */
export function createUnauthorizedError(message = 'Требуется авторизация'): TRPCError {
  return new TRPCError({
    code: 'UNAUTHORIZED',
    message,
  });
}

/**
 * Создает ошибку "Доступ запрещен"
 */
export function createForbiddenError(action: string): TRPCError {
  return new TRPCError({
    code: 'FORBIDDEN',
    message: `Недостаточно прав для выполнения действия: ${action}`,
  });
}

/**
 * Создает ошибку "Конфликт"
 */
export function createConflictError(resource: string, reason: string): TRPCError {
  return new TRPCError({
    code: 'CONFLICT',
    message: `Конфликт при работе с ${resource}: ${reason}`,
  });
}

/**
 * Создает ошибку валидации
 */
export function createValidationError(field: string, issue: string): TRPCError {
  return new TRPCError({
    code: 'BAD_REQUEST',
    message: `Ошибка валидации поля "${field}": ${issue}`,
  });
}

/**
 * Создает ошибку превышения лимитов
 */
export function createRateLimitError(limit: string): TRPCError {
  return new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message: `Превышен лимит: ${limit}`,
  });
}

/**
 * Специализированные ошибки для бизнес-логики
 */

/**
 * Создает ошибку для заказа
 */
export function createOrderError(
  type: 'not_found' | 'cannot_cancel' | 'update_failed' | 'access_denied',
  orderId?: string
): TRPCError {
  switch (type) {
    case 'not_found':
      return createNotFoundError('Заявка', orderId);
    case 'cannot_cancel':
      return createBadRequestError('Заявку нельзя отменить в текущем статусе');
    case 'update_failed':
      return createInternalServerError('обновление заявки');
    case 'access_denied':
      return createForbiddenError('доступ к заявке');
    default:
      return createInternalServerError('работа с заявкой');
  }
}

/**
 * Создает ошибку для пользователя
 */
export function createUserError(
  type: 'not_found' | 'already_exists' | 'invalid_credentials',
  identifier?: string
): TRPCError {
  switch (type) {
    case 'not_found':
      return createNotFoundError('Пользователь', identifier);
    case 'already_exists':
      return createConflictError('пользователем', 'пользователь с таким email уже существует');
    case 'invalid_credentials':
      return createUnauthorizedError('Неверный email или пароль');
    default:
      return createInternalServerError('работа с пользователем');
  }
}

/**
 * Создает ошибку для операций безопасности
 */
export function createSecurityError(
  type: 'session_not_found' | 'invalid_password' | 'verification_failed'
): TRPCError {
  switch (type) {
    case 'session_not_found':
      return createNotFoundError('Сессия');
    case 'invalid_password':
      return createBadRequestError('Неверный текущий пароль');
    case 'verification_failed':
      return createBadRequestError('Ошибка верификации');
    default:
      return createInternalServerError('операция безопасности');
  }
}

/**
 * Создает ошибку для саппорта
 */
export function createSupportError(
  type: 'ticket_not_found' | 'invalid_status' | 'access_denied',
  ticketId?: string
): TRPCError {
  switch (type) {
    case 'ticket_not_found':
      return createNotFoundError('Тикет поддержки', ticketId);
    case 'invalid_status':
      return createBadRequestError('Недопустимый статус тикета');
    case 'access_denied':
      return createForbiddenError('просмотр тикета поддержки');
    default:
      return createInternalServerError('работа с тикетом поддержки');
  }
}
