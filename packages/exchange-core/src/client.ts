/**
 * CLIENT-SAFE EXPORTS для использования в frontend приложениях
 * 
 * ⚠️ ВАЖНО: Этот файл содержит ТОЛЬКО клиентские экспорты
 * Все server-only зависимости (Node.js modules, email services) исключены
 * 
 * Используйте этот файл в:
 * - admin-panel
 * - web (client components)
 * - docs
 * 
 * НЕ используйте в:
 * - server components
 * - API routes
 * - tRPC procedures
 */

// ✅ БЕЗОПАСНО: Все типы данных (без runtime зависимостей)
export * from './types';

// ✅ БЕЗОПАСНО: Repository интерфейсы (только типы)
export * from './repositories';

// ✅ БЕЗОПАСНО: Адаптеры и фабрики (FIFO Queue components)
export * from './adapters';
export * from './factories';

// ✅ БЕЗОПАСНО: Клиентские утилиты (БЕЗ server-only зависимостей)
export * from './utils/calculations';
export * from './utils/data-sanitizers';
export * from './utils/composite-validators';
export * from './utils/type-guards';
export * from './utils/access-validators';
export * from './utils/user-role-helpers';
export * from './utils/monitoring-utils';

// ❌ ИСКЛЮЧЕНО: ./utils/crypto (содержит импорт из services)

// ✅ БЕЗОПАСНО: Клиентские сервисы (БЕЗ server-only сервисов)
export * from './services/id-generation';
export * from './services/crypto-address-generation';

// ❌ ИСКЛЮЧЕНО: auto-registration-service (может иметь server зависимости)
// ❌ ИСКЛЮЧЕНО: smart-pricing-service (может иметь server зависимости)

// ❌ ИСКЛЮЧЕНО: wallet-pool-manager (может содержать server-only зависимости)
// ❌ ИСКЛЮЧЕНО: wallet-strategies (могут содержать server-only зависимости)
// ❌ ИСКЛЮЧЕНО: queue-email-notifier (содержит email-service)
// ❌ ИСКЛЮЧЕНО: wallet-alerts-service (server-only)
// ❌ ИСКЛЮЧЕНО: wallet-monitoring-process (server-only)

// ✅ БЕЗОПАСНО: Data managers и mock данные для UI
export * from './data';

/**
 * Re-export наиболее используемых типов для удобства
 * 
 * Примечание: Конкретные типы могут отличаться в зависимости от версии
 * Используйте прямые импорты для специфических типов
 */