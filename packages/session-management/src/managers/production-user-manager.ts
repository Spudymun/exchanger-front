import { generateSessionId } from '@repo/exchange-core';

import type {
  User,
  CreateUserData,
  UserManagerInterface,
  DatabaseAdapter,
  SessionAdapter,
  SessionMetadata,
  SessionData,
} from '../types/index.js';

export class ProductionUserManager implements UserManagerInterface {
  constructor(
    private db: DatabaseAdapter,
    private sessions: SessionAdapter
  ) {}

  // ✅ Сохраняем существующий API - совместимость с mock
  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.db.users.findByEmail(email);
    return user || undefined; // Совместимость с существующим API
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.db.users.findById(id);
    return user || undefined;
  }

  // ✅ НОВЫЙ метод для session validation с fallback на PostgreSQL
  async findBySessionId(sessionId: string): Promise<User | undefined> {
    // Сначала ищем в Redis (production way)
    const sessionData = await this.sessions.get(sessionId);

    if (sessionData && sessionData.expires_at > Date.now()) {
      const user = await this.db.users.findById(sessionData.user_id);
      return user || undefined;
    }

    // Очищаем expired session из Redis
    if (sessionData) {
      await this.sessions.delete(sessionId);
    }

    // ✅ FALLBACK: ищем в PostgreSQL Users.sessionId (development/hybrid compatibility)
    try {
      const user = await this.db.users.findBySessionId?.(sessionId);
      return user || undefined;
    } catch {
      return undefined;
    }
  }

  async create(userData: CreateUserData): Promise<User> {
    return await this.db.users.create(userData);
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    return await this.db.users.update(id, updateData);
  }

  // ✅ НОВЫЙ метод для session management
  async createSession(userId: string, metadata: SessionMetadata, ttl: number): Promise<string> {
    const sessionId = generateSessionId();
    const sessionData: SessionData = {
      user_id: userId,
      created_at: Date.now(),
      expires_at: Date.now() + ttl * 1000,
      ip: metadata.ip,
      user_agent: metadata.userAgent,
    };

    await this.sessions.set(sessionId, sessionData, ttl);
    return sessionId;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessions.delete(sessionId);
  }

  async extendSession(sessionId: string, ttl: number): Promise<void> {
    await this.sessions.extend(sessionId, ttl);
  }

  // ✅ Совместимость с существующим API
  async getAll(): Promise<User[]> {
    // В production не должен использоваться для performance
    throw new Error('getAll() not supported in production mode');
  }

  async count(): Promise<number> {
    // В production не должен использоваться
    throw new Error('count() not supported in production mode');
  }
}
