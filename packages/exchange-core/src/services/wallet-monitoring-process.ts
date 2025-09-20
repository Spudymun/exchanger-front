import { TIME_CONSTANTS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import type { AlertCheckResult } from './wallet-alerts-service';
import { WalletAlertsService } from './wallet-alerts-service';

/**
 * Константы мониторинга
 */
const MONITORING_CONSTANTS = {
  CHECK_INTERVAL_MINUTES: 5,
  CHECK_TIMEOUT_SECONDS: 30,
  STARTUP_DELAY_MS: 5000,
  NO_ALERTS: 0,
  UNKNOWN_ERROR: 'Unknown error',
} as const;

/**
 * Background процесс для мониторинга состояния кошельков
 */
export class WalletMonitoringProcess {
  private static logger = createEnvironmentLogger('WalletMonitoringProcess');
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Конфигурация мониторинга
   */
  private static readonly CONFIG = {
    CHECK_INTERVAL_MS:
      MONITORING_CONSTANTS.CHECK_INTERVAL_MINUTES *
      TIME_CONSTANTS.MINUTES_IN_HOUR *
      TIME_CONSTANTS.SECONDS_IN_MINUTE *
      TIME_CONSTANTS.MILLISECONDS_IN_SECOND,
    CHECK_TIMEOUT_MS:
      MONITORING_CONSTANTS.CHECK_TIMEOUT_SECONDS * TIME_CONSTANTS.MILLISECONDS_IN_SECOND,
  };

  /**
   * Запустить background мониторинг
   */
  static start(): void {
    if (this.isRunning) {
      this.logger.warn('Wallet monitoring already running');
      return;
    }

    this.logger.info('Starting wallet monitoring process', {
      intervalMinutes: MONITORING_CONSTANTS.CHECK_INTERVAL_MINUTES,
    });

    // Первая проверка сразу
    this.performInitialCheck();

    // Устанавливаем периодические проверки
    this.intervalId = setInterval(() => {
      this.performScheduledCheck();
    }, this.CONFIG.CHECK_INTERVAL_MS);

    this.isRunning = true;
  }

  /**
   * Остановить background мониторинг
   */
  static stop(): void {
    if (!this.isRunning) {
      this.logger.warn('Wallet monitoring not running');
      return;
    }

    this.logger.info('Stopping wallet monitoring process');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  /**
   * Выполнить первоначальную проверку
   */
  private static performInitialCheck(): void {
    this.performCheck().catch(error => {
      this.logger.error('Initial wallet check failed', {
        error: error instanceof Error ? error.message : MONITORING_CONSTANTS.UNKNOWN_ERROR,
      });
    });
  }

  /**
   * Выполнить запланированную проверку
   */
  private static performScheduledCheck(): void {
    this.performCheck().catch(error => {
      this.logger.error('Scheduled wallet check failed', {
        error: error instanceof Error ? error.message : MONITORING_CONSTANTS.UNKNOWN_ERROR,
      });
    });
  }

  /**
   * Выполнить одну проверку с таймаутом
   */
  private static async performCheck(): Promise<void> {
    const checkStartTime = Date.now();

    try {
      const alerts = await this.performCheckWithTimeout();
      const checkDuration = Date.now() - checkStartTime;

      this.handleCheckResult(alerts, checkDuration);
    } catch (error) {
      this.handleCheckError(error, checkStartTime);
    }
  }

  /**
   * Выполнить проверку с таймаутом
   */
  private static async performCheckWithTimeout() {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Check timeout')), this.CONFIG.CHECK_TIMEOUT_MS);
    });

    const checkPromise = WalletAlertsService.checkAndAlert();

    return await Promise.race([checkPromise, timeoutPromise]);
  }

  /**
   * Обработать результат проверки
   */
  private static handleCheckResult(alerts: AlertCheckResult[], checkDuration: number): void {
    if (alerts.length > MONITORING_CONSTANTS.NO_ALERTS) {
      this.logger.warn('Wallet monitoring detected critical alerts', {
        alertCount: alerts.length,
        currencyCount: alerts.length,
        checkDurationMs: checkDuration,
      });
    } else {
      this.logger.info('Wallet monitoring check completed - all OK', {
        checkDurationMs: checkDuration,
      });
    }
  }

  /**
   * Обработать ошибку проверки
   */
  private static handleCheckError(error: unknown, checkStartTime: number): void {
    const checkDuration = Date.now() - checkStartTime;

    this.logger.error('Wallet monitoring check failed', {
      error: error instanceof Error ? error.message : MONITORING_CONSTANTS.UNKNOWN_ERROR,
      checkDurationMs: checkDuration,
    });
  }

  /**
   * Получить статус мониторинга
   */
  static getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.CONFIG.CHECK_INTERVAL_MS,
    };
  }
}

// Автоматический запуск в production среде
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    WalletMonitoringProcess.start();
  }, MONITORING_CONSTANTS.STARTUP_DELAY_MS);
}
