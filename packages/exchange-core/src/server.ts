/**
 * SERVER-ONLY EXPORTS для использования ТОЛЬКО в server-side коде
 * 
 * ⚠️ КРИТИЧЕСКИ ВАЖНО: Этот файл содержит server-only зависимости
 * Содержит Node.js modules, email services, file system операции
 * 
 * Используйте этот файл ТОЛЬКО в:
 * - API routes (/pages/api/ или /app/api/)
 * - Server Components
 * - tRPC procedures
 * - Server Actions
 * - Backend services
 * 
 * ❌ НЕ используйте в:
 * - Client Components
 * - Frontend приложениях (admin-panel, web client-side)
 * - Browser environments
 */

// ✅ SERVER-ONLY: Email notification service (содержит nodemailer)
export * from './services/queue-email-notifier';

// ✅ SERVER-ONLY: Wallet management services (могут содержать server dependencies)
export * from './services/wallet-pool-manager';
export * from './services/wallet-pool-manager-factory';

// ✅ SERVER-ONLY: Wallet strategies (могут содержать server dependencies)
export * from './services/wallet-strategies/wallet-allocation-strategy';
export * from './services/wallet-strategies/immediate-allocation-strategy';

// ✅ SERVER-ONLY: Business services для tRPC роутеров
export * from './services/auto-registration-service';
export * from './services/smart-pricing-service';

// ✅ SERVER-ONLY: Order expiration service (Redis + background processes)
export * from './services/order-expiration-service';
export * from './services/order-cancellation-handler';

// ✅ SERVER-ONLY: Monitoring and alerting services (server-only operations)
export { WalletAlertsService } from './services/wallet-alerts-service';
export { WalletMonitoringProcess } from './services/wallet-monitoring-process';

// ✅ SERVER-ONLY: Экспорт типов для серверных сервисов
export type { AlertCheckResult } from './services/wallet-alerts-service';
export type {
  AutoRegistrationResult,
  AutoRegistrationResultWithPassword,
} from './services/auto-registration-service';

/**
 * Re-export client-safe types для серверного кода
 * Серверный код может использовать все типы
 */
export * from './client';

/**
 * Утилита для проверки server environment
 */
export function isServerEnvironment(): boolean {
  return typeof window === 'undefined';
}

/**
 * Утилита для безопасного импорта server-only модулей
 */
export function requireServerEnvironment(moduleName: string): void {
  if (!isServerEnvironment()) {
    throw new Error(
      `Module "${moduleName}" can only be used in server environment. ` +
      `Use @repo/exchange-core/client for client-side code.`
    );
  }
}
