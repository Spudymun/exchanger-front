# 🚀 Стратегия миграции Session Management: от Mock к Production

**Дата создания:** 6 сентября 2025  
**Автор:** AI Agent (Senior Analysis)  
**Статус:** 📋 Strategic Plan  
**Приоритет:** High - Architecture Foundation

## 🎯 Обзор стратегии

Данный документ описывает поэтапную миграцию системы управления сессиями от in-memory mock реализации к production-ready архитектуре с PostgreSQL + Redis, обеспечивая backward compatibility и zero downtime.

---

## 📊 Текущее состояние (Post Phase 3 Analysis)

### ✅ Что УЖЕ реализовано

- ✅ **Production адаптеры**: PostgreSQL User Adapter + Redis Session Adapter
- ✅ **Factory Pattern**: UserManagerFactory с environment switching
- ✅ **Типизация**: Unified UserManagerInterface
- ✅ **Async Context**: tRPC context готов к async operations
- ✅ **Backward Compatibility**: Mock wrapper сохраняет существующий API

### ❌ Критические проблемы исправлены

- ✅ **Дублирование кода**: Централизованный getWebUserManager в session/manager.ts
- ✅ **Import Strategy**: Правильная архитектурная изоляция
- ✅ **Type Safety**: Consistent async interfaces

---

## 🗺️ Долгосрочная стратегия миграции

### 🏗️ Phase 4: Infrastructure Consolidation (1-2 недели)

**Цели:**

- Полная интеграция Factory Pattern
- Устранение всех дубликатов кода
- Environment-based configuration

**Задачи:**

#### 4.1 Factory Integration

```typescript
// apps/web/src/server/session/manager.ts
import { UserManagerFactory } from '@repo/session-management';

export async function getWebUserManager(): Promise<UserManagerInterface> {
  // ✅ Заменить wrapper на Factory
  return UserManagerFactory.create({
    environment: process.env.SESSION_ENVIRONMENT as ManagerEnvironment,
    database: process.env.DATABASE_URL
      ? {
          url: process.env.DATABASE_URL,
        }
      : undefined,
    redis: process.env.REDIS_URL
      ? {
          url: process.env.REDIS_URL,
        }
      : undefined,
  });
}
```

#### 4.2 Environment Configuration

```bash
# .env.development.local
SESSION_ENVIRONMENT=development
DATABASE_URL=postgresql://developer:dev_password@localhost:5432/sessions_dev
REDIS_URL=redis://localhost:6379

# .env.production
SESSION_ENVIRONMENT=production
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
```

#### 4.3 Remove All Wrappers

- Удалить `createWebUserManagerWrapper` из session/manager.ts
- Использовать только Factory-created instances
- Обновить все импорты в приложении

### 🚀 Phase 5: Async UserManager Migration (2-3 недели)

**Цели:**

- Полный переход на async UserManager API
- Production-ready session operations
- Performance optimization

**Задачи:**

#### 5.1 Core Manager Async Refactor

```typescript
// packages/exchange-core/src/data/manager.ts
export const userManager = {
  // ✅ Все методы становятся async
  async findByEmail(email: string): Promise<User | undefined> {
    return users.find(u => u.email === email);
  },

  async findById(id: string): Promise<User | undefined> {
    return users.find(u => u.id === id);
  },

  async findBySessionId(sessionId: string): Promise<User | undefined> {
    return users.find(u => u.sessionId === sessionId);
  },

  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}`,
      createdAt: new Date(),
      ...userData,
    };
    users.push(user);
    return user;
  },

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    const user = users[index]!;
    Object.assign(user, updates);
    return user;
  },
};
```

#### 5.2 Context Full Async Implementation

```typescript
// apps/web/src/server/trpc/context.ts
export const createContext = async (opts: CreateNextContextOptions) => {
  if (sessionId) {
    try {
      // ✅ Full async session validation
      const sessionManager = await getWebUserManager();
      const foundUser = await sessionManager.findBySessionId(sessionId);

      if (foundUser) {
        user = foundUser;

        // ✅ Auto-extend session TTL
        if ('extendSession' in sessionManager) {
          await sessionManager.extendSession(sessionId, AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS);
        }
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }
};
```

#### 5.3 Production Session Operations

```typescript
// apps/web/src/server/trpc/routers/auth.ts
export const authRouter = createTRPCRouter({
  register: rateLimitMiddleware.register
    .input(fullySecurityEnhancedRegisterSchema)
    .mutation(async ({ input, ctx }) => {
      const webUserManager = await getWebUserManager();

      // ✅ Create user
      const user = await webUserManager.create({
        email: sanitizedEmail,
        hashedPassword,
        isVerified: false,
      });

      // ✅ Production session creation
      let sessionId: string;
      if ('createSession' in webUserManager) {
        // Production: separate session storage
        sessionId = await webUserManager.createSession(
          user.id,
          { ip: ctx.ip, userAgent: getUserAgent(ctx.req.headers) },
          AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS
        );
      } else {
        // Mock: sessionId в User объект
        sessionId = generateSessionId();
        await webUserManager.update(user.id, { sessionId });
      }

      // Set cookie
      ctx.res.setHeader(
        'Set-Cookie',
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS}; SameSite=Lax`
      );

      return { user, sessionId };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const sessionId = ctx.req.cookies.sessionId;

    if (sessionId) {
      const webUserManager = await getWebUserManager();

      // ✅ Production session cleanup
      if ('deleteSession' in webUserManager) {
        await webUserManager.deleteSession(sessionId);
      } else {
        // Mock: clear sessionId
        const user = await webUserManager.findBySessionId(sessionId);
        if (user) {
          await webUserManager.update(user.id, { sessionId: undefined });
        }
      }
    }

    // Clear cookie
    ctx.res.setHeader('Set-Cookie', `sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
    return { message: 'Logout successful' };
  }),
});
```

### 🏭 Phase 6: Production Deployment (3-4 недели)

**Цели:**

- Production infrastructure setup
- Monitoring и logging
- Performance optimization

**Задачи:**

#### 6.1 Docker Production Setup

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: >
      redis-server 
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

  web:
    build: ./apps/web
    environment:
      SESSION_ENVIRONMENT: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - '3000:3000'
```

#### 6.2 Monitoring & Logging

```typescript
// packages/session-management/src/adapters/redis-session-adapter.ts
export class RedisSessionAdapter implements SessionAdapter {
  async get(sessionId: string): Promise<SessionData | null> {
    const startTime = Date.now();
    try {
      const result = await this.redis.get(`session:${sessionId}`);

      // ✅ Performance monitoring
      console.log(`Redis GET: ${Date.now() - startTime}ms`);

      return result ? JSON.parse(result) : null;
    } catch (error) {
      // ✅ Error tracking
      console.error('Redis GET error:', error);
      return null;
    }
  }
}
```

#### 6.3 Performance Optimization

```typescript
// Connection pooling and caching
export class UserManagerFactory {
  private static instances = new Map<string, UserManagerInterface>();

  static create(config: ManagerConfiguration): UserManagerInterface {
    const cacheKey = JSON.stringify(config);

    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    const instance = this.createInstance(config);
    this.instances.set(cacheKey, instance);
    return instance;
  }
}
```

---

## ⚡ Backward Compatibility Strategy

### 🔄 Gradual Migration Approach

#### 1. Interface Consistency

```typescript
// ✅ Один интерфейс для всех implementation
interface UserManagerInterface {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  findBySessionId(sessionId: string): Promise<User | undefined>;
  // ... остальные методы
}
```

#### 2. Environment-based Switching

```typescript
// ✅ Zero-config switching между mock и production
const userManager = UserManagerFactory.create({
  environment: process.env.SESSION_ENVIRONMENT || 'mock',
  // Если нет config - автоматически mock
});
```

#### 3. Graceful Degradation

```typescript
// ✅ Production methods опциональны
if ('createSession' in userManager) {
  await userManager.createSession(userId, metadata, ttl);
} else {
  // Fallback to mock behavior
  const sessionId = generateSessionId();
  await userManager.update(userId, { sessionId });
}
```

---

## 📋 Migration Checklist

### Phase 4 Checklist

- [ ] Интеграция UserManagerFactory в getWebUserManager
- [ ] Environment configuration в .env файлах
- [ ] Удаление всех wrapper функций
- [ ] Обновление документации

### Phase 5 Checklist

- [ ] Async refactor core userManager
- [ ] Full async context implementation
- [ ] Production session operations в auth router
- [ ] Session TTL extension logic
- [ ] Comprehensive error handling

### Phase 6 Checklist

- [ ] Production Docker setup
- [ ] Monitoring и performance tracking
- [ ] Load testing session operations
- [ ] Security audit
- [ ] Documentation для operations team

---

## 🚨 Risk Mitigation

### Технические риски

- **Database connection issues** → Connection pooling + retry logic
- **Redis downtime** → Graceful degradation to mock mode
- **Session corruption** → Validation layer + auto-cleanup

### Business риски

- **User logout на миграции** → Zero-downtime strategy
- **Session loss** → Session migration utility
- **Performance degradation** → Load testing + monitoring

---

## 🎯 Success Metrics

- **Zero downtime** миграция
- **100% backward compatibility** в переходный период
- **<100ms** session validation time
- **99.9%** session reliability
- **Complete elimination** дублирования кода

---

## 📈 Timeline Summary

| Phase       | Duration  | Focus                        | Deliverable         |
| ----------- | --------- | ---------------------------- | ------------------- |
| **Phase 4** | 1-2 weeks | Infrastructure Consolidation | Factory Integration |
| **Phase 5** | 2-3 weeks | Async Migration              | Full Async API      |
| **Phase 6** | 3-4 weeks | Production Setup             | Deployed System     |

**Total Timeline:** 6-9 weeks для полной миграции

---

_Документ будет обновляться по мере продвижения миграции._
