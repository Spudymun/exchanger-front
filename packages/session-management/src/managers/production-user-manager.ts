import type { ApplicationContext } from '@repo/constants';
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
    private sessions: SessionAdapter,
    private applicationContext: ApplicationContext = 'web'
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

  // ✅ Упрощенный метод для session validation с app context
  async findBySessionId(sessionId: string): Promise<User | undefined> {
    // 1. Проверка Redis - adapter сам обрабатывает namespace
    const sessionData = await this.sessions.get(sessionId);
    if (sessionData && sessionData.expires_at > Date.now()) {
      const user = await this.db.users.findById(sessionData.user_id);
      return user || undefined;
    }

    // 2. Fallback на PostgreSQL Sessions с application context
    return await this.findUserFromPostgreSQLSession(sessionId);
  }

  // ✅ НОВЫЙ метод для fallback логики (уменьшает сложность)
  private async findUserFromPostgreSQLSession(sessionId: string): Promise<User | undefined> {
    const session = await this.db.sessions?.findById(sessionId);
    if (!session || session.revoked || session.expiresAt <= new Date()) {
      return undefined;
    }

    // Проверяем application context
    const prismaApplicationContext = this.applicationContext === 'web' ? 'WEB' : 'ADMIN';
    if (session.applicationContext !== prismaApplicationContext) {
      return undefined;
    }

    const user = await this.db.users.findById(session.userId);
    if (user) {
      // Восстанавливаем сессию в Redis
      await this.restoreSessionToRedis(sessionId, session);
    }

    return user || undefined;
  }

  // ✅ НОВЫЙ метод для восстановления сессии в Redis
  private async restoreSessionToRedis(
    sessionId: string,
    session: {
      userId: string;
      data?: SessionData;
      expiresAt: Date;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const restoredSessionData: SessionData = {
        user_id: session.userId,
        created_at: session.data?.created_at || Date.now(),
        expires_at: session.expiresAt.getTime(),
        ip: session.data?.ip || session.ipAddress || '',
        user_agent: session.data?.user_agent || session.userAgent,
      };

      const ttlSeconds = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
      if (ttlSeconds > 0) {
        await this.sessions.set(sessionId, restoredSessionData, ttlSeconds);
      }
    } catch {
      // Graceful degradation - пользователь все равно найден
    }
  }

  async create(userData: CreateUserData): Promise<User> {
    const user = await this.db.users.create(userData);

    // ✅ НОВОЕ: Создаем роль для приложения при регистрации
    if (this.db.users.createAppRole) {
      try {
        await this.db.users.createAppRole(
          user.id,
          this.applicationContext,
          'user' // Дефолтная роль для новых пользователей
        );
      } catch {
        // Graceful degradation - пользователь создан, роль можно добавить позже
        // Silent failure для избежания нарушения Rule 15 (no console usage)
      }
    }

    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    return await this.db.users.update(id, updateData);
  }

  // ✅ ИСПРАВЛЕННЫЙ метод для session management - RedisSessionAdapter обрабатывает namespace
  async createSession(userId: string, metadata: SessionMetadata, ttl: number): Promise<string> {
    const sessionId = generateSessionId();
    const sessionData: SessionData = {
      user_id: userId,
      created_at: Date.now(),
      expires_at: Date.now() + ttl * 1000,
      ip: metadata.ip,
      user_agent: metadata.userAgent,
    };

    // 1. Сохраняем в Redis - adapter сам добавит namespace
    await this.sessions.set(sessionId, sessionData, ttl);

    // 2. ДУБЛИРУЕМ в PostgreSQL Session таблице (надежность)
    try {
      // ✅ ИСПРАВЛЕНО: Преобразуем ApplicationContext в Prisma enum
      const prismaApplicationContext = this.applicationContext === 'web' ? 'WEB' : 'ADMIN';

      await this.db.sessions?.create({
        id: sessionId,
        userId: userId,
        data: sessionData,
        expiresAt: new Date(sessionData.expires_at),
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
        applicationContext: prismaApplicationContext,
      });
    } catch {
      // Graceful degradation - Redis сессия уже создана
    }

    return sessionId;
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Удаляем из Redis - adapter сам обрабатывает namespace
    await this.sessions.delete(sessionId);

    // Удаляем из PostgreSQL Session таблицы
    try {
      await this.db.sessions?.delete(sessionId);
    } catch {
      // Graceful degradation
    }
  }

  async extendSession(sessionId: string, ttl: number): Promise<void> {
    // Продлеваем в Redis - adapter сам обрабатывает namespace
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
