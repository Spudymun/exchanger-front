import { SESSION_CONSTANTS, type ApplicationContext } from '@repo/constants';
import { Redis } from 'ioredis';

import type { SessionAdapter, SessionData } from '../types/index.js';

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
    try {
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
    } catch {
      // Redis get errors are non-critical - return null for graceful degradation
      return null;
    }
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
    try {
      const key = this.generateSessionKey(sessionId);
      await this.redis.del(key);
    } catch {
      // Delete errors are non-critical - session will expire naturally
    }
  }

  async extend(sessionId: string, ttl: number): Promise<void> {
    try {
      const key = this.generateSessionKey(sessionId);
      await this.redis.expire(key, ttl);
    } catch {
      // Extension errors are non-critical - session will work with original TTL
    }
  }
}
