export * from './id-generation';
export * from './crypto-address-generation';

// Wallet Pool Management (Task 2.1)
export * from './wallet-pool-manager';
export * from './wallet-pool-manager-factory';

// Wallet Strategies
export * from './wallet-strategies/wallet-allocation-strategy';
export * from './wallet-strategies/immediate-allocation-strategy';
// NOTE: queue-allocation-strategy не экспортируется из services для предотвращения frontend bundle проблем

// ✅ Task 3.1: Auto Registration Service для flexible authentication
export * from './auto-registration-service';

// ✅ Smart Pricing Service для гибридной системы ценообразования
export * from './smart-pricing-service';

// ✅ Order Expiration Service для автоматической отмены заказов по таймауту
export * from './order-expiration-service';

// NOTE: wallet-alerts-service и wallet-monitoring-process перенесены в server.ts для предотвращения frontend bundle проблем
// NOTE: queue-email-notifier НЕ экспортируется для предотвращения frontend bundle проблем
