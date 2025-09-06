/**
 * Configuration types for session management
 */

export type ManagerEnvironment = 'mock' | 'development' | 'production';

export interface DatabaseConfiguration {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface RedisConfiguration {
  url: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetries?: number;
}

export interface ManagerConfiguration {
  environment?: ManagerEnvironment;
  database?: DatabaseConfiguration;
  redis?: RedisConfiguration;
}
