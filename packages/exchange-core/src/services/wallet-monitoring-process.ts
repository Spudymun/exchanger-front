import { TIME_CONSTANTS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

import {
  type MonitoringState,
  type MonitoringConfig,
  startMonitoring,
  stopMonitoring,
  getMonitoringStatus,
} from '../utils/monitoring-utils';

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
  // ✅ Используем monitoring-utils для устранения дублирования с EmailMonitoringService
  private static state: MonitoringState = {
    intervalId: null,
    isRunning: false,
    logger: createEnvironmentLogger('WalletMonitoringProcess'),
  };

  private static config: MonitoringConfig = {
    checkIntervalMinutes: MONITORING_CONSTANTS.CHECK_INTERVAL_MINUTES,
    checkTimeoutSeconds: MONITORING_CONSTANTS.CHECK_TIMEOUT_SECONDS,
  };

  /**
   * Запустить background мониторинг (используем monitoring-utils)
   */
  static start(): void {
    startMonitoring(this.state, this.config, this.performCheck.bind(this));
  }

  /**
   * Остановить background мониторинг (используем monitoring-utils)
   */
  static stop(): void {
    stopMonitoring(this.state);
  }

  /**
   * Выполнить одну проверку с таймаутом (для мониторинга)
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
      const timeoutMs = this.config.checkTimeoutSeconds * TIME_CONSTANTS.MILLISECONDS_IN_SECOND;
      setTimeout(() => reject(new Error('Check timeout')), timeoutMs);
    });

    const checkPromise = WalletAlertsService.checkAndAlert();

    return await Promise.race([checkPromise, timeoutPromise]);
  }

  /**
   * Обработать результат проверки
   */
  private static handleCheckResult(alerts: AlertCheckResult[], checkDuration: number): void {
    if (alerts.length > MONITORING_CONSTANTS.NO_ALERTS) {
      this.state.logger.warn('Wallet monitoring detected critical alerts', {
        alertCount: alerts.length,
        currencyCount: alerts.length,
        checkDurationMs: checkDuration,
      });
    } else {
      this.state.logger.info('Wallet monitoring check completed - all OK', {
        checkDurationMs: checkDuration,
      });
    }
  }

  /**
   * Обработать ошибку проверки
   */
  private static handleCheckError(error: unknown, checkStartTime: number): void {
    const checkDuration = Date.now() - checkStartTime;

    this.state.logger.error('Wallet monitoring check failed', {
      error: error instanceof Error ? error.message : MONITORING_CONSTANTS.UNKNOWN_ERROR,
      checkDurationMs: checkDuration,
    });
  }

  /**
   * Получить статус мониторинга (используем monitoring-utils)
   */
  static getStatus(): { isRunning: boolean; intervalMs: number } {
    return getMonitoringStatus(this.state, this.config);
  }
}

// Автоматический запуск в production среде
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    WalletMonitoringProcess.start();
  }, MONITORING_CONSTANTS.STARTUP_DELAY_MS);
}
