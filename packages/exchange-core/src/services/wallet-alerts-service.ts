import { CONTACT_INFO, TIME_CONSTANTS } from '@repo/constants';
import { EmailService } from '@repo/email-service';
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

      const firstAlert = alerts[0];
      if (!firstAlert) return;

      // Простая отправка через существующую email систему
      await EmailService.sendCryptoAddress({
        orderId: `wallet-alert-${Date.now()}`,
        cryptoAddress: 'SYSTEM-ALERT-PLACEHOLDER',
        userEmail: CONTACT_INFO.SUPPORT_EMAIL, // Используем support email
        currency: firstAlert.currency,
        amount: alerts.length,
        expiresAt: new Date(
          Date.now() +
            TIME_CONSTANTS.HOURS_IN_DAY *
              TIME_CONSTANTS.SECONDS_IN_MINUTE *
              TIME_CONSTANTS.MILLISECONDS_IN_SECOND
        ),
      });

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
