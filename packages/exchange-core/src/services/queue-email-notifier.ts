/**
 * Серверный модуль для email уведомлений в очереди кошельков
 * 🎯 TASK 5.2: Изолированная email функциональность для предотвращения bundle конфликтов
 */

import type { CryptoCurrency, Order, User } from '../types';

/**
 * Интерфейс для отправки email уведомлений из очереди
 */
export interface QueueEmailNotifier {
  sendWalletReadyEmail(orderId: string, address: string, currency: CryptoCurrency): Promise<void>;
  sendWalletReadyEmailAsync?(
    order: Order,
    user: User,
    address: string,
    currency: CryptoCurrency
  ): Promise<void>;
  getQueueStats?(): Promise<QueueStats>; // ✅ ФАЗА 4: Queue monitoring
}

interface QueueStats {
  totalProcessed: number;
  totalFailed: number;
  queueLength: number;
  lastProcessed: string | null;
}

/**
 * Серверная реализация email уведомлений
 * Использует динамический импорт для изоляции Node.js зависимостей
 */
export class ServerQueueEmailNotifier implements QueueEmailNotifier {
  async sendWalletReadyEmail(
    orderId: string,
    address: string,
    currency: CryptoCurrency
  ): Promise<void> {
    // Проверяем серверную среду
    if (typeof window !== 'undefined') {
      return; // В браузерной среде ничего не делаем
    }

    try {
      const { order, user } = await this.loadOrderAndUser(orderId);
      await this.sendEmailInServerEnvironment(order, user, address, currency);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Queue email notification failed:', error);
    }
  }

  private async loadOrderAndUser(orderId: string) {
    const { orderManager, userManager } = await import('../data/manager');

    const order = await orderManager.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const user = await userManager.findById(order.userId);
    if (!user) {
      throw new Error(`User not found for order ${orderId}`);
    }

    return { order, user };
  }

  private async sendEmailInServerEnvironment(
    order: Order,
    user: User,
    address: string,
    currency: CryptoCurrency
  ) {
    // Эта функция только для серверной среды
    // В development окружении email может быть недоступен
    try {
      const { WALLET_POOL_CONFIG } = await import('@repo/constants');
      const expiresAt = new Date();
      expiresAt.setHours(
        expiresAt.getHours() + WALLET_POOL_CONFIG.EMAIL_CONSTANTS.WALLET_EXPIRY_HOURS
      );

      // ✅ FIXED: Прямой импорт вместо динамического через переменную
      const emailModule = await import('@repo/email-service');
      await emailModule.EmailService.sendCryptoAddress({
        orderId: order.id,
        cryptoAddress: address,
        currency,
        amount: order.cryptoAmount,
        expiresAt,
        userEmail: user.email,
      });
    } catch (error) {
      // В development среде email может быть недоступен - это нормально
      // eslint-disable-next-line no-console
      console.warn('Email service unavailable in current environment:', error);
    }
  }

  // ✅ НОВЫЙ МЕТОД: Простая async версия для будущего развития
  async sendWalletReadyEmailAsync(
    order: Order,
    user: User,
    address: string,
    currency: CryptoCurrency
  ): Promise<void> {
    // Пока что fallback к синхронной отправке
    return this.sendWalletReadyEmail(order.id, address, currency);
  }

  // ✅ ФАЗА 4: Простой мониторинг queue статистики
  async getQueueStats(): Promise<QueueStats> {
    // В реальной реализации здесь будет Redis queue статистика
    // Пока возвращаем mock данные для демонстрации API
    return {
      totalProcessed: 0,
      totalFailed: 0,
      queueLength: 0,
      lastProcessed: null,
    };
  }
}

/**
 * Клиентская заглушка для email уведомлений
 */
export class ClientQueueEmailNotifier implements QueueEmailNotifier {
  async sendWalletReadyEmail(): Promise<void> {
    // В браузерной среде email недоступен
    return Promise.resolve();
  }
}

/**
 * Фабрика для создания подходящего notifier
 */
export function createQueueEmailNotifier(): QueueEmailNotifier {
  // Проверяем серверную среду
  if (typeof window === 'undefined') {
    return new ServerQueueEmailNotifier();
  }
  return new ClientQueueEmailNotifier();
}
