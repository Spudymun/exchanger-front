import { PrismaClient } from '@prisma/client';
import { PRISMA_TO_PROJECT_ROLE_MAP, PRISMA_TO_PROJECT_APP_CONTEXT_MAP } from '@repo/constants';
import { mapApplicationContextToPrisma } from '@repo/utils';

import type { User, CreateUserData } from '../types/index';

/**
 * ✅ Clean Prisma user object with appRoles relation (deprecated fields removed)
 * Reserved for future advanced queries with joins
 */
interface _PrismaUserWithRoles {
  id: string;
  email: string;
  hashedPassword: string | null;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  appRoles?: Array<{
    id: string;
    userId: string;
    applicationContext: keyof typeof PRISMA_TO_PROJECT_APP_CONTEXT_MAP;
    role: keyof typeof PRISMA_TO_PROJECT_ROLE_MAP;
    createdAt: Date;
  }>;
}

/**
 * ✅ Simple interface for basic user operations
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

      return this.mapPrismaToUser(user as PrismaUser, appRoles);
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

      return this.mapPrismaToUser(user as PrismaUser, appRoles);
    } catch {
      return null;
    }
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

      return this.mapPrismaToUser(user as PrismaUser, appRoles);
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

      return this.mapPrismaToUser(user as PrismaUser, appRoles);
    } catch {
      return null;
    }
  }

  /**
   * Преобразует Prisma User объект в проектный User объект
   * @param prismaUser - пользователь из Prisma
   * @param appRoles - опциональные роли приложений
   * @returns User объект с базовыми данными и опциональными ролями
   */
  private mapPrismaToUser(
    prismaUser: PrismaUser,
    appRoles?: Array<{
      id: string;
      userId: string;
      applicationContext: keyof typeof PRISMA_TO_PROJECT_APP_CONTEXT_MAP;
      role: keyof typeof PRISMA_TO_PROJECT_ROLE_MAP;
      createdAt: Date;
    }>
  ): User {
    const baseUser = {
      id: prismaUser.id,
      email: prismaUser.email,
      hashedPassword: prismaUser.hashedPassword ?? undefined,
      isVerified: prismaUser.isVerified,
      createdAt: prismaUser.createdAt,
      lastLoginAt: prismaUser.lastLoginAt ?? undefined,
    };

    // Если роли не переданы, возвращаем базового пользователя
    if (!appRoles) {
      return baseUser;
    }

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
          applicationContext: mapApplicationContextToPrisma(applicationContext),
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
