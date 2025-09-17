import { SESSION_CONSTANTS, type ApplicationContext } from '@repo/constants';
import { gracefulHandler } from '@repo/utils';

import type { SessionAdapter, SessionData } from '../types/index';

// ✅ Dynamic type import для Redis для избежания проблем с Turbopack
interface Redis {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<'OK'>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

export class RedisSessionAdapter implements SessionAdapter {
  // ✅ Context теперь обязательный - session prefixes всегда контекстные
  constructor(
    private redis: Redis,
    private context: ApplicationContext
  ) {}

  // ✅ Context-aware key generation
  private generateSessionKey(sessionId: string): string {
    // Новая схема: всегда используем контекстные префиксы
    const contextPrefix =
      this.context === 'web'
        ? SESSION_CONSTANTS.REDIS.WEB_SESSION_PREFIX
        : SESSION_CONSTANTS.REDIS.ADMIN_SESSION_PREFIX;
    return `${contextPrefix}${sessionId}`;
  }

  async get(sessionId: string): Promise<SessionData | null> {
    return gracefulHandler(async () => {
      const key = this.generateSessionKey(sessionId);
      const data = await this.redis.get(key);

      if (!data) return null;

      const parsed = JSON.parse(data) as SessionData;

      // Проверка TTL остается без изменений
      if (parsed.expires_at < Date.now()) {
        await this.delete(sessionId);
        return null;
      }

      return parsed;
    });
  }

  async set(sessionId: string, data: SessionData, ttl: number): Promise<void> {
    try {
      const key = this.generateSessionKey(sessionId);
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      throw new Error(
        `Failed to store session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(sessionId: string): Promise<void> {
    await gracefulHandler(async () => {
      const key = this.generateSessionKey(sessionId);
      await this.redis.del(key);
    });
  }

  async extend(sessionId: string, ttl: number): Promise<void> {
    await gracefulHandler(async () => {
      const key = this.generateSessionKey(sessionId);
      await this.redis.expire(key, ttl);
    });
  }
}
