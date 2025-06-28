// Пример использования constants пакета
// Этот файл демонстрирует правильное использование констант

import {
  API_ENDPOINTS,
  HTTP_STATUS,
  ORDER_STATUSES,
  ORDER_STATUS_CONFIG,
  ALERT_VARIANTS,
  VALIDATION_LIMITS,
  VALIDATION_PATTERNS,
} from '@repo/constants';

// ✅ Использование API констант
export async function fetchUser(id: string) {
  const response = await fetch(`${API_ENDPOINTS.USERS}/${id}`);

  if (response.status === HTTP_STATUS.OK) {
    return response.json();
  }

  throw new Error('User not found');
}

// ✅ Использование бизнес констант с конфигурацией
export function getOrderStatusInfo(status: keyof typeof ORDER_STATUS_CONFIG) {
  const config = ORDER_STATUS_CONFIG[status];

  return {
    label: config.label,
    canCancel: config.canCancel,
    canEdit: config.canEdit,
    color: config.color,
    icon: config.icon,
  };
}

// ✅ Использование UI констант
export function createAlert(variant: keyof typeof ALERT_VARIANTS, message: string) {
  return {
    type: ALERT_VARIANTS[variant],
    message,
    timestamp: new Date(),
  };
}

// ✅ Использование констант валидации
export function validateEmail(email: string): boolean {
  if (email.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) {
    return false;
  }

  return VALIDATION_PATTERNS.EMAIL.test(email);
}

// ✅ Пример проверки статуса заказа
export function canCancelOrder(status: string): boolean {
  if (status === ORDER_STATUSES.PENDING || status === ORDER_STATUSES.OPEN) {
    return true;
  }

  return false;
}

console.log('✅ Constants package examples work correctly!');
console.log('Order pending status:', ORDER_STATUSES.PENDING);
console.log('Success alert variant:', ALERT_VARIANTS.SUCCESS);
console.log('Email max length:', VALIDATION_LIMITS.EMAIL_MAX_LENGTH);

// Test pre-commit hooks
