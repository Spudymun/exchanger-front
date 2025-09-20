import { CONTACT_INFO } from '@repo/constants';
import { EmailService } from '@repo/email-service';
import type { SystemAlertEmailData } from '@repo/email-service';
import { createEnvironmentLogger } from '@repo/utils';

import type { CryptoCurrency } from '../types';

import { WalletPoolManagerFactory } from './wallet-pool-manager-factory';

/**
 * Результат проверки алертов
 */
export interface AlertCheckResult {
  currency: CryptoCurrency;
  available: number;
  threshold: number;
  isCritical: boolean;
  message: string;
}

/**
 * Упрощенный сервис для alerting системы кошельков
 *
 * @implements AC6.4 - система оповещений о критически низком количестве кошельков
 */
export class WalletAlertsService {
  private static logger = createEnvironmentLogger('WalletAlertsService');

  /**
   * Проверить все валюты и вернуть только критические алерты
   */
  static async checkAll(): Promise<AlertCheckResult[]> {
    try {
      const walletPoolManager = await WalletPoolManagerFactory.create();
      const thresholds = await walletPoolManager.checkThresholds();

      return thresholds
        .filter(t => t.isCritical)
        .map(t => ({
          currency: t.currency,
          available: t.available,
          threshold: t.threshold,
          isCritical: t.isCritical,
          message: `${t.currency}: ${t.available} available (threshold: ${t.threshold})`,
        }));
    } catch (error) {
      this.logger.error('Failed to check wallet thresholds', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Отправить email алерт о критических состояниях
   */
  static async sendAlert(alerts: AlertCheckResult[]): Promise<void> {
    const noAlertsLength = 0;
    if (alerts.length === noAlertsLength) return;

    try {
      this.logger.warn('Sending wallet shortage alerts', {
        alertCount: alerts.length,
      });

      // Формируем детали алертов
      const alertDetails = alerts
        .map(
          alert => `• ${alert.currency}: ${alert.available} доступно (порог: ${alert.threshold})`
        )
        .join('\n');

      // Используем правильный метод для системных алертов
      const EMERGENCY_THRESHOLD = 0;
      const systemAlertData: SystemAlertEmailData = {
        alertType: 'WALLET_THRESHOLD',
        alertLevel: alerts.some(a => a.available === EMERGENCY_THRESHOLD)
          ? 'EMERGENCY'
          : 'CRITICAL',
        alertCount: alerts.length,
        alertDetails,
        timestamp: new Date(),
        recipients: [CONTACT_INFO.SUPPORT_EMAIL], // Отправляем на support email
      };

      await EmailService.sendSystemAlert(systemAlertData);

      this.logger.info('Wallet alert email sent');
    } catch (error) {
      this.logger.error('Failed to send alert email', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Проверить и отправить алерты
   */
  static async checkAndAlert(): Promise<AlertCheckResult[]> {
    const alerts = await this.checkAll();
    const hasAnyAlerts = 0;
    if (alerts.length > hasAnyAlerts) {
      await this.sendAlert(alerts);
    }
    return alerts;
  }
}
