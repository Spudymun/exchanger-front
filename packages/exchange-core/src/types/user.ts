export interface User {
  id: string;
  email: string;
  hashedPassword?: string;
  sessionId?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
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
