import { TIME_CONSTANTS } from '@repo/constants';
import { createEnvironmentLogger } from '@repo/utils';

/**
 * Переиспользуемые функции для static monitoring классов
 * ✅ Устраняет дублирование между WalletMonitoringProcess и EmailMonitoringService
 */

/**
 * Конфигурация для мониторинга (переиспользуемая)
 */
export interface MonitoringConfig {
  checkIntervalMinutes: number;
  checkTimeoutSeconds: number;
}

/**
 * Состояние процесса мониторинга
 */
export interface MonitoringState {
  intervalId: NodeJS.Timeout | null;
  isRunning: boolean;
  logger: ReturnType<typeof createEnvironmentLogger>;
}

/**
 * Создать конфигурацию интервалов (переиспользуемая логика)
 */
export function createMonitoringIntervals(config: MonitoringConfig) {
  return {
    CHECK_INTERVAL_MS:
      config.checkIntervalMinutes *
      TIME_CONSTANTS.MINUTES_IN_HOUR *
      TIME_CONSTANTS.SECONDS_IN_MINUTE *
      TIME_CONSTANTS.MILLISECONDS_IN_SECOND,
    CHECK_TIMEOUT_MS: config.checkTimeoutSeconds * TIME_CONSTANTS.MILLISECONDS_IN_SECOND,
  };
}

/**
 * Запустить мониторинг (переиспользуемая логика)
 */
export function startMonitoring(
  state: MonitoringState,
  config: MonitoringConfig,
  checkFunction: () => Promise<void>
): void {
  if (state.isRunning) {
    state.logger.warn(`Monitoring already running`);
    return;
  }

  const intervals = createMonitoringIntervals(config);

  state.logger.info(`Starting monitoring process`, {
    intervalMinutes: config.checkIntervalMinutes,
  });

  // Первая проверка сразу
  performCheck(state, checkFunction, 'initial');

  // Устанавливаем периодические проверки
  state.intervalId = setInterval(() => {
    performCheck(state, checkFunction, 'scheduled');
  }, intervals.CHECK_INTERVAL_MS);

  state.isRunning = true;
}

/**
 * Остановить мониторинг (переиспользуемая логика)
 */
export function stopMonitoring(state: MonitoringState): void {
  if (!state.isRunning) {
    state.logger.warn(`Monitoring not running`);
    return;
  }

  state.logger.info(`Stopping monitoring process`);

  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.isRunning = false;
}

/**
 * Получить статус мониторинга (переиспользуемая логика)
 */
export function getMonitoringStatus(
  state: MonitoringState,
  config: MonitoringConfig
): { isRunning: boolean; intervalMs: number } {
  const intervals = createMonitoringIntervals(config);
  return {
    isRunning: state.isRunning,
    intervalMs: intervals.CHECK_INTERVAL_MS,
  };
}

/**
 * Private functions (переиспользуемая error handling логика)
 */
/**
 * Выполнить проверку мониторинга с обработкой ошибок
 */
function performCheck(
  state: MonitoringState,
  checkFunction: () => Promise<void>,
  checkType: 'initial' | 'scheduled'
): void {
  checkFunction().catch(error => {
    state.logger.error(`${checkType === 'initial' ? 'Initial' : 'Scheduled'} check failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });
}
