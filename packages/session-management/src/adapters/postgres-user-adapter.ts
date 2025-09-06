import { PrismaClient } from '@prisma/client';

import type { User, CreateUserData } from '../types/index.js';

/**
 * ✅ ИСПРАВЛЕНО: Mapping между Prisma enum и project UserRole
 */
const PRISMA_TO_PROJECT_ROLE_MAP = {
  USER: 'user' as const,
  ADMIN: 'admin' as const,
  OPERATOR: 'operator' as const,
  SUPPORT: 'support' as const,
} as const;

const PROJECT_TO_PRISMA_ROLE_MAP = {
  user: 'USER' as const,
  admin: 'ADMIN' as const,
  operator: 'OPERATOR' as const,
  support: 'SUPPORT' as const,
} as const;

/**
 * Строго типизированный интерфейс Prisma User
 * ✅ ИСПРАВЛЕНО: Используем правильные типы для role mapping
 */
interface PrismaUser {
  id: string;
  email: string;
  hashedPassword: string | null;
  isVerified: boolean;
  role: keyof typeof PRISMA_TO_PROJECT_ROLE_MAP;
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(userData: CreateUserData): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User | null>;
}

export class PostgreSQLUserAdapter implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user ? this.mapPrismaToUser(user as PrismaUser) : null;
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

      return user ? this.mapPrismaToUser(user as PrismaUser) : null;
    } catch {
      return null;
    }
  }

  async create(userData: CreateUserData): Promise<User> {
    try {
      // ✅ ИСПРАВЛЕНО: Преобразуем role из project type в Prisma enum
      const prismaRole = userData.role
        ? PROJECT_TO_PRISMA_ROLE_MAP[userData.role as keyof typeof PROJECT_TO_PRISMA_ROLE_MAP]
        : 'USER';

      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          hashedPassword: userData.hashedPassword,
          isVerified: userData.isVerified ?? false,
          role: prismaRole,
        },
      });

      return this.mapPrismaToUser(user as PrismaUser);
    } catch (error) {
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    try {
      // ✅ ИСПРАВЛЕНО: Типизированный объект для update
      const updateData: {
        email?: string;
        hashedPassword?: string | null;
        isVerified?: boolean;
        lastLoginAt?: Date | null;
        role?: keyof typeof PRISMA_TO_PROJECT_ROLE_MAP;
      } = {
        email: data.email,
        hashedPassword: data.hashedPassword,
        isVerified: data.isVerified,
        lastLoginAt: data.lastLoginAt,
      };

      if (data.role) {
        updateData.role =
          PROJECT_TO_PRISMA_ROLE_MAP[data.role as keyof typeof PROJECT_TO_PRISMA_ROLE_MAP];
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return this.mapPrismaToUser(user as PrismaUser);
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
      // ✅ ИСПРАВЛЕНО: Преобразуем Prisma enum в project UserRole
      role: PRISMA_TO_PROJECT_ROLE_MAP[prismaUser.role],
      createdAt: prismaUser.createdAt,
      lastLoginAt: prismaUser.lastLoginAt ?? undefined,
    };
  }
}
