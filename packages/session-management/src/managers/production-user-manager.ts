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

  // ✅ Упрощенный метод для session validation
  async findBySessionId(sessionId: string): Promise<User | undefined> {
    // 1. Проверка Redis
    const sessionData = await this.sessions.get(sessionId);
    if (sessionData && sessionData.expires_at > Date.now()) {
      const user = await this.db.users.findById(sessionData.user_id);
      return user || undefined;
    }

    // 2. Fallback на PostgreSQL Users.sessionId
    const user = await this.db.users.findBySessionId?.(sessionId);
    return user || undefined;
  }

  async create(userData: CreateUserData): Promise<User> {
    return await this.db.users.create(userData);
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    return await this.db.users.update(id, updateData);
  }

  // ✅ ИСПРАВЛЕННЫЙ метод для session management - сохраняем в ОБЕИХ системах
  async createSession(userId: string, metadata: SessionMetadata, ttl: number): Promise<string> {
    const sessionId = generateSessionId();
    const sessionData: SessionData = {
      user_id: userId,
      created_at: Date.now(),
      expires_at: Date.now() + ttl * 1000,
      ip: metadata.ip,
      user_agent: metadata.userAgent,
    };

    // 1. Сохраняем в Redis (быстрый доступ)
    await this.sessions.set(sessionId, sessionData, ttl);

    // 2. ДУБЛИРУЕМ в PostgreSQL Session таблице (надежность)
    try {
      await this.db.sessions?.create({
        id: sessionId,
        userId: userId,
        data: sessionData,
        expiresAt: new Date(sessionData.expires_at),
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
        applicationContext: 'WEB', // default context
      });
    } catch {
      // Graceful degradation - Redis сессия уже создана
    }

    return sessionId;
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Удаляем из Redis
    await this.sessions.delete(sessionId);

    // Удаляем из PostgreSQL Session таблицы
    try {
      await this.db.sessions?.delete(sessionId);
    } catch {
      // Graceful degradation
    }
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
