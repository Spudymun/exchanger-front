import { AUTH_CONSTANTS } from '@repo/constants';
import type { User } from '@repo/exchange-core';
import type { SessionMetadata, UserManagerInterface } from '@repo/session-management';
import { createEnvironmentLogger } from '@repo/utils';

// Constants from centralized AUTH_CONSTANTS
const {
  SESSION_MAX_AGE_SECONDS: DEFAULT_SESSION_TTL,
  SESSION_ID_LOG_LENGTH,
  LOG_TRUNCATE_START,
} = AUTH_CONSTANTS;

export interface AutoRegistrationResult {
  user: User;
  sessionId: string;
  isNewUser: boolean;
}

/**
 * ✅ AutoRegistrationService for AC2.1A requirements
 * Ensures every order has an associated user and session
 * Follows existing business patterns from session-management
 */
export class AutoRegistrationService {
  private logger = createEnvironmentLogger('AutoRegistrationService');

  constructor(private userManager: UserManagerInterface) {}

  async ensureUserWithSession(
    email: string,
    sessionMetadata: SessionMetadata
  ): Promise<AutoRegistrationResult> {
    try {
      this.logger.info('Ensuring user with session', { email });

      // 1. Get or create user
      const { user, isNewUser } = await this.getOrCreateUser(email);

      // 2. Create session
      const sessionId = await this.createUserSession(user.id, sessionMetadata);

      this.logger.info('User session created successfully', {
        userId: user.id,
        isNewUser,
        sessionId: sessionId.substring(LOG_TRUNCATE_START, SESSION_ID_LOG_LENGTH) + '...',
      });

      return { user, sessionId, isNewUser };
    } catch (error) {
      this.logger.error('AutoRegistrationService.ensureUserWithSession failed', {
        error: error instanceof Error ? error.message : String(error),
        email,
      });
      throw new Error(
        `Failed to ensure user with session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async getOrCreateUser(email: string): Promise<{ user: User; isNewUser: boolean }> {
    let user = await this.userManager.findByEmail(email);
    let isNewUser = false;

    if (!user) {
      this.logger.info('Auto-registration for new user', { email });

      user = await this.userManager.create({
        email,
        hashedPassword: undefined,
        isVerified: false,
      });

      isNewUser = true;
    }

    return { user, isNewUser };
  }

  private async createUserSession(
    userId: string,
    sessionMetadata: SessionMetadata
  ): Promise<string> {
    if (!this.userManager.createSession) {
      throw new Error('Session creation not supported by this user manager');
    }

    // ✅ session-management уже ожидает правильный формат SessionMetadata
    return await this.userManager.createSession(userId, sessionMetadata, DEFAULT_SESSION_TTL);
  }

  /**
   * ✅ Validate session for existing orders
   * Ensures user has valid session before order processing
   */
  async validateUserSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const user = await this.userManager.findBySessionId?.(sessionId);
      return user?.id === userId;
    } catch (error) {
      this.logger.error('Session validation failed', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return false;
    }
  }

  /**
   * ✅ Refresh session for active users
   * Extends session TTL for users with ongoing order processing
   */
  async refreshUserSession(
    sessionId: string,
    additionalTtl: number = DEFAULT_SESSION_TTL
  ): Promise<boolean> {
    try {
      // Use session manager to extend TTL if method exists
      if (this.userManager.extendSession) {
        await this.userManager.extendSession(sessionId, additionalTtl);
        return true;
      }

      this.logger.warn('Session extension not available in current UserManager implementation');
      return false;
    } catch (error) {
      this.logger.error('Session refresh failed', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: sessionId.substring(LOG_TRUNCATE_START, SESSION_ID_LOG_LENGTH) + '...',
      });
      return false;
    }
  }
}
