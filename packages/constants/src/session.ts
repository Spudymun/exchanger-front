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
    SESSION_PREFIX: 'session:',
    // ✅ TTL moved to AUTH_CONSTANTS.SESSION_MAX_AGE_SECONDS in validation.ts (avoid duplication)
    MAX_RETRIES: 3,
  } as const,

  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 5000,
  } as const,
} as const;

export type SessionEnvironment =
  (typeof SESSION_CONSTANTS.ENVIRONMENTS)[keyof typeof SESSION_CONSTANTS.ENVIRONMENTS];

export type SessionMigrationStrategy =
  (typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES)[keyof typeof SESSION_CONSTANTS.MIGRATION_STRATEGIES];
