/**
 * Simple Logger for Style Scanner
 * Простая система логирования для пакета style-scanner
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

/**
 * Конфигурация логгера
 */
export interface LoggerConfig {
  readonly quiet: boolean;
  readonly verbose: boolean;
}

/**
 * Простой логгер для style-scanner
 */
export class Logger {
  constructor(private readonly config: LoggerConfig) {}

  /**
   * Логирование ошибок (всегда выводится)
   */
  error(message: string, context?: string): void {
    console.error(this.formatMessage('ERROR', message, context));
  }

  /**
   * Логирование предупреждений (всегда выводится, кроме quiet)
   */
  warn(message: string, context?: string): void {
    if (!this.config.quiet) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  /**
   * Информационные сообщения (выводятся, если не quiet)
   */
  info(message: string, context?: string): void {
    if (!this.config.quiet) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  /**
   * Подробные сообщения (только в verbose режиме)
   */
  verbose(message: string, context?: string): void {
    if (this.config.verbose && !this.config.quiet) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('VERBOSE', message, context));
    }
  }

  /**
   * Форматирование сообщения
   */
  private formatMessage(level: string, message: string, context?: string): string {
    const prefix = context ? `[${context}]` : '';
    return `${prefix} ${message}`;
  }
}

/**
 * Создание экземпляра логгера
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}
