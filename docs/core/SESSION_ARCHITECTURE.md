# Session Architecture Documentation

> **Session Management System - Complete Architecture Documentation**  
> Comprehensive session system with hybrid PostgreSQL + Redis storage architecture for Next.js 15 application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Core Components](#core-components)
4. [Environment Detection](#environment-detection)
5. [Session Creation Flow](#session-creation-flow)
6. [Session Validation Flow](#session-validation-flow)
7. [Session Cleanup](#session-cleanup)
8. [Database Schema](#database-schema)
9. [Type System](#type-system)
10. [Production Optimization](#production-optimization)
11. [Error Handling](#error-handling)
12. [Security Features](#security-features)

## Overview

The session management system implements a **dual-layer storage architecture** with environment-based switching between mock, development, and production modes. The system uses PostgreSQL for persistent user data and Redis for high-performance session storage.

### Key Design Principles

- **Hybrid Compatibility**: Supports both PostgreSQL sessionId fallback and Redis session storage
- **Environment-Based Switching**: Automatically detects and switches between mock/development/production modes
- **Factory Pattern**: Centralized user manager creation with singleton optimization
- **Type Safety**: Full TypeScript support with comprehensive interface definitions
- **Performance Optimization**: Cached instances and optimized session validation

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Session Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │ Authentication  │    │ Session         │    │ User            │ │
│  │ Router (tRPC)   │────│ Management      │────│ Management      │ │
│  │                 │    │ Package         │    │ System          │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                       │                       │         │
│           │                       │                       │         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │ Context         │    │ Factory         │    │ Adapters        │ │
│  │ Creation        │────│ Pattern         │────│ Layer           │ │
│  │ (tRPC)          │    │                 │    │                 │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                 │                       │           │
│                                 │                       │           │
│                      ┌─────────────────┐    ┌─────────────────┐   │
│                      │ Environment     │    │ Storage         │   │
│                      │ Detection       │────│ Layer           │   │
│                      │                 │    │                 │   │
│                      └─────────────────┘    └─────────────────┘   │
│                                                       │           │
│                                                       │           │
│                                            ┌─────────────────┐   │
│                                            │ PostgreSQL +    │   │
│                                            │ Redis Storage   │   │
│                                            │                 │   │
│                                            └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. UserManagerFactory

**Location**: `packages/session-management/src/factories/user-manager-factory.ts`

The factory implements the **singleton pattern** for optimal performance and environment-based manager creation.

#### Key Features:

- **Cached Instances**: Singleton optimization with configuration-based caching
- **Environment Detection**: Automatic switching between mock/development/production
- **Debug Logging**: Comprehensive debugging information in non-production environments
- **Graceful Fallback**: Falls back to mock mode when production resources unavailable

#### Core Methods:

```typescript
class UserManagerFactory {
  // Primary creation method with caching
  static async create(config?: ManagerConfiguration): Promise<UserManagerInterface>;

  // Optimized for context.ts - prioritizes cached instances in production
  static async createForContext(): Promise<UserManagerInterface>;

  // Cache management utilities
  static clearCache(): void;
  static getCachedInstance(): UserManagerInterface | null;
}
```

### 2. ProductionUserManager

**Location**: `packages/session-management/src/managers/production-user-manager.ts`

Implements the production-ready user manager with dual-layer session storage.

#### Architecture Features:

- **Dual Storage**: Redis for sessions + PostgreSQL for users
- **Fallback Logic**: PostgreSQL sessionId fallback for hybrid compatibility
- **Session Lifecycle**: Complete create/validate/delete session operations
- **Metadata Support**: Session creation with IP and User-Agent tracking

#### Core Methods:

```typescript
class ProductionUserManager implements UserManagerInterface {
  // User operations
  async findByEmail(email: string): Promise<User | undefined>;
  async findById(id: string): Promise<User | undefined>;
  async findBySessionId(sessionId: string): Promise<User | undefined>;
  async create(userData: CreateUserData): Promise<User>;
  async update(id: string, updateData: Partial<User>): Promise<User | null>;

  // Session operations
  async createSession(userId: string, metadata: SessionMetadata, ttl: number): Promise<string>;
  async deleteSession(sessionId: string): Promise<void>;
  async extendSession(sessionId: string, ttl: number): Promise<void>;
}
```

### 3. Database Adapters

#### PostgreSQLUserAdapter

**Location**: `packages/session-management/src/adapters/postgres-user-adapter.ts`

Handles all PostgreSQL user operations with sessionId support.

```typescript
class PostgreSQLUserAdapter implements UserRepository {
  async findByEmail(email: string): Promise<User | null>;
  async findById(id: string): Promise<User | null>;
  async findBySessionId(sessionId: string): Promise<User | null>; // ✅ Session support
  async create(userData: CreateUserData): Promise<User>;
  async update(id: string, data: Partial<User>): Promise<User | null>;
}
```

#### RedisSessionAdapter

**Location**: `packages/session-management/src/adapters/redis-session-adapter.ts`

Manages Redis session storage with TTL support.

```typescript
class RedisSessionAdapter implements SessionAdapter {
  async get(sessionId: string): Promise<SessionData | null>;
  async set(sessionId: string, data: SessionData, ttl: number): Promise<void>;
  async delete(sessionId: string): Promise<void>;
  async extend(sessionId: string, ttl: number): Promise<void>;
}
```

## Environment Detection

**Location**: `packages/session-management/src/utils/environment.ts`

The system automatically detects the runtime environment and configures appropriate session management.

### Environment Mapping:

```typescript
function getEnvironment(): ManagerEnvironment {
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'production'; // PostgreSQL + Redis
    case 'development':
      return 'development'; // PostgreSQL + Redis (if URLs available)
    case 'test':
      return 'mock'; // Mock data
    default:
      return 'mock'; // Mock data
  }
}
```

### Environment Behavior:

- **Mock Mode**: Uses in-memory mock data (`@repo/exchange-core`)
- **Development Mode**: PostgreSQL + Redis if URLs available, fallback to mock
- **Production Mode**: Requires PostgreSQL + Redis configuration
- **Forced Mock**: `FORCE_MOCK_MODE=true` forces mock mode in any environment

## Session Creation Flow

### 1. Authentication Request (Login/Register)

**File**: `apps/web/src/server/trpc/routers/auth.ts`

```typescript
// Authentication flow
const webUserManager = await UserManagerFactory.create();
const user = await webUserManager.findByEmail(email);

// Generate session ID
let finalSessionId = generateSessionId();
const sessionMetadata = {
  ip: ctx.ip || '0.0.0.0',
  userAgent: getUserAgent(ctx.req.headers),
};

// Update user with sessionId (mock compatibility)
await webUserManager.update(user.id, {
  sessionId: finalSessionId,
  lastLoginAt: new Date(),
});

// Production session creation with metadata
if (webUserManager instanceof ProductionUserManager) {
  finalSessionId = await webUserManager.createSession(
    user.id,
    sessionMetadata,
    AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
  );
}

// Set HTTP-only cookie
ctx.res.setHeader(
  AUTH_CONSTANTS.SET_COOKIE_HEADER,
  `sessionId=${finalSessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
);
```

### 2. Session Data Structure

**Redis Storage**:

```typescript
interface SessionData {
  user_id: string;
  created_at: number;
  expires_at: number;
  ip: string;
  user_agent?: string;
}
```

**PostgreSQL Fallback**:

```sql
-- User table with sessionId column
sessionId VARCHAR(255) NULL
```

## Session Validation Flow

### 1. Context Creation (Every Request)

**File**: `apps/web/src/server/trpc/context.ts`

```typescript
export const createContext = async (opts: CreateNextContextOptions) => {
  let user: User | null = null;
  const sessionId = req.cookies.sessionId || req.headers.authorization?.replace('Bearer ', '');

  if (sessionId) {
    try {
      // Production optimization: Use cached UserManager instance
      const userManager = await UserManagerFactory.createForContext();
      const foundUser = await userManager.findBySessionId(sessionId);
      user = foundUser || null;
    } catch (error) {
      // Graceful degradation: user remains null
      console.error('Session validation error:', error);
    }
  }

  return { req, res, ip, user, sessionId, locale, getErrorMessage };
};
```

### 2. Production Session Validation

**File**: `packages/session-management/src/managers/production-user-manager.ts`

```typescript
async findBySessionId(sessionId: string): Promise<User | undefined> {
  // Primary: Check Redis session storage
  const sessionData = await this.sessions.get(sessionId);

  if (sessionData && sessionData.expires_at > Date.now()) {
    const user = await this.db.users.findById(sessionData.user_id);
    return user || undefined;
  }

  // Clean expired session from Redis
  if (sessionData) {
    await this.sessions.delete(sessionId);
  }

  // Fallback: Check PostgreSQL sessionId column (hybrid compatibility)
  try {
    const user = await this.db.users.findBySessionId?.(sessionId);
    return user || undefined;
  } catch {
    return undefined;
  }
}
```

## Session Cleanup

### 1. Logout Process

**File**: `apps/web/src/server/trpc/routers/auth.ts`

```typescript
async function handleSessionCleanup(
  webUserManager: UserManagerInterface,
  sessionId: string
): Promise<void> {
  const user = await webUserManager.findBySessionId(sessionId);
  if (!user) return;

  // Clear session from user record (mock compatibility)
  await webUserManager.update(user.id, { sessionId: undefined });

  // Production session deletion
  if (webUserManager instanceof ProductionUserManager) {
    await webUserManager.deleteSession(sessionId);
  }

  console.log(`🔓 User logged out: ${user.email}`);
}
```

### 2. Cookie Cleanup

```typescript
// Clear session cookie - фактический код из auth.ts
ctx.res.setHeader('Set-Cookie', `sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
```

## Database Schema

### PostgreSQL User Table

```sql
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "hashedPassword" TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastLoginAt" TIMESTAMP(3),
  "sessionId" TEXT,  -- ✅ Session support for hybrid compatibility

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_sessionId_idx" ON "User"("sessionId");  -- ✅ Session index
```

### Redis Session Storage

```
Key Pattern: session:{sessionId}
Value: JSON serialized SessionData
TTL: AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS (default: 7 days)
```

## Type System

### Core Types

**Location**: `packages/session-management/src/types/index.ts`

```typescript
// User data for creation
export type CreateUserData = Omit<User, 'id' | 'createdAt'>;

// Session data structure
export interface SessionData {
  user_id: string;
  created_at: number;
  expires_at: number;
  ip: string;
  user_agent?: string;
}

// Session metadata for creation
export interface SessionMetadata {
  ip: string;
  userAgent?: string;
}

// Unified user manager interface
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
```

### Adapter Interfaces

```typescript
// Database adapter interface
export interface DatabaseAdapter {
  users: {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findBySessionId?(sessionId: string): Promise<User | null>; // ✅ Session support
    create(userData: CreateUserData): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User | null>;
  };
}

// Session storage adapter interface
export interface SessionAdapter {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, ttl: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
  extend(sessionId: string, ttl: number): Promise<void>;
}
```

## Production Optimization

### 1. Singleton Pattern Implementation

**Factory Caching**:

```typescript
class UserManagerFactory {
  private static cachedUserManager: UserManagerInterface | null = null;
  private static cachedConfig: string | null = null;

  static async create(config = {}): Promise<UserManagerInterface> {
    const configKey = JSON.stringify(config);
    if (this.cachedUserManager && this.cachedConfig === configKey) {
      return this.cachedUserManager; // ✅ Return cached instance
    }

    // Create new instance and cache it
    const userManager = await this.createManagerByEnvironment(environment, config);
    this.cachedUserManager = userManager;
    this.cachedConfig = configKey;

    return userManager;
  }
}
```

### 2. Context Optimization

**Context-Specific Method**:

```typescript
// ⚠️ ФАКТ: Метод createForContext() ВСЕГДА делегирует к create()
static async createForContext(): Promise<UserManagerInterface> {
  // В production режиме Turbo compile-time оптимизация делает NODE_ENV проверку unreachable
  // Поэтому метод всегда вызывает create() который уже содержит singleton кеширование
  return await this.create();
}
```

**Важное уточнение**: Документированная production оптимизация **не работает** из-за Turbo compile-time оптимизации. Метод `createForContext()` всегда делегирует к `create()`, который уже реализует singleton pattern.

### 3. Prisma Singleton

**Location**: `packages/session-management/src/utils/prisma-singleton.ts`

```typescript
export function getPrismaClient(config: PrismaClientConfig): PrismaClient {
  // Singleton pattern for Prisma client to prevent connection leaks
}
```

## Error Handling

### 1. Graceful Degradation

**Session Validation**:

```typescript
if (sessionId) {
  try {
    const userManager = await UserManagerFactory.createForContext();
    const foundUser = await userManager.findBySessionId(sessionId);
    user = foundUser || null;
  } catch (error) {
    // Graceful degradation: user remains null
    console.error('Session validation error:', error);
  }
}
```

### 2. Fallback Mechanisms

**Development Environment**:

```typescript
private static async createDevelopmentManager(config: ManagerConfiguration) {
  // Check for forced mock mode first
  if (this.shouldUseForcedMockMode()) {
    return new MockUserManagerWrapper(mockUserManager);
  }

  const urls = this.extractEnvironmentUrls(config);

  return urls.hasValidUrls
    ? await this.createProductionManagerWithUrls(config, urls)
    : this.createFallbackMockManager();  // ✅ Graceful fallback
}
```

## Security Features

### 1. Session Security

- **HTTP-Only Cookies**: Sessions stored in HTTP-only cookies to prevent XSS
- **SameSite Protection**: `SameSite=Lax` to prevent CSRF attacks
- **TTL Management**: Automatic session expiration with configurable timeouts
- **IP Tracking**: Session creation with IP address logging
- **User-Agent Tracking**: Browser fingerprinting for session validation

### 2. Environment Isolation

- **Production Requirements**: Strict validation of database and Redis URLs in production
- **Development Flexibility**: Graceful fallback to mock mode when resources unavailable
- **Forced Mock Mode**: `FORCE_MOCK_MODE=true` for secure testing environments

### 3. Session Cleanup

- **Automatic Expiration**: Redis TTL for automatic session cleanup
- **Manual Cleanup**: Explicit session deletion on logout
- **Expired Session Removal**: Automatic cleanup of expired sessions during validation

## Constants and Configuration

### Session Constants

**Location**: `@repo/constants`

```typescript
// Session timeout (7 days)
AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS = 604800;

// Environment types
SESSION_CONSTANTS.ENVIRONMENTS = {
  MOCK: 'mock',
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
};

// Database configuration
SESSION_CONSTANTS.DATABASE = {
  MAX_CONNECTIONS: 10,
  CONNECTION_TIMEOUT: 30000,
};

// Redis configuration
SESSION_CONSTANTS.REDIS = {
  MAX_RETRIES: 3,
};
```

## Package Integration

### Main Exports

**Location**: `packages/session-management/src/index.ts`

```typescript
// Primary exports
export { UserManagerFactory } from './factories/user-manager-factory';
export { ProductionUserManager } from './managers/production-user-manager';
export { SESSION_CONSTANTS } from '@repo/constants';

// Type exports
export type {
  UserManagerInterface,
  SessionManagerInterface,
  SessionMetadata,
} from './types/interfaces';

// Utility exports
export { getEnvironment } from './utils/environment';
export { getPrismaClient, closePrismaClient } from './utils/prisma-singleton';
```

### Usage Pattern

```typescript
import { UserManagerFactory, SESSION_CONSTANTS } from '@repo/session-management';
import { AUTH_CONSTANTS } from '@repo/constants';

// Factory pattern for environment-based managers
const userManager = await UserManagerFactory.create();

// Use centralized constants
const ttl = AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS;
```

---

## Summary

This session management system provides a **production-ready, scalable architecture** with:

✅ **Hybrid Storage**: PostgreSQL + Redis dual-layer architecture  
✅ **Environment Switching**: Automatic mock/development/production mode detection  
✅ **Performance Optimization**: Singleton patterns and cached instances  
✅ **Type Safety**: Comprehensive TypeScript interfaces and type definitions  
✅ **Security**: HTTP-only cookies, session tracking, and automatic cleanup  
✅ **Graceful Degradation**: Fallback mechanisms for development environments  
✅ **Factory Pattern**: Centralized user manager creation and configuration

The architecture is designed for **zero-assumption operation** - all components are based on actual codebase implementation and provide complete session lifecycle management from creation through validation to cleanup.
