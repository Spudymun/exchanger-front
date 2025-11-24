import type { PrismaClient } from '@prisma/client';
import { createEnvironmentLogger } from '@repo/utils';

const logger = createEnvironmentLogger('connection-monitor');

// Пороговые значения для warning/error
const CONNECTION_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 70,
  MODERATE: 50,
} as const;

export interface ConnectionStats {
  total: number;
  idle: number;
  active: number;
  waiting: number;
  maxConnections: number;
  usagePercent: number;
  timestamp: Date;
  byApplication: Array<{
    name: string;
    count: number;
    state: string;
  }>;
}

/**
 * Получает max_connections из PostgreSQL
 */
async function getMaxConnections(prisma: PrismaClient): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ max_connections: string }>>`
    SHOW max_connections
  `;
  const defaultMaxConnections = 100;
  return Number.parseInt(result[0]?.max_connections || String(defaultMaxConnections), 10);
}

/**
 * Получает статистику соединений по состояниям
 */
async function getConnectionStateStats(prisma: PrismaClient) {
  return prisma.$queryRaw<Array<{ state: string; count: bigint }>>`
    SELECT 
      COALESCE(state, 'unknown') as state,
      COUNT(*)::bigint as count
    FROM pg_stat_activity 
    WHERE datname = current_database()
    GROUP BY state
  `;
}

/**
 * Получает распределение соединений по application_name
 */
async function getConnectionsByApplication(prisma: PrismaClient) {
  return prisma.$queryRaw<Array<{ application_name: string; state: string; count: bigint }>>`
    SELECT 
      COALESCE(application_name, 'no-app-name') as application_name,
      COALESCE(state, 'unknown') as state,
      COUNT(*)::bigint as count
    FROM pg_stat_activity 
    WHERE datname = current_database()
    GROUP BY application_name, state
    ORDER BY count DESC
  `;
}

/**
 * Логирует warning/error в зависимости от уровня использования
 */
function logConnectionUsage(
  stats: Pick<ConnectionStats, 'total' | 'maxConnections' | 'usagePercent' | 'idle' | 'active'>
): void {
  const { usagePercent, total, maxConnections, idle, active } = stats;

  const baseInfo = {
    current: total,
    max: maxConnections,
    percent: usagePercent.toFixed(1),
    idle,
    active,
  };

  if (usagePercent > CONNECTION_THRESHOLDS.CRITICAL) {
    logger.error('CRITICAL_DB_CONNECTION_USAGE', {
      ...baseInfo,
      message: 'Очень высокое использование connections! Риск "too many clients" error',
    });
  } else if (usagePercent > CONNECTION_THRESHOLDS.HIGH) {
    logger.warn('HIGH_DB_CONNECTION_USAGE', {
      ...baseInfo,
      message: 'Высокое использование connections. Рекомендуется проверить connection pool',
    });
  } else if (usagePercent > CONNECTION_THRESHOLDS.MODERATE) {
    logger.info('MODERATE_DB_CONNECTION_USAGE', baseInfo);
  }
}

/**
 * Мониторинг использования PostgreSQL connections
 * Логирует предупреждения при приближении к лимиту max_connections
 *
 * @param prisma - PrismaClient instance
 * @returns Статистика соединений
 *
 * @example
 * ```typescript
 * const stats = await monitorConnections(prisma);
 * console.log(`Current connections: ${stats.total}/${stats.maxConnections}`);
 * ```
 */
export async function monitorConnections(prisma: PrismaClient): Promise<ConnectionStats> {
  try {
    const [maxConnections, stateStats, appStats] = await Promise.all([
      getMaxConnections(prisma),
      getConnectionStateStats(prisma),
      getConnectionsByApplication(prisma),
    ]);

    const total = stateStats.reduce((sum: number, row: { state: string; count: bigint }) => sum + Number(row.count), 0);
    const idle = Number(stateStats.find((r: { state: string; count: bigint }) => r.state === 'idle')?.count || 0);
    const active = Number(stateStats.find((r: { state: string; count: bigint }) => r.state === 'active')?.count || 0);
    const waiting = Number(stateStats.find((r: { state: string; count: bigint }) => r.state === 'idle in transaction')?.count || 0);
    const usagePercent = (total / maxConnections) * 100;

    const stats: ConnectionStats = {
      total,
      idle,
      active,
      waiting,
      maxConnections,
      usagePercent,
      timestamp: new Date(),
      byApplication: appStats.map((row: { application_name: string; state: string; count: bigint }) => ({
        name: row.application_name,
        count: Number(row.count),
        state: row.state,
      })),
    };

    logConnectionUsage(stats);

    return stats;
  } catch (error) {
    logger.error('CONNECTION_MONITOR_ERROR', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Возвращаем fallback stats при ошибке
    const defaultMaxConnections = 100;
    return {
      total: 0,
      idle: 0,
      active: 0,
      waiting: 0,
      maxConnections: defaultMaxConnections,
      usagePercent: 0,
      timestamp: new Date(),
      byApplication: [],
    };
  }
}

/**
 * Проверяет здоровье connection pool
 * Возвращает true если использование < 70%
 */
export async function isConnectionPoolHealthy(prisma: PrismaClient): Promise<boolean> {
  const stats = await monitorConnections(prisma);
  return stats.usagePercent < CONNECTION_THRESHOLDS.HIGH;
}

/**
 * Получает детальную информацию о соединениях для debugging
 */
export async function getDetailedConnectionInfo(prisma: PrismaClient) {
  try {
    return await prisma.$queryRaw<
      Array<{
        pid: number;
        user: string;
        application_name: string;
        client_addr: string;
        state: string;
        query_start: Date;
        state_change: Date;
        wait_event_type: string | null;
        wait_event: string | null;
      }>
    >`
      SELECT 
        pid,
        usename as user,
        COALESCE(application_name, 'no-app-name') as application_name,
        COALESCE(client_addr::text, 'local') as client_addr,
        state,
        query_start,
        state_change,
        wait_event_type,
        wait_event
      FROM pg_stat_activity
      WHERE datname = current_database()
      ORDER BY state_change DESC
      LIMIT 50
    `;
  } catch (error) {
    logger.error('DETAILED_CONNECTION_INFO_ERROR', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
