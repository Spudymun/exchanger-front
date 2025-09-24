# Session Management Package

Production-ready session management system with dual Redis/PostgreSQL storage and factory pattern for scalable user management.

## Quick Start

### Database Commands

Run these commands from the **root** of the monorepo:

```bash
# Reset specific application data
npm run db:reset:web      # Reset only web app users/sessions
npm run db:reset:admin    # Reset only admin app users/sessions
npm run db:reset:all      # Full database reset (all apps)

# Database management
npm run db:studio         # Open Prisma Studio
npm run db:generate       # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run database migrations
```

### Basic Usage

```typescript
import { UserManagerFactory } from '@repo/session-management';

// Create user manager for current environment
const userManager = await UserManagerFactory.create();

// Create user with session
const user = await userManager.create({
  email: 'user@example.com',
  name: 'John Doe',
});

// Create session
const sessionId = await userManager.createSession(
  user.id,
  {
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0...',
  },
  3600
); // TTL in seconds
```

## Architecture

### Dual Storage System

- **Redis**: Primary session storage (fast access)
- **PostgreSQL**: Fallback storage (reliability)

### Factory Pattern

- **Environment Detection**: Automatically selects appropriate manager
- **Mock/Production**: Seamless switching for testing
- **Type Safety**: Full TypeScript support

### Clean Type System

```typescript
// All types available from single import
import type {
  SessionData,
  SessionMetadata,
  UserManagerInterface,
  CreateUserData,
  ManagerEnvironment,
} from '@repo/session-management';
```

## Package Structure

```
src/
├── types/           # TypeScript definitions
│   ├── index.ts     # Re-exports (single entry point)
│   ├── interfaces.ts # Interface definitions
│   ├── types.ts     # Type aliases
│   └── config.ts    # Configuration types
├── factories/       # Factory pattern implementation
├── managers/        # User managers (mock/production)
├── adapters/        # Database & Redis adapters
└── utils/          # Utilities & helpers

scripts/
└── reset/          # Database reset scripts
    ├── web-reset.sql    # Web app reset
    ├── admin-reset.sql  # Admin app reset
    └── full-reset.sql   # Complete reset
```

## Environment Variables

Ensure your `.env` file contains:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"
REDIS_URL="redis://localhost:6379"
```

## Testing

```bash
# Run tests for this package
npm test -- --filter=session-management

# Run with coverage
npm run test:coverage -- --filter=session-management
```

## Turbopack Support 🚀

### Automatic Fallback for Development

В Turbopack режиме (Next.js 15 dev mode), когда Redis недоступен из-за server/client bundle изоляции, автоматически активируется **MemorySessionAdapter**:

```typescript
// ✅ В Production (webpack)
Redis доступен → RedisSessionAdapter → сессии в Redis

// ✅ В Development (Turbopack)  
Redis → empty.js → MemorySessionAdapter → сессии в RAM
```

### Возможности MemorySessionAdapter

- **Полная эмуляция Redis API**: get, set, delete, extend
- **Context-aware storage**: session:web:*, session:admin:*
- **TTL поддержка**: автоматическая очистка просроченных сессий
- **Debug методы**: для разработки и отладки
- **Graceful degradation**: полная функциональность без Redis

### Ограничения в Development

⚠️ **Данные теряются при рестарте** `npm run dev`  
⚠️ **Нет distributed access** между процессами  
✅ **Приемлемо для development** - логин/сессии работают полноценно

Подробнее: `docs/troubleshooting/turbopack-ioredis-leak.md`

## Development

This package follows the monorepo architecture with:

- ✅ **No type duplication** (Rule 20 compliance)
- ✅ **Clean imports** from single entry point
- ✅ **Environment-based configuration**
- ✅ **TypeScript strict mode**
- ✅ **Turbopack compatibility** with automatic fallback
