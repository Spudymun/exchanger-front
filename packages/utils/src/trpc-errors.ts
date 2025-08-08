import { TRPCError } from '@trpc/server';

/**
 * Стандартные фабрики для создания TRPCError
 * Централизованные паттерны ошибок для обеспечения консистентности
 * ИСПРАВЛЕНО: Убрана зависимость от server-i18n-errors, принимают готовые сообщения
 */

/**
 * Создает ошибку "Не найдено"
 */
export function createNotFoundError(message: string): TRPCError {
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
export function createInternalServerError(message: string): TRPCError {
    return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message,
    });
}

/**
 * Создает ошибку "Не авторизован"
 */
export function createUnauthorizedError(message: string): TRPCError {
    return new TRPCError({
        code: 'UNAUTHORIZED',
        message,
    });
}

/**
 * Создает ошибку "Доступ запрещен"
 */
export function createForbiddenError(message: string): TRPCError {
    return new TRPCError({
        code: 'FORBIDDEN',
        message,
    });
}

/**
 * Создает ошибку "Конфликт"
 */
export function createConflictError(message: string): TRPCError {
    return new TRPCError({
        code: 'CONFLICT',
        message,
    });
}

/**
 * Создает ошибку валидации
 */
export function createValidationError(message: string): TRPCError {
    return new TRPCError({
        code: 'BAD_REQUEST',
        message,
    });
}

/**
 * Создает ошибку превышения лимитов
 */
export function createRateLimitError(message: string): TRPCError {
    return new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message,
    });
}

/**
 * Legacy error creators for backward compatibility
 * These map to the standard error creators above
 */

export function createUserError(type: string, identifier?: string): TRPCError {
    switch (type) {
        case 'not_found':
            return createNotFoundError(identifier ? `User with ID "${identifier}" not found` : 'User not found');
        case 'already_exists':
            return createConflictError('User with this email already exists');
        case 'invalid_credentials':
            return createUnauthorizedError('Invalid credentials');
        default:
            return createBadRequestError(`User error: ${type}`);
    }
}

export function createOrderError(type: string, identifier?: string): TRPCError {
    switch (type) {
        case 'not_found':
            return createNotFoundError(identifier ? `Order with ID "${identifier}" not found` : 'Order not found');
        case 'cannot_cancel':
            return createBadRequestError('Order cannot be cancelled in current status');
        case 'update_failed':
            return createInternalServerError('Order update failed');
        case 'access_denied':
            return createForbiddenError('Access to order denied');
        default:
            return createBadRequestError(`Order error: ${type}`);
    }
}

export function createSupportError(type: string, identifier?: string): TRPCError {
    switch (type) {
        case 'ticket_not_found':
            return createNotFoundError(identifier ? `Support ticket with ID "${identifier}" not found` : 'Support ticket not found');
        default:
            return createBadRequestError(`Support error: ${type}`);
    }
}

export function createSecurityError(type: string): TRPCError {
    switch (type) {
        case 'invalid_password':
            return createUnauthorizedError('Invalid current password');
        default:
            return createBadRequestError(`Security error: ${type}`);
    }
}