import { PrismaClient } from '@prisma/client';

/**
 * Singleton instance для PrismaClient
 * ✅ ИСПРАВЛЕНО: Оптимизация создания instances согласно best practices проекта
 */
let prismaInstance: PrismaClient | null = null;

export interface PrismaClientConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

/**
 * Получает или создает singleton instance PrismaClient
 */
export function getPrismaClient(config: PrismaClientConfig): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: config.url,
        },
      },
      // ✅ Использование централизованных констант
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // ✅ Graceful shutdown handling
    const cleanup = () => {
      if (prismaInstance) {
        prismaInstance.$disconnect();
        prismaInstance = null;
      }
    };

    process.on('beforeExit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  return prismaInstance;
}

/**
 * Принудительно закрывает singleton instance (для тестов)
 */
export async function closePrismaClient(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
