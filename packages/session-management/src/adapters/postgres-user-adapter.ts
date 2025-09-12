import { PrismaClient } from '@prisma/client';

import type { User, CreateUserData } from '../types/index.js';

/**
 * ✅ Mapping для обратной совместимости при миграции данных
 */
const PRISMA_TO_PROJECT_ROLE_MAP = {
  USER: 'user' as const,
  ADMIN: 'admin' as const,
  OPERATOR: 'operator' as const,
  SUPPORT: 'support' as const,
} as const;

const PRISMA_TO_PROJECT_APP_CONTEXT_MAP = {
  WEB: 'web' as const,
  ADMIN: 'admin' as const,
} as const;

/**
 * Prisma user object with appRoles relation
 */
interface _PrismaUserWithRoles {
  id: string;
  email: string;
  hashedPassword: string | null;
  isVerified: boolean;
  role: keyof typeof PRISMA_TO_PROJECT_ROLE_MAP; // ⚠️ DEPRECATED
  createdAt: Date;
  lastLoginAt: Date | null;
  sessionId?: string | null; // ⚠️ DEPRECATED
  appRoles?: Array<{
    id: string;
    userId: string;
    applicationContext: keyof typeof PRISMA_TO_PROJECT_APP_CONTEXT_MAP;
    role: keyof typeof PRISMA_TO_PROJECT_ROLE_MAP;
    createdAt: Date;
  }>;
}

/**
 * ✅ Updated interface for new clean architecture
 */
interface PrismaUser {
  id: string;
  email: string;
  hashedPassword: string | null;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findBySessionId?(sessionId: string): Promise<User | null>;
  create(userData: CreateUserData): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
  createAppRole?(
    userId: string,
    applicationContext: 'web' | 'admin',
    role: 'user' | 'admin' | 'operator' | 'support'
  ): Promise<void>;
}

export class PostgreSQLUserAdapter implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    try {
      // Получаем пользователя и его роли отдельными запросами для временной совместимости
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      const appRoles = await this.prisma.userAppRole.findMany({
        where: { userId: user.id },
      });

      return this.mapPrismaToUserWithRoles(user as PrismaUser, appRoles);
    } catch {
      // Database errors in read operations return null for graceful degradation
      return null;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;

      const appRoles = await this.prisma.userAppRole.findMany({
        where: { userId: user.id },
      });

      return this.mapPrismaToUserWithRoles(user as PrismaUser, appRoles);
    } catch {
      return null;
    }
  }

  // ✅ УДАЛЕН: findBySessionId больше не поддерживается
  // В новой архитектуре сессии управляются через Redis/session store
  async findBySessionId(_sessionId: string): Promise<User | null> {
    // Метод удален из новой архитектуры, используйте session store
    return null;
  }

  async create(userData: CreateUserData): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          hashedPassword: userData.hashedPassword,
          isVerified: userData.isVerified ?? false,
        },
      });

      // После создания пользователя загружаем роли приложения (пока пустые)
      const appRoles = await this.prisma.userAppRole.findMany({
        where: { userId: user.id },
      });

      return this.mapPrismaToUserWithRoles(user as PrismaUser, appRoles);
    } catch (error) {
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    try {
      // ✅ Clean update data - only valid fields
      const updateData: {
        email?: string;
        hashedPassword?: string | null;
        isVerified?: boolean;
        lastLoginAt?: Date | null;
      } = {
        email: data.email,
        hashedPassword: data.hashedPassword,
        isVerified: data.isVerified,
        lastLoginAt: data.lastLoginAt,
      };

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      // После обновления пользователя загружаем роли приложения
      const appRoles = await this.prisma.userAppRole.findMany({
        where: { userId: user.id },
      });

      return this.mapPrismaToUserWithRoles(user as PrismaUser, appRoles);
    } catch {
      return null;
    }
  }

  private mapPrismaToUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      hashedPassword: prismaUser.hashedPassword ?? undefined,
      isVerified: prismaUser.isVerified,
      createdAt: prismaUser.createdAt,
      lastLoginAt: prismaUser.lastLoginAt ?? undefined,
    };
  }

  /**
   * ✅ НОВЫЙ метод для поддержки appRoles
   */
  private mapPrismaToUserWithRoles(
    prismaUser: PrismaUser,
    appRoles: Array<{
      id: string;
      userId: string;
      applicationContext: keyof typeof PRISMA_TO_PROJECT_APP_CONTEXT_MAP;
      role: keyof typeof PRISMA_TO_PROJECT_ROLE_MAP;
      createdAt: Date;
    }>
  ): User {
    const baseUser = this.mapPrismaToUser(prismaUser);

    // Преобразуем appRoles в нужный формат
    const mappedAppRoles = appRoles.map(appRole => ({
      id: appRole.id,
      userId: appRole.userId,
      applicationContext: PRISMA_TO_PROJECT_APP_CONTEXT_MAP[appRole.applicationContext],
      role: PRISMA_TO_PROJECT_ROLE_MAP[appRole.role],
      createdAt: appRole.createdAt,
    }));

    return {
      ...baseUser,
      appRoles: mappedAppRoles,
    };
  }

  /**
   * ✅ НОВЫЙ метод для создания роли приложения
   */
  async createAppRole(
    userId: string,
    applicationContext: 'web' | 'admin',
    role: 'user' | 'admin' | 'operator' | 'support'
  ): Promise<void> {
    try {
      await this.prisma.userAppRole.create({
        data: {
          userId,
          applicationContext: applicationContext === 'web' ? 'WEB' : 'ADMIN',
          role: role.toUpperCase() as 'USER' | 'ADMIN' | 'OPERATOR' | 'SUPPORT',
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to create app role: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
