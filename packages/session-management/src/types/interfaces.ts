import type { User } from '@repo/exchange-core';

// ✅ CreateUserData defined in ./index.ts (avoid duplication - Rule 20)
import type { CreateUserData } from './index.js';

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
    create(userData: CreateUserData): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User | null>;
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
 * Session manager interface for session operations
 */
export interface SessionManagerInterface {
  create(userId: string, metadata: SessionMetadata, ttl: number): Promise<string>;
  get(sessionId: string): Promise<SessionData | null>;
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
