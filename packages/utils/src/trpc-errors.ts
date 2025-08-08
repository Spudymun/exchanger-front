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
    return createTRPCError('NOT_FOUND', message);
}

// Базовая функция для создания ошибок
function createTRPCError(code: TRPCError['code'], message: string): TRPCError {
    return new TRPCError({
        code,
        message,
    });
}

/**
 * Создает ошибку "Неверный запрос"
 */
export function createBadRequestError(message: string): TRPCError {
    return createTRPCError('BAD_REQUEST', message);
}

/**
 * Создает ошибку "Внутренняя ошибка сервера"
 */
export function createInternalServerError(message: string): TRPCError {
    return createTRPCError('INTERNAL_SERVER_ERROR', message);
}

/**
 * Создает ошибку "Не авторизован"
 */
export function createUnauthorizedError(message: string): TRPCError {
    return createTRPCError('UNAUTHORIZED', message);
}

/**
 * Создает ошибку "Доступ запрещен"
 */
export function createForbiddenError(message: string): TRPCError {
    return createTRPCError('FORBIDDEN', message);
}

/**
 * Создает ошибку "Конфликт"
 */
export function createConflictError(message: string): TRPCError {
    return createTRPCError('CONFLICT', message);
}

/**
 * Создает ошибку валидации (алиас для createBadRequestError)
 */
export function createValidationError(message: string): TRPCError {
    return createBadRequestError(message);
}

/**
 * Создает ошибку превышения лимитов
 */
export function createRateLimitError(message: string): TRPCError {
    return createTRPCError('TOO_MANY_REQUESTS', message);
}

/**
 * Legacy error creators for backward compatibility
 * These map to the standard error creators above
 */

export function createUserError(type: string, identifier?: string): TRPCError {
    if (type === 'not_found') {
        return createNotFoundError(identifier ? `User with ID "${identifier}" not found` : 'User not found');
    }

    if (type === 'already_exists') {
        return createConflictError('User with this email already exists');
    }

    if (type === 'invalid_credentials') {
        return createUnauthorizedError('Invalid credentials');
    }

    return createBadRequestError(`User error: ${type}`);
}

export function createOrderError(type: string, identifier?: string): TRPCError {
    if (type === 'not_found') {
        return createNotFoundError(identifier ? `Order with ID "${identifier}" not found` : 'Order not found');
    }

    if (type === 'cannot_cancel') {
        return createBadRequestError('Order cannot be cancelled in current status');
    }

    if (type === 'update_failed') {
        return createInternalServerError('Order update failed');
    }

    if (type === 'access_denied') {
        return createForbiddenError('Access to order denied');
    }

    return createBadRequestError(`Order error: ${type}`);
}

export function createSupportError(type: string, identifier?: string): TRPCError {
    if (type === 'ticket_not_found') {
        return createNotFoundError(identifier ? `Support ticket with ID "${identifier}" not found` : 'Support ticket not found');
    }

    return createBadRequestError(`Support error: ${type}`);
}

export function createSecurityError(type: string): TRPCError {
    if (type === 'invalid_password') {
        return createUnauthorizedError('Invalid current password');
    }

    return createBadRequestError(`Security error: ${type}`);
}