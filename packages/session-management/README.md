# Session Management Package

Production-ready session management with Redis/PostgreSQL adapters.

## Recent Changes (Rule 20 Compliance)

### Removed Duplications:

- **TTL Constants**: Use `AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS` from `@repo/constants/validation` instead of `SESSION_CONSTANTS.REDIS.DEFAULT_TTL`
- **CreateUserData Type**: Single definition in `./src/types/index.ts` (was duplicated in interfaces.ts)
- **Dependencies**: Fixed syntax from `workspace:*` to `"*"` (project standard)

## Usage

```typescript
import { UserManagerFactory, SESSION_CONSTANTS } from '@repo/session-management';
import { AUTH_CONSTANTS } from '@repo/constants';

// ✅ Use AUTH_CONSTANTS for TTL
const ttl = AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS;

// ✅ Factory pattern for environment-based managers
const userManager = UserManagerFactory.create(environment);
```

## Architecture

- **Factory Pattern**: Environment-based user manager creation
- **Async Wrapper**: Smooth transition from sync to async managers
- **Centralized Constants**: No duplication across packages
