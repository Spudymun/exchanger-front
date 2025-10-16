/**
 * Manual Rate Checker Service
 * Проверяет устаревшие ручные курсы и отправляет уведомления
 * 
 * Запускается по расписанию (cron: 0 9 * * * - каждый день в 9:00)
 */

import { getPrismaClient } from '@repo/session-management';
import { createEnvironmentLogger } from '@repo/utils';

const logger = createEnvironmentLogger('manual-rate-checker');

const NINE_AM_HOUR = 9;
const INITIAL_CHECK_DELAY = 5000; // 5 секунд после старта

async function notifyOutdated(rate: { currency: string; updatedAt: Date; uahRate: { toString: () => string } }) {
  const now = new Date();
  const hoursSinceUpdate = Math.floor((now.getTime() - rate.updatedAt.getTime()) / (1000 * 60 * 60));
  const botUrl = process.env.TELEGRAM_BOT_URL;
  
  if (!botUrl) return;
  
  await fetch(`${botUrl}/api/notify-operators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notificationType: 'manual_rate_outdated',
      currency: rate.currency,
      lastUpdateHours: hoursSinceUpdate,
      currentRate: rate.uahRate.toString(),
    }),
  });
  
  logger.warn('Notification sent', { currency: rate.currency, hoursSinceUpdate });
}

/**
 * Проверить все активные ручные курсы на устаревание
 * @param source - Источник вызова: 'startup' (при запуске) или 'scheduled' (по cron)
 */
export async function checkOutdatedRates(source: 'startup' | 'scheduled' = 'startup'): Promise<void> {
  try {
    // ✅ Startup NEVER triggers notifications, only scheduled cron does
    if (source === 'startup') {
      logger.debug('Skipping manual rate check - startup mode', { source });
      return;
    }

    logger.info('Starting manual rates check', { source });

    const now = new Date();
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      logger.error('DATABASE_URL not configured');
      return;
    }

    const prisma = getPrismaClient({
      appName: 'telegram-bot-rate-checker',
      url: databaseUrl,
    });
    
    const outdatedRates = await prisma.manualExchangeRate.findMany({
      where: {
        isActive: true,
        validUntil: {
          lt: now,
        },
      },
    });

    if (outdatedRates.length === 0) {
      logger.info('No outdated manual rates found');
      return;
    }

    logger.warn('Found outdated manual rates', {
      count: outdatedRates.length,
      currencies: outdatedRates.map((r: { currency: string }) => r.currency).join(', '),
    });

    for (const rate of outdatedRates) {
      await notifyOutdated(rate);
    }

    logger.info('Manual rate check completed', { source });

  } catch (error) {
    logger.error('Failed to check outdated rates', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Вычислить задержку до следующего запуска в 9:00
 */
function calculateDelayToNextRun(): number {
  const now = new Date();
  const next = new Date();
  
  // Установить время на 9:00
  next.setHours(NINE_AM_HOUR, 0, 0, 0);
  
  // Если 9:00 уже прошло сегодня, перенести на завтра
  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }
  
  return next.getTime() - now.getTime();
}

/**
 * Запустить scheduled checker
 */
export function startManualRateChecker(): void {
  logger.info('Initializing manual rate checker');
  
  // Первая проверка через 5 секунд после старта
  setTimeout(() => {
    void checkOutdatedRates('startup'); // ✅ Указываем source = 'startup'
  }, INITIAL_CHECK_DELAY);
  
  // Затем запускать каждый день в 9:00
  const scheduleNextCheck = () => {
    const delay = calculateDelayToNextRun();
    
    logger.info('Next manual rate check scheduled', {
      nextRunAt: new Date(Date.now() + delay).toISOString(),
      delayMs: delay,
    });
    
    setTimeout(() => {
      void checkOutdatedRates('scheduled'); // ✅ Указываем source = 'scheduled'
      scheduleNextCheck(); // Запланировать следующую проверку
    }, delay);
  };
  
  scheduleNextCheck();
}
