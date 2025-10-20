import { HTTP_STATUS } from '@repo/constants';
import {
  getPrismaClient,
  monitorConnections,
  isConnectionPoolHealthy,
  type PrismaClientConfig,
} from '@repo/session-management';
import { createEnvironmentLogger } from '@repo/utils';
import { NextResponse } from 'next/server';

const logger = createEnvironmentLogger('web-health-check');

interface DatabaseCheck {
  status: 'up' | 'down';
  responseTime?: number;
  connectionPool?: {
    total: number;
    active: number;
    idle: number;
    usagePercent: number;
  };
  poolHealthy?: boolean;
  error?: string;
}

interface RedisCheck {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: DatabaseCheck;
    redis: RedisCheck;
  };
}

/**
 * Проверяет состояние PostgreSQL database через Prisma
 */
async function checkDatabaseHealth(): Promise<DatabaseCheck> {
  const dbCheckStart = Date.now();
  const prismaConfig: PrismaClientConfig = {
    url: process.env.DATABASE_URL || '',
    appName: 'exchanger-web-health',
  };

  const prisma = getPrismaClient(prismaConfig);
  await prisma.$queryRaw`SELECT 1 as health_check`;

  const dbResponseTime = Date.now() - dbCheckStart;
  const connectionStats = await monitorConnections(prisma);
  const poolHealthy = await isConnectionPoolHealthy(prisma);

  return {
    status: 'up',
    responseTime: dbResponseTime,
    connectionPool: {
      total: connectionStats.total,
      active: connectionStats.active,
      idle: connectionStats.idle,
      usagePercent: Math.round(connectionStats.usagePercent * 100) / 100,
    },
    poolHealthy,
  };
}

/**
 * Проверяет состояние Redis connection
 */
async function checkRedisHealth(): Promise<RedisCheck> {
  const redisCheckStart = Date.now();
  const Redis = (await import('ioredis')).default;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL not configured');
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  await redis.ping();
  const redisResponseTime = Date.now() - redisCheckStart;
  await redis.quit();

  return {
    status: 'up',
    responseTime: redisResponseTime,
  };
}

/**
 * Обрабатывает результат проверки database
 */
function handleDatabaseResult(
  healthData: HealthStatus,
  dbResult: DatabaseCheck
): void {
  healthData.checks.database = dbResult;

  if (dbResult.poolHealthy === false) {
    healthData.status = 'degraded';
    logger.warn('DATABASE_POOL_DEGRADED', {
      usagePercent: dbResult.connectionPool?.usagePercent,
      active: dbResult.connectionPool?.active,
      total: dbResult.connectionPool?.total,
    });
  }
}

/**
 * Обрабатывает ошибку проверки database
 */
function handleDatabaseError(healthData: HealthStatus, error: unknown): void {
  healthData.checks.database = {
    status: 'down',
    error: error instanceof Error ? error.message : 'Unknown error',
  };
  healthData.status = 'unhealthy';
  logger.error('DATABASE_CHECK_FAILED', {
    error: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Обрабатывает ошибку проверки Redis
 */
function handleRedisError(healthData: HealthStatus, error: unknown): void {
  healthData.checks.redis = {
    status: 'down',
    error: error instanceof Error ? error.message : 'Unknown error',
  };

  if (healthData.status === 'healthy') {
    healthData.status = 'degraded';
  }

  logger.warn('REDIS_CHECK_FAILED', {
    error: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Определяет HTTP status code по состоянию health
 */
function getStatusCode(status: HealthStatus['status']): number {
  if (status === 'unhealthy') {
    return HTTP_STATUS.SERVICE_UNAVAILABLE;
  }
  return HTTP_STATUS.OK;
}

/**
 * Health Check Endpoint для Web Application
 *
 * Используется Docker Compose для проверки готовности сервиса
 * Проверяет Database, Redis и Connection Pool
 */
export async function GET() {
  const startTime = Date.now();
  const healthData: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'exchanger-web',
    version: '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: { status: 'down' },
      redis: { status: 'down' },
    },
  };

  try {
    // Database check
    try {
      const dbResult = await checkDatabaseHealth();
      handleDatabaseResult(healthData, dbResult);
    } catch (error) {
      handleDatabaseError(healthData, error);
    }

    // Redis check
    try {
      const redisResult = await checkRedisHealth();
      healthData.checks.redis = redisResult;
    } catch (error) {
      handleRedisError(healthData, error);
    }

    logger.info('HEALTH_CHECK_COMPLETED', {
      status: healthData.status,
      responseTime: Date.now() - startTime,
      database: healthData.checks.database.status,
      redis: healthData.checks.redis.status,
    });

    return NextResponse.json(healthData, { status: getStatusCode(healthData.status) });
  } catch (error) {
    logger.error('HEALTH_CHECK_ERROR', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

