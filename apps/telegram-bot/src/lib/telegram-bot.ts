import { TELEGRAM_CLIENT_MESSAGES } from '@repo/constants';
import { createEnvironmentLogger, gracefulHandler } from '@repo/utils';

import { api } from './trpc-client';

import type { BotSession, TelegramUpdate } from './types';

const logger = createEnvironmentLogger('telegram-bot');

/**
 * Константы для сообщений об ошибках
 */
const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'Ошибка: не удалось определить пользователя',
  OPERATOR_ONLY: '❌ Эта команда доступна только операторам. Используйте /login',
} as const;

/**
 * Простое хранилище сессий в памяти
 * В production будет заменено на Redis или database
 */
const sessions = new Map<number, BotSession>();

/**
 * Список команд бота
 */
const BOT_COMMANDS = [
  { command: 'start', description: 'Начать работу с ботом' },
  { command: 'help', description: 'Показать справку' },
  { command: 'login', description: 'Войти как оператор', operatorOnly: true },
  { command: 'takeorder', description: 'Взять заявку в работу', operatorOnly: true },
  { command: 'orders', description: 'Показать активные заявки', operatorOnly: true },
];

/**
 * Получение или создание сессии пользователя
 */
function getSession(userId: number): BotSession {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      userId,
      isOperator: false,
    });
  }

  const session = sessions.get(userId);
  if (!session) {
    throw new Error('Failed to create session');
  }

  return session;
}

// ========================================
// 🆕 CLIENT SUPPORT: Utility functions
// ========================================

/**
 * Извлечение userId из Telegram Update
 * @param update - Telegram update объект
 * @returns userId или null если не найден
 */
function extractUserId(update: TelegramUpdate): number | null {
  return update.message?.from?.id ?? update.callback_query?.from?.id ?? null;
}

/**
 * Извлечение username из Telegram Update
 * @param update - Telegram update объект
 * @returns username (с @) или null если не найден
 */
function extractUsername(update: TelegramUpdate): string | null {
  const username = update.message?.from?.username ?? update.callback_query?.from?.username;
  return username ? `@${username}` : null;
}

/**
 * Получение списка авторизованных операторов
 * @returns Массив userId авторизованных операторов
 */
function getAuthorizedOperators(): string[] {
  return process.env.AUTHORIZED_TELEGRAM_OPERATORS?.split(',') || [];
}

/**
 * Проверка является ли пользователь авторизованным оператором
 * @param userId - Telegram user ID
 * @returns true если пользователь авторизованный оператор
 */
function isAuthorizedOperator(userId: number): boolean {
  const authorizedOperators = getAuthorizedOperators();
  return authorizedOperators.includes(String(userId));
}

/**
 * Определение типа пользователя (оператор или клиент)
 * @param userId - Telegram user ID
 * @returns 'operator' если авторизованный оператор, иначе 'client'
 */
function getUserType(userId: number): 'operator' | 'client' {
  return isAuthorizedOperator(userId) ? 'operator' : 'client';
}

/**
 * Проверка rate limit для клиентских сообщений
 * @param session - Сессия пользователя
 * @returns true если лимит НЕ превышен, false если превышен
 */
function checkClientRateLimit(session: BotSession): boolean {
  const now = Date.now();
  const WINDOW_MS = 60000; // 1 минута
  const MAX_MESSAGES = 5; // 5 сообщений в минуту

  // Если нет истории или окно истекло - сбрасываем счетчик
  if (!session.lastMessageTime || now - session.lastMessageTime > WINDOW_MS) {
    session.lastMessageTime = now;
    session.messageCount = 1;
    return true;
  }

  // Проверяем лимит
  if (session.messageCount && session.messageCount >= MAX_MESSAGES) {
    logger.warn('CLIENT_RATE_LIMIT_EXCEEDED', {
      userId: session.userId,
      messageCount: session.messageCount,
      windowMs: WINDOW_MS,
    });
    return false;
  }

  // Увеличиваем счетчик
  session.messageCount = (session.messageCount || 0) + 1;
  return true;
}

/**
 * Обработчик команды /start (router)
 * Routes based on user type
 */
function handleStartCommand(update: TelegramUpdate): string {
  logger.debug('TELEGRAM_START_COMMAND', {
    messageId: update.message?.message_id,
    updateId: update.update_id,
    hasUser: !!update.message?.from,
  });

  const userId = extractUserId(update);
  if (userId === null) {
    logger.warn('TELEGRAM_START_NO_USER', { update: JSON.stringify(update) });
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const userType = getUserType(userId);

  logger.debug('TELEGRAM_START_ROUTING', { userId, userType });

  // Route based on user type
  if (userType === 'operator') {
    // Operator flow - existing logic
    logger.debug('CREATING_TELEGRAM_SESSION', { userId });
    const session = getSession(userId);
    session.userType = 'operator';

    logger.info('Operator started bot', {
      userId,
      username: update.message?.from?.username,
      firstName: update.message?.from?.first_name,
    });

    const welcomeMessage = (
      `Добро пожаловать в ExchangeGO Bot! 👋\n\n` +
      `Я помогаю операторам управлять заявками.\n\n` +
      `Доступные команды:\n` +
      BOT_COMMANDS.map(cmd => `/${cmd.command} - ${cmd.description}`).join('\n') +
      `\n\nДля начала работы используйте /login`
    );

    logger.debug('TELEGRAM_START_RESPONSE_PREPARED', { messageLength: welcomeMessage.length });
    return welcomeMessage;
  } else {
    // Client flow
    return handleClientStart(update);
  }
}

/**
 * Обработчик команды /help (router)
 * Routes based on user type
 */
function handleHelpCommand(update: TelegramUpdate): string {
  const userId = extractUserId(update);
  
  // If can't determine userId, show operator help as fallback
  if (userId === null) {
    return (
      `📋 Справка по командам:\n\n` +
      BOT_COMMANDS.map(
        cmd =>
          `/${cmd.command} - ${cmd.description}${cmd.operatorOnly ? ' (только для операторов)' : ''}`
      ).join('\n')
    );
  }

  const userType = getUserType(userId);
  
  if (userType === 'operator') {
    // Operator help
    return (
      `📋 Справка по командам:\n\n` +
      BOT_COMMANDS.map(
        cmd =>
          `/${cmd.command} - ${cmd.description}${cmd.operatorOnly ? ' (только для операторов)' : ''}`
      ).join('\n')
    );
  } else {
    // Client help
    return handleClientHelp();
  }
}

// ========================================
// 🆕 CLIENT SUPPORT: Handler functions
// ========================================

/**
 * Обработчик /start для клиентов
 */
function handleClientStart(update: TelegramUpdate): string {
  logger.debug('TELEGRAM_CLIENT_START', {
    messageId: update.message?.message_id,
  });

  const userId = extractUserId(update);
  if (userId === null) {
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const session = getSession(userId);
  session.userType = 'client';

  logger.info('Client started bot', { userId });

  return TELEGRAM_CLIENT_MESSAGES.GREETINGS.START();
}

/**
 * Обработчик /help для клиентов
 */
function handleClientHelp(): string {
  logger.debug('TELEGRAM_CLIENT_HELP');
  return TELEGRAM_CLIENT_MESSAGES.GREETINGS.HELP();
}

// ========================================
// 🆕 CHANNEL SEPARATION: Telegram API helpers
// ========================================

/**
 * Отправка сообщения в Telegram (chat или group)
 * Универсальная функция для отправки в личные чаты операторов или группы
 * 
 * @param chatId - Telegram chat_id (число для личных чатов, отрицательное для групп)
 * @param text - Текст сообщения
 * @returns true если сообщение отправлено успешно
 */
async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  try {
    const telegramApiUrl = `${process.env.TELEGRAM_BOT_API_URL || 'https://api.telegram.org'}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (response.ok) {
      logger.debug('TELEGRAM_MESSAGE_SENT', {
        chatId,
        messageLength: text.length,
      });
      return true;
    } else {
      const errorBody = await response.text();
      logger.warn('TELEGRAM_MESSAGE_FAILED', {
        chatId,
        status: response.status,
        statusText: response.statusText,
        error: errorBody,
      });
      return false;
    }
  } catch (error) {
    logger.warn('TELEGRAM_MESSAGE_EXCEPTION', {
      chatId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Обработчик текстовых сообщений от клиентов
 * Пересылает сообщение всем авторизованным операторам
 */
async function handleClientMessage(update: TelegramUpdate): Promise<string> {
  const userId = extractUserId(update);
  const username = extractUsername(update);
  const messageText = update.message?.text;

  if (userId === null || !messageText) {
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const session = getSession(userId);

  // Rate limiting check
  if (!checkClientRateLimit(session)) {
    return TELEGRAM_CLIENT_MESSAGES.RESPONSES.RATE_LIMIT_EXCEEDED();
  }

  logger.info('CLIENT_MESSAGE_RECEIVED', {
    userId,
    username,
    messageLength: messageText.length,
  });

  // Формирование сообщения для операторов (БЕЗ Markdown для надёжности)
  const operatorMessage = [
    '💬 Новое обращение клиента в поддержку',
    '',
    `👤 Пользователь: ${username || `ID ${userId}`}`,
    `📱 Telegram ID: ${userId}`,
    '',
    `💬 Сообщение:`,
    messageText,
    '',
    `ℹ️ Ответьте клиенту в личных сообщениях Telegram`,
  ].join('\n');

  // 🆕 CHANNEL SEPARATION: Environment-based routing with graceful fallback
  const supportChatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;
  let notifiedCount = 0;
  
  if (supportChatId) {
    // Route 1: Send to Support Group (если настроена группа)
    logger.debug('TELEGRAM_SUPPORT_GROUP_ROUTE', { 
      supportChatId, 
      clientUserId: userId,
      messageLength: operatorMessage.length,
    });
    
    const success = await sendTelegramMessage(supportChatId, operatorMessage);
    
    if (success) {
      notifiedCount = 1;
      logger.info('Client message sent to support group', {
        userId,
        supportChatId,
        messageLength: operatorMessage.length,
      });
    } else {
      logger.warn('Failed to send to support group', {
        userId,
        supportChatId,
        fallbackToBroadcast: true,
      });
    }
    
  } else {
    // Route 2: Fallback to broadcast (backward compatibility)
    logger.debug('TELEGRAM_SUPPORT_FALLBACK_BROADCAST', {
      reason: 'TELEGRAM_SUPPORT_CHAT_ID not configured',
      clientUserId: userId,
    });
    
    const operatorIds = getAuthorizedOperators();
    
    for (const operatorId of operatorIds) {
      const success = await sendTelegramMessage(operatorId, operatorMessage);
      
      if (success) {
        notifiedCount++;
        logger.debug('OPERATOR_NOTIFIED_CLIENT_MESSAGE', {
          operatorId,
          clientUserId: userId,
        });
      }

      // Небольшая задержка между сообщениями операторам (Telegram rate limit: 1 msg/sec)
      if (notifiedCount < operatorIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    logger.info('CLIENT_MESSAGE_FORWARDED', {
      userId,
      operatorsNotified: notifiedCount,
      totalOperators: operatorIds.length,
    });
  }

  return TELEGRAM_CLIENT_MESSAGES.RESPONSES.MESSAGE_RECEIVED();
}

/**
 * Обработчик команды /login
 */
function handleLoginCommand(update: TelegramUpdate): string {
  logger.debug('TELEGRAM_LOGIN_COMMAND', {
    messageId: update.message?.message_id,
    updateId: update.update_id,
    hasUser: !!update.message?.from,
  });

  if (!update.message?.from) {
    logger.warn('TELEGRAM_LOGIN_NO_USER', { update: JSON.stringify(update) });
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const userId = update.message.from.id;
  const username = update.message.from.username;
  
  logger.debug('RETRIEVING_TELEGRAM_SESSION_FOR_LOGIN', { userId, username });
  const session = getSession(userId);

  // Проверка оператора по списку авторизованных ID
  const authorizedOperators = process.env.AUTHORIZED_TELEGRAM_OPERATORS?.split(',') || [];
  const isAuthorizedOperator = authorizedOperators.includes(String(userId));
  
  logger.debug('TELEGRAM_OPERATOR_VALIDATION', {
    userId,
    username,
    isAuthorizedOperator,
    authorizedOperators: authorizedOperators.length,
    validationRule: 'authorized_telegram_operators',
  });

  if (isAuthorizedOperator) {
    session.isOperator = true;
    session.operatorId = username;

    logger.info('Operator logged in', {
      userId: update.message.from.id,
      username: update.message.from.username,
      operatorId: session.operatorId,
      sessionUpdated: true,
    });

    const successMessage = (
      `✅ Вы вошли как оператор!\n\n` +
      `Теперь доступны операторские команды:\n` +
      `• /takeorder - взять заявку в работу\n` +
      `• /orders - показать активные заявки`
    );
    
    logger.debug('TELEGRAM_LOGIN_SUCCESS_RESPONSE', { messageLength: successMessage.length });
    return successMessage;
  } else {
    logger.warn('TELEGRAM_LOGIN_ACCESS_DENIED', {
      userId,
      username,
      reason: 'not_operator_username',
    });

    const deniedMessage = (
      `❌ Доступ запрещен\n\n` +
      `Только операторы могут использовать этого бота.\n` +
      `Обратитесь к администратору для получения доступа.`
    );
    
    logger.debug('TELEGRAM_LOGIN_DENIED_RESPONSE', { messageLength: deniedMessage.length });
    return deniedMessage;
  }
}

/**
 * Обработчик команды /takeorder
 */
async function handleTakeOrderCommand(update: TelegramUpdate): Promise<string> {
  logger.debug('TELEGRAM_TAKE_ORDER_COMMAND', {
    messageId: update.message?.message_id,
    updateId: update.update_id,
    hasUser: !!update.message?.from,
  });

  if (!update.message?.from) {
    logger.warn('TELEGRAM_TAKE_ORDER_NO_USER', { update: JSON.stringify(update) });
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const userId = update.message.from.id;
  const session = getSession(userId);

  logger.debug('TELEGRAM_TAKE_ORDER_SESSION_CHECK', {
    userId,
    isOperator: session.isOperator,
    operatorId: session.operatorId,
  });

  if (!session.isOperator) {
    logger.warn('TELEGRAM_TAKE_ORDER_NOT_OPERATOR', { userId, sessionOperator: session.isOperator });
    return ERROR_MESSAGES.OPERATOR_ONLY;
  }

  // Извлечение orderId из команды /takeorder ORDER_ID
  const messageText = update.message.text || '';
  const orderIdMatch = messageText.match(/\/takeorder\s+([\w-]+)/);

  logger.debug('TELEGRAM_TAKE_ORDER_PARSE_ID', {
    messageText,
    hasMatch: !!orderIdMatch?.[1],
    extractedOrderId: orderIdMatch?.[1],
  });

  if (!orderIdMatch?.[1]) {
    logger.warn('TELEGRAM_TAKE_ORDER_NO_ID', { messageText });
    return '❌ Укажите ID заявки: /takeorder ORDER_ID';
  }

  const orderId = orderIdMatch[1];
  const telegramOperatorId = userId.toString();

  logger.info('TELEGRAM_TAKE_ORDER_ATTEMPT', {
    orderId,
    telegramOperatorId,
    operatorId: session.operatorId,
  });

  const result = await gracefulHandler(
    async () => {
      // ✅ ИНТЕГРАЦИЯ: Использование нового telegram-specific API
      logger.debug('CALLING_TELEGRAM_TAKE_ORDER_API', { orderId, telegramOperatorId });
      return await api.telegram.takeOrder({
        orderId,
        telegramOperatorId,
      });
    },
    { fallback: null }
  );

  logger.debug('TELEGRAM_TAKE_ORDER_API_RESULT', {
    orderId,
    success: !!result?.order,
    hasOrder: !!result?.order,
    orderStatus: result?.order?.status,
  });

  if (result?.order) {
    session.currentOrderId = result.order.id;

    logger.info('Order taken by operator', {
      operatorId: session.operatorId,
      orderId: result.order.id,
      telegramOperatorId,
      orderStatus: result.order.status,
      cryptoAmount: result.order.cryptoAmount,
      currency: result.order.currency,
    });

    const successMessage = (
      `✅ Заявка взята в работу!\n\n` +
      `📋 Заявка #${result.order.id}\n` +
      `💰 Сумма: ${result.order.cryptoAmount} ${result.order.currency}\n` +
      `🔄 Статус: ${result.order.status}\n\n` +
      `Используйте /orders для просмотра деталей.`
    );
    
    logger.debug('TELEGRAM_TAKE_ORDER_SUCCESS_RESPONSE', { messageLength: successMessage.length });
    return successMessage;
  } else {
    logger.warn('TELEGRAM_TAKE_ORDER_FAILED', {
      orderId,
      telegramOperatorId,
      operatorId: session.operatorId,
      result: JSON.stringify(result),
    });

    const errorMessage = (
      `❌ Не удалось взять заявку\n\n` +
      `Возможные причины:\n` +
      `• Заявка не найдена\n` +
      `• Заявка уже взята другим оператором\n` +
      `• Системная ошибка\n\n` +
      `Проверьте ID заявки и попробуйте снова.`
    );
    
    logger.debug('TELEGRAM_TAKE_ORDER_ERROR_RESPONSE', { messageLength: errorMessage.length });
    return errorMessage;
  }
}

/**
 * Обработчик команды /orders
 */
function handleOrdersCommand(update: TelegramUpdate): string {
  if (!update.message?.from) {
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const session = getSession(update.message.from.id);

  if (!session.isOperator) {
    return ERROR_MESSAGES.OPERATOR_ONLY;
  }

  return (
    `📋 Активные заявки:\n\n` +
    `${
      session.currentOrderId
        ? `• Заявка #${session.currentOrderId} (в работе)`
        : 'Нет заявок в работе'
    }\n\n` +
    `Используйте /takeorder для взятия новой заявки.`
  );
}

/**
 * Обработчик callback queries от inline кнопок
 */
async function handleCallbackQuery(update: TelegramUpdate): Promise<string | null> {
  const callbackQuery = update.callback_query;
  if (!callbackQuery?.from || !callbackQuery.data) {
    return null;
  }

  const session = getSession(callbackQuery.from.id);

  // Проверка авторизации оператора при callback query
  const authorizedOperators = process.env.AUTHORIZED_TELEGRAM_OPERATORS?.split(',') || [];
  const isAuthorizedOperator = authorizedOperators.includes(String(callbackQuery.from.id));
  
  if (!isAuthorizedOperator) {
    logger.warn('UNAUTHORIZED_CALLBACK_QUERY', {
      userId: callbackQuery.from.id,
      username: callbackQuery.from.username,
      authorizedOperators: authorizedOperators.length,
    });
    return 'Только авторизованные операторы могут использовать эти кнопки';
  }

  // Устанавливаем статус оператора если еще не установлен
  if (!session.isOperator) {
    session.isOperator = true;
    session.operatorId = callbackQuery.from.username || String(callbackQuery.from.id);
    logger.info('OPERATOR_STATUS_SET_VIA_CALLBACK', {
      userId: callbackQuery.from.id,
      operatorId: session.operatorId,
    });
  }

  logger.info('Processing callback query', {
    userId: callbackQuery.from.id,
    data: callbackQuery.data,
  });

  // Обработка callback_data для взятия заявки
  if (callbackQuery.data.startsWith('take_order_')) {
    const orderId = callbackQuery.data.replace('take_order_', '');
    return await handleTakeOrderCommand({
      ...update,
      message: {
        message_id: 0,
        from: callbackQuery.from,
        text: `/takeorder ${orderId}`,
        chat: {
          id: callbackQuery.from.id,
          type: 'private',
        },
      },
    });
  }

  // Обработка callback_data для деталей заявки
  if (callbackQuery.data.startsWith('details_order_')) {
    const orderId = callbackQuery.data.replace('details_order_', '');
    return `📋 Детали заявки #${orderId}\n\n` +
           `Для получения подробной информации используйте web интерфейс оператора.`;
  }

  return '❓ Неизвестное действие';
}

/**
 * Основная функция обработки telegram update
 * 🔧 REFACTORED: Added client support routing
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<string | null> {
  return await gracefulHandler(
    async () => {
      // Обработка callback queries (inline кнопки)
      if (update.callback_query) {
        return await handleCallbackQuery(update);
      }

      const message = update.message;

      if (!message?.text) {
        return '❓ Поддерживаются только текстовые сообщения';
      }

      const text = message.text.trim();
      const userId = extractUserId(update);

      if (userId === null) {
        return ERROR_MESSAGES.USER_NOT_FOUND;
      }

      const userType = getUserType(userId);

      logger.debug('TELEGRAM_UPDATE_ROUTING', {
        userId,
        userType,
        command: text.split(' ')[0],
      });

      // ========================================
      // Universal commands (operator + client)
      // ========================================

      if (text === '/start') {
        return handleStartCommand(update);
      }

      if (text === '/help') {
        return handleHelpCommand(update);
      }

      // ========================================
      // Operator-only commands
      // ========================================

      if (userType === 'operator') {
        if (text === '/login') {
          return handleLoginCommand(update);
        }

        if (text.startsWith('/takeorder')) {
          return await handleTakeOrderCommand(update);
        }

        if (text === '/orders') {
          return handleOrdersCommand(update);
        }

        // Неизвестная команда для оператора
        if (text.startsWith('/')) {
          return '❓ Неизвестная команда. Используйте /help для просмотра доступных команд.';
        }

        // Обычное сообщение от оператора (игнорируем)
        return '❓ Не понимаю это сообщение. Используйте /help для просмотра доступных команд.';
      }

      // ========================================
      // Client-only commands
      // ========================================

      // Client tries to use operator commands
      if (text === '/login' || text.startsWith('/takeorder') || text === '/orders') {
        return TELEGRAM_CLIENT_MESSAGES.RESPONSES.OPERATOR_COMMAND_DENIED();
      }

      // Неизвестная команда для клиента
      if (text.startsWith('/')) {
        return '❓ Неизвестная команда. Используйте /help для получения справки.';
      }

      // Обычное текстовое сообщение от клиента → обработать как обращение в поддержку
      return await handleClientMessage(update);
    },
    { fallback: 'Произошла ошибка при обработке сообщения' }
  );
}
