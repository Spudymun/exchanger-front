import { PrismaClient } from '@prisma/client';

export interface PrismaClientConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  appName?: string;
}

// ✅ Global singleton pattern для hot-reload environments
// Предотвращает создание множественных instances при hot-reload в development
declare global {
  var __prismaInstance: PrismaClient | undefined;
}

/**
 * Добавляет application_name к DATABASE_URL для мониторинга
 */
function buildDatabaseUrlWithAppName(config: PrismaClientConfig): string {
  if (!config.appName) {
    return config.url;
  }

  try {
    const url = new URL(config.url);
    if (!url.searchParams.has('application_name')) {
      url.searchParams.set('application_name', config.appName);
    }
    return url.toString();
  } catch {
    // Если URL невалидный, возвращаем оригинал
    return config.url;
  }
}

/**
 * Проверяет наличие connection_limit в DATABASE_URL
 */
function validateConnectionPoolConfig(databaseUrl: string): void {
  const hasConnectionLimit = databaseUrl.includes('connection_limit');

  if (!hasConnectionLimit && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️ DATABASE_URL missing connection_limit parameter. ' +
        'Prisma will use default pool size. ' +
        'Recommended: add "?connection_limit=5" for development'
    );
  }
}

/**
 * Получает или создает singleton instance PrismaClient
 * ✅ ИСПРАВЛЕНО: Использует global variable для сохранения instance между hot-reloads
 *
 * @param config - Конфигурация Prisma client
 * @returns Singleton instance PrismaClient
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prismaclient-in-long-running-applications
 */
export function getPrismaClient(config: PrismaClientConfig): PrismaClient {
  // В development используем global для сохранения между hot-reloads
  if (process.env.NODE_ENV !== 'production' && global.__prismaInstance) {
    return global.__prismaInstance;
  }

  // Создаем новый instance если не существует
  if (!global.__prismaInstance) {
    // Добавляем application_name для мониторинга в pg_stat_activity
    const urlWithAppName = buildDatabaseUrlWithAppName(config);

    // Валидация конфигурации connection pool
    validateConnectionPoolConfig(config.url);

    global.__prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: urlWithAppName,
        },
      },
      // Детальные логи в development для отладки connection issues
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // ✅ Graceful shutdown handling
    const cleanup = async () => {
      await disconnectPrismaClient();
    };

    process.on('beforeExit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  return global.__prismaInstance;
}

/**
 * Внутренняя функция для отключения Prisma client
 */
async function disconnectPrismaClient(): Promise<void> {
  if (global.__prismaInstance) {
    await global.__prismaInstance.$disconnect();
    global.__prismaInstance = undefined;
  }
}

/**
 * Принудительно закрывает singleton instance (для тестов)
 */
export async function closePrismaClient(): Promise<void> {
  await disconnectPrismaClient();
}
