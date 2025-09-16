import type { User } from '../types/index.js';

import type { SessionMetadata } from './types.js';

/**
 * Расширение существующего UserRepository для AC2.1A требований
 * ДОБАВЛЕНО: Для поддержки Flexible User Authentication
 * ОБОСНОВАНИЕ: AC2.1A требует auto-registration и auto-login функциональность
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Расширяем СУЩЕСТВУЮЩИЙ интерфейс вместо создания нового (Rule 20)
 */
export interface EnhancedUserRepositoryInterface {
  // AC2.1A: Flexible User Authentication
  findOrCreateByEmail(email: string): Promise<{ user: User; isNewUser: boolean }>;
  createSessionForUser(userId: string, metadata: SessionMetadata): Promise<string>;

  // Интеграция с существующими методами session-management
  // findByEmail, create уже есть в базовом UserRepository - НЕ дублируем
}
