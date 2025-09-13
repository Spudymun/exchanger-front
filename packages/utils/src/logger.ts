/**
 * Shared Logger System for Exchanger Project
 * Унифицированная система логирования для всех пакетов проекта
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

/**
 * Данные для логирования
 */
export type LogData = Record<string, string | number | boolean | null | undefined>;

/**
 * Конфигурация логгера
 */
export interface LoggerConfig {
  readonly quiet: boolean;
  readonly verbose: boolean;
  readonly context?: string;
  readonly enableEnvironmentInfo?: boolean;
}

/**
 * Универсальный логгер для проекта exchanger
 */
export class Logger {
  constructor(private readonly config: LoggerConfig) {}

  /**
   * Логирование ошибок (всегда выводится)
   */
  error(message: string, data?: LogData): void {
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('ERROR', message, data));
  }

  /**
   * Логирование предупреждений (всегда выводится, кроме quiet)
   */
  warn(message: string, data?: LogData): void {
    if (!this.config.quiet) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  /**
   * Информационные сообщения (выводятся, если не quiet)
   */
  info(message: string, data?: LogData): void {
    if (!this.config.quiet) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('INFO', message, data));
    }
  }

  /**
   * Подробные сообщения (только в verbose режиме)
   */
  verbose(message: string, data?: LogData): void {
    if (this.config.verbose && !this.config.quiet) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('VERBOSE', message, data));
    }
  }

  /**
   * Debug сообщения (только в non-production и verbose)
   */
  debug(message: string, data?: LogData): void {
    if (process.env.NODE_ENV !== 'production' && this.config.verbose && !this.config.quiet) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  /**
   * Специализированный метод для логирования конфигурации среды
   */
  environmentInfo(environmentData: LogData): void {
    if (this.config.enableEnvironmentInfo && process.env.NODE_ENV !== 'production') {
      this.debug('Environment Configuration', environmentData);
    }
  }

  /**
   * Форматирование сообщения с данными
   */
  private formatMessage(level: string, message: string, data?: LogData): string {
    const prefix = this.config.context ? `[${this.config.context}]` : '';
    const timestamp = new Date().toISOString();

    let formattedMessage = `${timestamp} ${level}${prefix} ${message}`;

    if (data && Object.keys(data).length > 0) {
      formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
    }

    return formattedMessage;
  }
}

/**
 * Создание экземпляра логгера с конфигурацией
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

/**
 * Создание логгера для development окружения (verbose + environment info)
 */
export function createDevelopmentLogger(context?: string): Logger {
  return createLogger({
    quiet: false,
    verbose: true,
    context,
    enableEnvironmentInfo: true,
  });
}

/**
 * Создание логгера для production окружения (quiet, только errors/warns)
 */
export function createProductionLogger(context?: string): Logger {
  return createLogger({
    quiet: false,
    verbose: false,
    context,
    enableEnvironmentInfo: false,
  });
}

/**
 * Автоматическое создание логгера в зависимости от NODE_ENV
 */
export function createEnvironmentLogger(context?: string): Logger {
  return process.env.NODE_ENV === 'production'
    ? createProductionLogger(context)
    : createDevelopmentLogger(context);
}
