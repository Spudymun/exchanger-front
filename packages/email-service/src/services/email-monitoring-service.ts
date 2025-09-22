import { EMAIL_PROVIDERS, type EmailProviderType } from '@repo/constants';
import {
  type MonitoringState,
  type MonitoringConfig,
  startMonitoring,
  stopMonitoring,
  getMonitoringStatus,
} from '@repo/exchange-core';
import { createEnvironmentLogger } from '@repo/utils';

import { EmailServiceFactory } from '../factories/email-service-factory';
import type { EmailSendResult } from '../types/index';

/**
 * Email providers для мониторинга
 */
type EmailProvider = EmailProviderType;

/**
 * Константы
 */
const UNKNOWN_ERROR = 'Unknown error' as const;

/**
 * Статистика по провайдеру
 */
interface ProviderStatistics {
  sent: number;
  failed: number;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  lastError?: string;
}

/**
 * Статистика по провайдеру для tRPC response
 */
export interface ProviderStatisticsResponse {
  provider?: string;
  sent: number;
  failed: number;
  deliveryRate: string;
  lastError?: string;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
}

/**
 * Агрегированная статистика
 */
export interface AggregatedStatistics {
  providers: ProviderStatisticsResponse[];
  summary: {
    totalSent: number;
    totalFailed: number;
    overallDeliveryRate: string;
  };
}

/**
 * Email Monitoring Service
 * ✅ STATIC класс с monitoring-utils для устранения дублирования
 */
export class EmailMonitoringService {
  private static statistics = new Map<string, ProviderStatistics>();

  // ✅ Используем monitoring-utils для устранения дублирования с WalletMonitoringProcess
  private static state: MonitoringState = {
    intervalId: null,
    isRunning: false,
    logger: createEnvironmentLogger('EmailMonitoringService'),
  };

  private static config: MonitoringConfig = {
    checkIntervalMinutes: 10, // Проверка каждые 10 минут
    checkTimeoutSeconds: 30,
  };

  /**
   * ✅ Записать результат отправки email (для интеграции с EmailService)
   */
  static recordEmailResult(
    provider: EmailProvider,
    result: EmailSendResult,
    errorMessage?: string
  ): void {
    const key = `provider:${provider}`;
    const current = this.statistics.get(key) || { sent: 0, failed: 0 };

    if (result.success) {
      current.sent++;
      current.lastSuccessAt = new Date();
    } else {
      current.failed++;
      current.lastFailureAt = new Date();
      current.lastError = errorMessage || result.error || UNKNOWN_ERROR;
    }

    this.statistics.set(key, current);

    this.state.logger.debug('Email result recorded', {
      provider,
      success: result.success,
      totalSent: current.sent,
      totalFailed: current.failed,
    });
  }

  /**
   * ✅ Получить статистику по провайдеру (для tRPC procedure)
   */
  static getProviderStatistics(
    provider?: string
  ): ProviderStatisticsResponse | AggregatedStatistics {
    if (provider) {
      const key = `provider:${provider}`;
      const stats = this.statistics.get(key) || { sent: 0, failed: 0 };

      return {
        provider,
        sent: stats.sent,
        failed: stats.failed,
        deliveryRate:
          stats.sent + stats.failed > 0
            ? ((stats.sent / (stats.sent + stats.failed)) * 100).toFixed(2) + '%'
            : '0%',
        lastError: stats.lastError,
        lastSuccessAt: stats.lastSuccessAt,
        lastFailureAt: stats.lastFailureAt,
      };
    }

    // ✅ Агрегированная статистика по всем провайдерам
    const allStats = Array.from(this.statistics.entries()).map(([key, stats]) => {
      const providerName = key.replace('provider:', '');
      return {
        provider: providerName,
        sent: stats.sent,
        failed: stats.failed,
        deliveryRate:
          stats.sent + stats.failed > 0
            ? ((stats.sent / (stats.sent + stats.failed)) * 100).toFixed(2) + '%'
            : '0%',
        lastError: stats.lastError,
        lastSuccessAt: stats.lastSuccessAt,
        lastFailureAt: stats.lastFailureAt,
      };
    });

    return {
      providers: allStats,
      summary: {
        totalSent: allStats.reduce((sum, p) => sum + p.sent, 0),
        totalFailed: allStats.reduce((sum, p) => sum + p.failed, 0),
        overallDeliveryRate: (() => {
          const total = allStats.reduce((sum, p) => sum + p.sent + p.failed, 0);
          const successful = allStats.reduce((sum, p) => sum + p.sent, 0);
          return total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%';
        })(),
      },
    };
  }

  /**
   * ✅ Проверить здоровье email провайдеров
   */
  static async checkEmailProvidersHealth(): Promise<{
    healthy: boolean;
    providers: Array<{
      name: string;
      healthy: boolean;
      lastCheck: Date;
      error?: string;
    }>;
  }> {
    // ✅ Используем константы для устранения хардкода
    const providers = [...EMAIL_PROVIDERS] as const;
    const results = [];

    for (const provider of providers) {
      try {
        // ✅ Простая проверка: можем ли создать provider
        const _instance = EmailServiceFactory.create({ provider });

        results.push({
          name: provider,
          healthy: true,
          lastCheck: new Date(),
        });
      } catch (error) {
        results.push({
          name: provider,
          healthy: false,
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : UNKNOWN_ERROR,
        });
      }
    }

    const allHealthy = results.every(r => r.healthy);

    this.state.logger.info('Email providers health check completed', {
      allHealthy,
      healthyCount: results.filter(r => r.healthy).length,
      totalCount: results.length,
    });

    return {
      healthy: allHealthy,
      providers: results,
    };
  }

  /**
   * ✅ Запустить email мониторинг (используем monitoring-utils)
   */
  static start(): void {
    startMonitoring(this.state, this.config, this.performCheck.bind(this));
  }

  /**
   * ✅ Остановить email мониторинг (используем monitoring-utils)
   */
  static stop(): void {
    stopMonitoring(this.state);
  }

  /**
   * ✅ Получить статус мониторинга (используем monitoring-utils)
   */
  static getStatus(): { isRunning: boolean; intervalMs: number } {
    return getMonitoringStatus(this.state, this.config);
  }

  /**
   * ✅ Очистить статистику (для testing/admin purposes)
   */
  static clearStatistics(): void {
    this.statistics.clear();
    this.state.logger.info('Email monitoring statistics cleared');
  }

  /**
   * ✅ Выполнить проверку email провайдеров (для мониторинга)
   */
  private static async performCheck(): Promise<void> {
    try {
      const healthStatus = await this.checkEmailProvidersHealth();

      if (!healthStatus.healthy) {
        this.state.logger.warn('Email providers health check detected issues', {
          healthyCount: healthStatus.providers.filter(p => p.healthy).length,
          totalCount: healthStatus.providers.length,
        });
      } else {
        this.state.logger.info('Email providers health check passed', {
          totalProviders: healthStatus.providers.length,
        });
      }
    } catch (error) {
      this.state.logger.error('Email monitoring check failed', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR,
      });
    }
  }
}
