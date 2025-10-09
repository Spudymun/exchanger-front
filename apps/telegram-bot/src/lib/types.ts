/**
 * Типы для Telegram Bot приложения
 */

export interface BotSession {
  userId: number;
  username?: string;
  operatorId?: string;
  isOperator: boolean;
  currentOrderId?: string;
  // 🆕 CLIENT SUPPORT: User type for context isolation
  userType?: 'operator' | 'client';
  // 🆕 CLIENT SUPPORT: Rate limiting для клиентов
  lastMessageTime?: number;
  messageCount?: number;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      username?: string;
      first_name: string;
    };
    text?: string;
    chat: {
      id: number;
      type: string;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      username?: string;
      first_name: string;
    };
    data?: string;
    message?: {
      message_id: number;
      text?: string;
      chat: {
        id: number;
      };
    };
  };
}

export interface BotCommand {
  command: string;
  description: string;
  operatorOnly?: boolean;
}
