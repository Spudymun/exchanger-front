import { UserRole } from '@repo/constants';

export interface User {
  id: string;
  email: string;
  hashedPassword?: string;
  sessionId?: string;
  isVerified: boolean;
  role?: UserRole; // Роль пользователя для системы доступа
  createdAt: Date;
  lastLoginAt?: Date;
}

/**
 * Extended User interface for API responses
 * Includes additional fields required by API clients
 */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password?: string;
  sessionId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
