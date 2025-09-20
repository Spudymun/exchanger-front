# План реализации задачи 6.4: Alerting System для критического уменьшения кошельков

> **Создано:** 20 сентября 2025  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Цель:** Детальный план интеграции alerting системы в существующую архитектуру  
> **Источник:** Анализ задачи 6.4 из ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md

---

## 🎯 АНАЛИЗ ЗАДАЧИ И ОБОСНОВАНИЕ НЕОБХОДИМОСТИ

### 📋 **ТОЧНОЕ ОПРЕДЕЛЕНИЕ ЗАДАЧИ 6.4:**

**Из ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md:**

- Создать алерты при критическом уменьшении свободных кошельков
- Автоматические уведомления когда свободных кошельков < 10%
- Отправка через Telegram/email админам/операторам
- Предупреждение о необходимости пополнить пул кошельков

### 🚨 **КРИТИЧЕСКАЯ ВАЖНОСТЬ:**

1. **Бизнес-риски без алертов:**
   - Клиенты могут остаться без адресов для оплаты
   - Операторы не узнают о проблемах вовремя
   - Простои в обработке заявок

2. **Операционная необходимость:**
   - Proactive мониторинг вместо reactive
   - Предотвращение emergency ситуаций
   - Планирование пополнения пула кошельков

---

## 📊 ФАКТИЧЕСКИЙ АНАЛИЗ СУЩЕСТВУЮЩЕЙ ИНФРАСТРУКТУРЫ

### ✅ **ПОЛНОСТЬЮ ГОТОВЫЕ КОМПОНЕНТЫ (70%):**

#### **1. WalletPoolManager** ✅

```typescript
// packages/exchange-core/src/services/wallet-pool-manager.ts
export class WalletPoolManager {
  async getPoolStats(currency: CryptoCurrency): Promise<PoolStats>;
  // PoolStats: { currency, totalWallets, availableWallets, occupiedWallets, queueSize }
}
```

#### **2. Пороговые значения** ✅

```typescript
// packages/constants/src/wallet-pool-config.ts
export const WALLET_POOL_CONFIG = {
  MIN_AVAILABLE_THRESHOLDS: {
    BTC: 3, // Минимум свободных BTC кошельков
    ETH: 2, // Минимум свободных ETH кошельков
    USDT: 5, // Минимум свободных USDT кошельков
    LTC: 2, // Минимум свободных LTC кошельков
  },
};
```

#### **3. Мониторинг API** ✅

```typescript
// apps/web/src/server/trpc/routers/shared.ts
getWalletPoolStats: operatorAndSupport
  .input(securityEnhancedSearchOrdersSchema.pick({ currency: true }))
  .query(async ({ input }) => {
    const walletPoolManager = await WalletPoolManagerFactory.create();
    return await walletPoolManager.getPoolStats(input.currency);
  });
```

#### **4. Logger система** ✅

```typescript
// packages/utils/src/logger.ts - централизованная система логирования
```

#### **5. Email система** ✅

```typescript
// packages/email-service/ - полноценная email инфраструктура
// packages/exchange-core/src/services/queue-email-notifier.ts
```

### ❌ **ОТСУТСТВУЮЩИЕ КОМПОНЕНТЫ (30%):**

1. **Alerting Logic** - автоматическая проверка thresholds
2. **Background Process** - периодический мониторинг
3. **Notification Dispatcher** - отправка алертов админам/операторам

---

## 🏗️ АРХИТЕКТУРНАЯ СТРАТЕГИЯ ИНТЕГРАЦИИ

### 🎯 **ПРИНЦИП: Минимальные изменения, максимальное переиспользование**

#### **1. Расширение существующих сервисов** ✅

- **НЕ создавать** новые packages
- **Расширить** WalletPoolManager новыми методами
- **Переиспользовать** existing Logger и Email systems

#### **2. Integration Points:**

- **WalletPoolManager** → добавить `checkAlerts()` метод
- **Background Service** → новый файл в `exchange-core/services/`
- **Notification System** → переиспользовать existing email infrastructure

#### **3. Следование существующим паттернам:**

- **Factory Pattern** (как в WalletPoolManagerFactory)
- **Strategy Pattern** (как в allocation strategies)
- **Environment-based switching** (как в session-management)

---

## 📦 ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ

### **🔧 ЭТАП 1: Расширение WalletPoolManager**

#### **1.1 Добавить alerting методы**

**ФАЙЛ:** `packages/exchange-core/src/services/wallet-pool-manager.ts`

**МЕТОД 1: Проверка критических порогов**

```typescript
/**
 * Проверить критические пороги кошельков для всех валют
 * @implements Task 6.4 - критическое уменьшение кошельков
 */
async checkCriticalThresholds(): Promise<CriticalAlert[]> {
  const alerts: CriticalAlert[] = [];

  for (const currency of CRYPTOCURRENCIES) {
    const stats = await this.getPoolStats(currency);
    const threshold = WALLET_POOL_CONFIG.MIN_AVAILABLE_THRESHOLDS[currency];

    if (stats.availableWallets <= threshold) {
      alerts.push({
        currency,
        currentAvailable: stats.availableWallets,
        threshold,
        severity: this.calculateSeverity(stats.availableWallets, threshold),
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Рассчитать уровень критичности
 */
private calculateSeverity(available: number, threshold: number): 'warning' | 'critical' | 'emergency' {
  if (available === 0) return 'emergency';
  if (available === 1) return 'critical';
  if (available <= threshold) return 'warning';
  return 'warning'; // fallback
}
```

**МЕТОД 2: Интерфейс для алертов**

```typescript
// packages/exchange-core/src/types/alert-types.ts
export interface CriticalAlert {
  currency: CryptoCurrency;
  currentAvailable: number;
  threshold: number;
  severity: 'warning' | 'critical' | 'emergency';
  timestamp: Date;
}
```

### **🔧 ЭТАП 2: Создание Alert Monitoring Service**

#### **2.1 Новый сервис мониторинга**

**ФАЙЛ:** `packages/exchange-core/src/services/wallet-alert-monitor.ts`

```typescript
import { createEnvironmentLogger } from '@repo/utils';
import { WALLET_POOL_CONFIG } from '@repo/constants';
import { WalletPoolManagerFactory } from './wallet-pool-manager-factory';
import type { CriticalAlert } from '../types/alert-types';

const logger = createEnvironmentLogger('WalletAlertMonitor');

/**
 * Сервис мониторинга критических уровней кошельков
 * Реализует Task 6.4: автоматические алерты при критическом уменьшении
 */
export class WalletAlertMonitor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Запустить периодический мониторинг
   */
  async startMonitoring(intervalMinutes: number = 5): Promise<void> {
    if (this.isRunning) {
      logger.warn('Alert monitoring already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    // Первая проверка немедленно
    await this.performCheck();

    // Затем периодически
    this.intervalId = setInterval(async () => {
      await this.performCheck();
    }, intervalMs);

    logger.info('Wallet alert monitoring started', { intervalMinutes });
  }

  /**
   * Остановить мониторинг
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Wallet alert monitoring stopped');
  }

  /**
   * Выполнить проверку алертов
   */
  private async performCheck(): Promise<void> {
    try {
      const walletPoolManager = await WalletPoolManagerFactory.create();
      const alerts = await walletPoolManager.checkCriticalThresholds();

      if (alerts.length > 0) {
        await this.handleAlerts(alerts);
      } else {
        logger.debug('No critical wallet alerts detected');
      }
    } catch (error) {
      logger.error('Failed to perform wallet alert check', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Обработать найденные алерты
   */
  private async handleAlerts(alerts: CriticalAlert[]): Promise<void> {
    logger.warn('Critical wallet alerts detected', { alertCount: alerts.length });

    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Отправить конкретный алерт
   */
  private async sendAlert(alert: CriticalAlert): Promise<void> {
    try {
      // Email уведомление админам/операторам
      await this.sendEmailAlert(alert);

      // TODO: Telegram уведомление (если/когда будет реализован)
      // await this.sendTelegramAlert(alert);

      logger.info('Alert sent successfully', {
        currency: alert.currency,
        severity: alert.severity,
      });
    } catch (error) {
      logger.error('Failed to send alert', {
        alert,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Отправить email алерт
   */
  private async sendEmailAlert(alert: CriticalAlert): Promise<void> {
    // Переиспользуем existing email infrastructure
    try {
      const emailService = await import('@repo/email-service');

      const subject = `🚨 Critical Wallet Alert - ${alert.currency}`;
      const message = this.formatAlertMessage(alert);

      // TODO: Получить email адреса админов/операторов из конфигурации
      const adminEmails = this.getAdminEmails();

      for (const email of adminEmails) {
        await emailService.EmailService.sendCriticalAlert({
          to: email,
          subject,
          message,
          alert,
        });
      }
    } catch (error) {
      logger.error('Failed to send email alert', {
        alert,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Форматировать сообщение алерта
   */
  private formatAlertMessage(alert: CriticalAlert): string {
    const emoji = {
      emergency: '🔴',
      critical: '🟠',
      warning: '🟡',
    }[alert.severity];

    return `
${emoji} WALLET POOL ALERT

Currency: ${alert.currency}
Available Wallets: ${alert.currentAvailable}
Threshold: ${alert.threshold}
Severity: ${alert.severity.toUpperCase()}
Time: ${alert.timestamp.toISOString()}

Action Required: Please add more ${alert.currency} wallets to the pool.

This is an automated alert from ExchangeGO wallet monitoring system.
    `.trim();
  }

  /**
   * Получить email адреса админов (временная заглушка)
   */
  private getAdminEmails(): string[] {
    // TODO: Получать из конфигурации или базы данных
    return process.env.ALERT_EMAILS?.split(',') || [];
  }
}
```

### **🔧 ЭТАП 3: Интеграция с tRPC API**

#### **3.1 Добавить procedures в shared.ts**

**ФАЙЛ:** `apps/web/src/server/trpc/routers/shared.ts`

```typescript
// В imports секцию
import { WalletAlertMonitor } from '@repo/exchange-core';

// В sharedRouter после getWalletPoolStats
/**
 * Проверить критические алерты кошельков (ручной запуск)
 */
checkWalletAlerts: operatorAndSupport
  .query(async () => {
    try {
      const walletPoolManager = await WalletPoolManagerFactory.create();
      const alerts = await walletPoolManager.checkCriticalThresholds();

      return {
        hasAlerts: alerts.length > 0,
        alerts,
        checkedAt: new Date(),
      };
    } catch (error) {
      logger.error('[checkWalletAlerts] Error:', error);
      throw createInternalServerError('Failed to check wallet alerts');
    }
  }),

/**
 * Статус системы мониторинга алертов
 */
getAlertMonitorStatus: operatorOnly // Только операторы могут видеть статус мониторинга
  .query(async () => {
    // Возвращаем информацию о состоянии мониторинга
    return {
      isMonitoringActive: true, // TODO: реальный статус из WalletAlertMonitor
      lastCheck: new Date(),
      monitoringInterval: '5 minutes',
      configuredThresholds: WALLET_POOL_CONFIG.MIN_AVAILABLE_THRESHOLDS,
    };
  }),
```

### **🔧 ЭТАП 4: Background Process Setup**

#### **4.1 Инициализация мониторинга**

**ФАЙЛ:** `apps/web/src/server/startup/wallet-monitoring.ts` (новый файл)

```typescript
import { WalletAlertMonitor } from '@repo/exchange-core';
import { createEnvironmentLogger } from '@repo/utils';

const logger = createEnvironmentLogger('WalletMonitoringStartup');

/**
 * Глобальный экземпляр монитора алертов
 */
let alertMonitor: WalletAlertMonitor | null = null;

/**
 * Запустить систему мониторинга кошельков
 */
export async function initializeWalletMonitoring(): Promise<void> {
  try {
    if (alertMonitor) {
      logger.warn('Wallet monitoring already initialized');
      return;
    }

    alertMonitor = new WalletAlertMonitor();

    // Запускаем мониторинг каждые 5 минут
    const intervalMinutes = parseInt(process.env.WALLET_ALERT_INTERVAL || '5');
    await alertMonitor.startMonitoring(intervalMinutes);

    logger.info('Wallet alert monitoring initialized successfully', { intervalMinutes });
  } catch (error) {
    logger.error('Failed to initialize wallet monitoring', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Остановить мониторинг (graceful shutdown)
 */
export async function shutdownWalletMonitoring(): Promise<void> {
  if (alertMonitor) {
    alertMonitor.stopMonitoring();
    alertMonitor = null;
    logger.info('Wallet monitoring shutdown completed');
  }
}

/**
 * Получить экземпляр монитора
 */
export function getAlertMonitor(): WalletAlertMonitor | null {
  return alertMonitor;
}
```

#### **4.2 Интеграция в app startup**

**ФАЙЛ:** `apps/web/src/server/startup/index.ts` (модификация существующего)

```typescript
import { initializeWalletMonitoring, shutdownWalletMonitoring } from './wallet-monitoring';

// В существующий startup process
export async function initializeServer(): Promise<void> {
  // ... existing initialization code ...

  // Новое: инициализация мониторинга кошельков
  await initializeWalletMonitoring();
}

// В graceful shutdown process
export async function shutdownServer(): Promise<void> {
  // ... existing shutdown code ...

  // Новое: остановка мониторинга
  await shutdownWalletMonitoring();
}
```

### **🔧 ЭТАП 5: Email Templates и Configuration**

#### **5.1 Email template для алертов**

**ФАЙЛ:** `packages/constants/src/email-templates.ts` (расширение существующего)

```typescript
export const EMAIL_TEMPLATES = {
  // ... existing templates ...

  WALLET_CRITICAL_ALERT: {
    subject: '🚨 Critical Wallet Alert - {currency}',
    body: `
<h2>🚨 Wallet Pool Critical Alert</h2>

<div style="background-color: {severityColor}; padding: 15px; border-radius: 5px; margin: 10px 0;">
  <h3>{severityEmoji} {severity} Alert</h3>
  <p><strong>Currency:</strong> {currency}</p>
  <p><strong>Available Wallets:</strong> {availableWallets}</p>
  <p><strong>Minimum Threshold:</strong> {threshold}</p>
  <p><strong>Time:</strong> {timestamp}</p>
</div>

<h4>Action Required:</h4>
<p>Please add more {currency} wallets to the pool immediately.</p>

<p><em>This is an automated alert from ExchangeGO wallet monitoring system.</em></p>
    `,
  },
} as const;
```

#### **5.2 Environment configuration**

**ФАЙЛ:** `.env.local` (пример конфигурации)

```bash
# Wallet Alert Monitoring
WALLET_ALERT_INTERVAL=5  # Minutes between checks
ALERT_EMAILS=admin@exchangego.com,operator@exchangego.com
ENABLE_WALLET_ALERTS=true

# Override thresholds (optional)
WALLET_THRESHOLD_BTC=3
WALLET_THRESHOLD_ETH=2
WALLET_THRESHOLD_USDT=5
WALLET_THRESHOLD_LTC=2
```

---

## 🔄 ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩЕЙ АРХИТЕКТУРОЙ

### **📍 ТОЧКИ ИНТЕГРАЦИИ:**

#### **1. WalletPoolManager** (расширение)

- Добавить `checkCriticalThresholds()` метод
- Сохранить все existing функциональность
- Следовать existing patterns

#### **2. shared.ts Router** (новые procedures)

- `checkWalletAlerts` - ручная проверка для операторов
- `getAlertMonitorStatus` - статус системы мониторинга

#### **3. Email Service** (переиспользование)

- Использовать existing `@repo/email-service`
- Добавить новый template для алертов
- Сохранить existing rate limiting

#### **4. Logger System** (переиспользование)

- Использовать existing `createEnvironmentLogger`
- Structured logging для алертов
- Environment-based log levels

### **🎯 АРХИТЕКТУРНЫЕ ПРИНЦИПЫ:**

1. **Single Responsibility**: Каждый класс имеет одну задачу
2. **Open/Closed**: Расширение без модификации existing кода
3. **Dependency Inversion**: Зависимость от абстракций
4. **Factory Pattern**: Consistent с existing WalletPoolManagerFactory

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ

### **🎯 ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ:**

- [ ] ✅ Автоматическая проверка порогов кошельков
- [ ] ✅ Email уведомления админам/операторам
- [ ] ✅ Настраиваемые интервалы мониторинга
- [ ] ✅ Manual проверка через tRPC API
- [ ] ✅ Structured logging всех алертов
- [ ] ✅ Graceful startup/shutdown процессы
- [ ] ✅ Environment-based конфигурация

### **🏗️ АРХИТЕКТУРНЫЕ ТРЕБОВАНИЯ:**

- [ ] ✅ Минимальные изменения existing кода
- [ ] ✅ Переиспользование existing инфраструктуры
- [ ] ✅ Следование existing patterns и conventions
- [ ] ✅ Backward compatibility
- [ ] ✅ Error handling и resilience

### **🔧 ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:**

- [ ] ✅ TypeScript типизация
- [ ] ✅ ESLint compliance
- [ ] ✅ Environment variables поддержка
- [ ] ✅ Proper cleanup и resource management

---

## 🚀 ПОСЛЕДОВАТЕЛЬНОСТЬ РЕАЛИЗАЦИИ

### **Phase 1: Core Alert Logic** (1-2 часа)

1. Добавить `CriticalAlert` типы
2. Расширить `WalletPoolManager` alerting методами
3. Создать `WalletAlertMonitor` сервис

### **Phase 2: Integration** (1 час)

4. Добавить tRPC procedures в `shared.ts`
5. Создать startup/shutdown интеграцию

### **Phase 3: Configuration** (30 минут)

6. Добавить email templates
7. Environment variables setup

### **Phase 4: Testing** (30 минут)

8. Manual тестирование через tRPC
9. Проверка email отправки
10. Мониторинг логов

---

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### **✅ ПОСЛЕ РЕАЛИЗАЦИИ:**

1. **Proactive Monitoring**: Система автоматически отслеживает уровни кошельков
2. **Instant Alerts**: Операторы получают уведомления о критических ситуациях
3. **Prevention Focus**: Предотвращение emergency ситуаций
4. **Operational Visibility**: Полная прозрачность состояния пула кошельков
5. **Scalable Architecture**: Легкое добавление новых типов алертов

### **📈 BUSINESS VALUE:**

- Предотвращение простоев в обработке заявок
- Планирование пополнения пула кошельков
- Повышение качества обслуживания клиентов
- Снижение operational overhead

---

**ЗАКЛЮЧЕНИЕ:** План интеграции задачи 6.4 максимально использует existing архитектуру (70% готовности) и добавляет только необходимую alerting логику. Минимальные изменения, максимальная эффективность.
