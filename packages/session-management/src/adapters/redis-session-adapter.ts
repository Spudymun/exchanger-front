import { SESSION_CONSTANTS } from '@repo/constants';
import { Redis } from 'ioredis';

import type { SessionAdapter, SessionData } from '../types/index.js';

export class RedisSessionAdapter implements SessionAdapter {
  constructor(private redis: Redis) {}

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const key = `${SESSION_CONSTANTS.REDIS.SESSION_PREFIX}${sessionId}`;
      const data = await this.redis.get(key);

      if (!data) return null;

      const parsed = JSON.parse(data) as SessionData;

      // Проверка TTL
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
      const key = `${SESSION_CONSTANTS.REDIS.SESSION_PREFIX}${sessionId}`;
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      throw new Error(
        `Failed to store session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      const key = `${SESSION_CONSTANTS.REDIS.SESSION_PREFIX}${sessionId}`;
      await this.redis.del(key);
    } catch {
      // Delete errors are non-critical - session will expire naturally
    }
  }

  async extend(sessionId: string, ttl: number): Promise<void> {
    try {
      const key = `${SESSION_CONSTANTS.REDIS.SESSION_PREFIX}${sessionId}`;
      await this.redis.expire(key, ttl);
    } catch {
      // Extension errors are non-critical - session will work with original TTL
    }
  }
}
