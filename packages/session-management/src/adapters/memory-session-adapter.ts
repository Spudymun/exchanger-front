import { SESSION_CONSTANTS, type ApplicationContext } from '@repo/constants';
import { gracefulHandler } from '@repo/utils';

import type { SessionAdapter, SessionData } from '../types/index';

/**
 * In-memory session adapter for development and testing when Redis is unavailable
 * ⚠️ WARNING: Data is lost on server restart - use only for development/testing
 */
export class MemorySessionAdapter implements SessionAdapter {
  // ✅ Context-aware in-memory storage
  private storage = new Map<string, { data: SessionData; expiresAt: number }>();

  constructor(private context: ApplicationContext) {}

  // ✅ Context-aware key generation (matching Redis pattern)
  private generateSessionKey(sessionId: string): string {
    const contextPrefix =
      this.context === 'web'
        ? SESSION_CONSTANTS.REDIS.WEB_SESSION_PREFIX
        : SESSION_CONSTANTS.REDIS.ADMIN_SESSION_PREFIX;
    return `${contextPrefix}${sessionId}`;
  }

  // ✅ Cleanup expired sessions
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (entry.expiresAt < now) {
        this.storage.delete(key);
      }
    }
  }

  async get(sessionId: string): Promise<SessionData | null> {
    return gracefulHandler(async () => {
      this.cleanup(); // Clean expired sessions

      const key = this.generateSessionKey(sessionId);
      const entry = this.storage.get(key);

      if (!entry) return null;

      // Double-check expiration (though cleanup should handle this)
      if (entry.expiresAt < Date.now()) {
        this.storage.delete(key);
        return null;
      }

      return entry.data;
    });
  }

  async set(sessionId: string, data: SessionData, ttl: number): Promise<void> {
    try {
      this.cleanup(); // Clean expired sessions

      const key = this.generateSessionKey(sessionId);
      const expiresAt = Date.now() + ttl * 1000; // ttl is in seconds

      this.storage.set(key, {
        data,
        expiresAt,
      });
    } catch (error) {
      throw new Error(
        `Failed to store session in memory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(sessionId: string): Promise<void> {
    await gracefulHandler(async () => {
      const key = this.generateSessionKey(sessionId);
      this.storage.delete(key);
    });
  }

  async extend(sessionId: string, ttl: number): Promise<void> {
    await gracefulHandler(async () => {
      const key = this.generateSessionKey(sessionId);
      const entry = this.storage.get(key);

      if (entry) {
        // Update expiration time
        entry.expiresAt = Date.now() + ttl * 1000;
        this.storage.set(key, entry);
      }
    });
  }

  // ✅ Development helper methods
  getStorageSize(): number {
    return this.storage.size;
  }

  clearAll(): void {
    this.storage.clear();
  }

  // ✅ Debug method for development
  getAllSessions(): Array<{ key: string; data: SessionData; expiresAt: number }> {
    this.cleanup();
    return Array.from(this.storage.entries()).map(([key, entry]) => ({
      key,
      data: entry.data,
      expiresAt: entry.expiresAt,
    }));
  }
}