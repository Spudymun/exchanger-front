import { UserRole, type ApplicationContext } from '@repo/constants';

// ✅ НОВЫЙ интерфейс для app roles
export interface UserAppRole {
  id: string;
  userId: string;
  applicationContext: ApplicationContext;
  role: UserRole;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  hashedPassword?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;

  // ✅ App-specific roles - replaces deprecated global 'role' field
  appRoles?: UserAppRole[];
}

// ✅ HELPER METHODS for User (можно добавить в utils)
export interface UserHelpers {
  getRoleForApp(user: User, context: ApplicationContext): UserRole | null;
  hasAccessToApp(user: User, context: ApplicationContext): boolean;
  addAppRole(user: User, context: ApplicationContext, role: UserRole): UserAppRole;
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
