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
  authenticationMethod: 'auto-registration' | 'auto-login' | 'existing-session';
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
    sessionMetadata: SessionMetadata,
    existingSessionId?: string
  ): Promise<AutoRegistrationResult> {
    try {
      this.logger.info('Ensuring user with session', {
        email,
        hasExistingSession: !!existingSessionId,
      });

      // ✅ ENHANCED: Determine user authentication status based on email and existing session
      const userStatus = await this.determineUserStatus(email, existingSessionId);

      let finalSessionId: string;

      switch (userStatus.authenticationMethod) {
        case 'existing-session':
          // Reuse and extend existing session
          finalSessionId = existingSessionId as string; // TypeScript guard: existingSessionId is guaranteed to exist
          await this.refreshUserSession(finalSessionId);
          break;

        case 'auto-login':
        case 'auto-registration':
          // Create new session for auto-login or auto-registration
          finalSessionId = await this.createUserSession(userStatus.user.id, sessionMetadata);
          break;
      }

      this.logger.info('User session ensured successfully', {
        userId: userStatus.user.id,
        authMethod: userStatus.authenticationMethod,
        isNewUser: userStatus.isNewUser,
        sessionId: finalSessionId.substring(LOG_TRUNCATE_START, SESSION_ID_LOG_LENGTH) + '...',
      });

      return {
        user: userStatus.user,
        sessionId: finalSessionId,
        isNewUser: userStatus.isNewUser,
        authenticationMethod: userStatus.authenticationMethod,
      };
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

  /**
   * ✅ ENHANCED: Determine user authentication status for AC2.1A compliance
   * Supports: auto-registration, auto-login, existing-session scenarios
   */
  private async determineUserStatus(
    email: string,
    existingSessionId?: string
  ): Promise<{
    user: User;
    authenticationMethod: 'auto-registration' | 'auto-login' | 'existing-session';
    isNewUser: boolean;
  }> {
    // 1. Check if user is already logged in with valid session
    if (existingSessionId) {
      const sessionResult = await this.validateExistingSession(existingSessionId, email);
      if (sessionResult) {
        return sessionResult;
      }
    }

    // 2. Check if user exists in database
    const existingUser = await this.userManager.findByEmail(email);

    if (existingUser) {
      // Registered but not logged in → auto-login
      return {
        user: existingUser,
        authenticationMethod: 'auto-login',
        isNewUser: false,
      };
    }

    // 3. Unregistered → auto-registration
    const newUser = await this.userManager.create({
      email,
      hashedPassword: undefined,
      isVerified: false,
    });

    return {
      user: newUser,
      authenticationMethod: 'auto-registration',
      isNewUser: true,
    };
  }

  /**
   * ✅ Helper method for session validation to reduce complexity
   */
  private async validateExistingSession(
    sessionId: string,
    email: string
  ): Promise<{ user: User; authenticationMethod: 'existing-session'; isNewUser: false } | null> {
    try {
      const sessionUser = await this.userManager.findBySessionId(sessionId);
      if (sessionUser && sessionUser.email === email) {
        return {
          user: sessionUser,
          authenticationMethod: 'existing-session',
          isNewUser: false,
        };
      }
      return null;
    } catch (error) {
      // Session validation failed - continue with auto-registration flow
      this.logger.debug(
        `Session validation failed for ${sessionId.substring(
          AUTH_CONSTANTS.LOG_TRUNCATE_START,
          AUTH_CONSTANTS.SESSION_ID_LOG_LENGTH
        )}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return null;
    }
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
