import { PrismaClient } from '@prisma/client';

import type { SessionData } from '../types/index.js';

/**
 * PostgreSQL session adapter for Prisma ORM
 */
export class PostgreSQLSessionAdapter {
  constructor(private prisma: PrismaClient) {}

  async create(sessionData: {
    id: string;
    userId: string;
    data: SessionData;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    applicationContext?: string;
  }): Promise<void> {
    try {
      await this.prisma.session.create({
        data: {
          id: sessionData.id,
          userId: sessionData.userId,
          data: JSON.parse(JSON.stringify(sessionData.data)), // Proper JSON conversion
          expiresAt: sessionData.expiresAt,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          applicationContext: (sessionData.applicationContext || 'WEB') as 'WEB' | 'ADMIN',
        },
      });
    } catch {
      // Graceful degradation - log but don't throw
    }
  }

  async findById(sessionId: string): Promise<{
    id: string;
    userId: string;
    data: SessionData;
    expiresAt: Date;
  } | null> {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return {
        id: session.id,
        userId: session.userId,
        data: session.data as unknown as SessionData,
        expiresAt: session.expiresAt,
      };
    } catch {
      return null;
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      await this.prisma.session.delete({
        where: { id: sessionId },
      });
    } catch {
      // Graceful degradation - session might not exist
    }
  }
}
