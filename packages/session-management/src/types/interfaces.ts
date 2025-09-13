import type { User } from '@repo/exchange-core';

// ✅ CreateUserData defined in ./types.ts (avoid duplication - Rule 20)
import type { CreateUserData } from './types.js';

// Re-export User type for convenience
export type { User, CreateUserData };

/**
 * Session data structure for production storage
 */
export interface SessionData {
  user_id: string;
  created_at: number;
  expires_at: number;
  ip: string;
  user_agent?: string;
}

/**
 * Session metadata for creation
 */
export interface SessionMetadata {
  ip: string;
  userAgent?: string;
}

/**
 * Database adapter interface for user operations
 */
export interface DatabaseAdapter {
  users: {
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
  };
  sessions?: {
    create(sessionData: {
      id: string;
      userId: string;
      data: SessionData;
      expiresAt: Date;
      ipAddress?: string;
      userAgent?: string;
      applicationContext?: string;
    }): Promise<void>;
    findById(sessionId: string): Promise<{
      id: string;
      userId: string;
      data: SessionData;
      expiresAt: Date;
      applicationContext?: string;
      revoked?: boolean;
      revokedAt?: Date;
      ipAddress?: string;
      userAgent?: string;
    } | null>;
    delete(sessionId: string): Promise<void>;
  };
}

/**
 * Session storage adapter interface
 */
export interface SessionAdapter {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, ttl: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
  extend(sessionId: string, ttl: number): Promise<void>;
}

/**
 * Unified user manager interface supporting both mock and production modes
 */
export interface UserManagerInterface {
  // Core user operations
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  findBySessionId(sessionId: string): Promise<User | undefined>;
  create(userData: CreateUserData): Promise<User>;
  update(id: string, updateData: Partial<User>): Promise<User | null>;

  // Session operations (production-specific)
  createSession?(userId: string, metadata: SessionMetadata, ttl: number): Promise<string>;
  deleteSession?(sessionId: string): Promise<void>;
  extendSession?(sessionId: string, ttl: number): Promise<void>;

  // Mock compatibility methods
  getAll(): Promise<User[]>;
  count(): Promise<number>;
}
