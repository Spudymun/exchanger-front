export const SESSION_CONSTANTS = {
  ENVIRONMENTS: {
    MOCK: 'mock',
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
  } as const,

  MIGRATION_STRATEGIES: {
    MOCK_ONLY: 'mock-only',
    PRODUCTION_ONLY: 'production-only',
    GRADUAL: 'gradual',
    WRITE_THROUGH: 'mock-with-write-through',
  } as const,

  REDIS: {
    // ✅ TTL moved to AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS in validation.ts (avoid duplication)
    MAX_RETRIES: 3,
    // ✅ Direct prefixes for multi-app namespace
    WEB_SESSION_PREFIX: 'session:web:',
    ADMIN_SESSION_PREFIX: 'session:admin:',
  } as const,

  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 5000,
  } as const,

  // ✅ НОВЫЕ константы для application context
  APPLICATION_CONTEXT: {
    WEB: 'web',
    ADMIN: 'admin',
  } as const,
} as const;

export type SessionEnvironment =
  (typeof SESSION_CONSTANTS.ENVIRONMENTS)[keyof typeof SESSION_CONSTANTS.ENVIRONMENTS];

export type SessionMigrationStrategy =
  (typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES)[keyof typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES];

// ✅ НОВЫЙ тип для application context
export type ApplicationContext =
  (typeof SESSION_CONSTANTS.APPLICATION_CONTEXT)[keyof typeof SESSION_CONSTANTS.APPLICATION_CONTEXT];
