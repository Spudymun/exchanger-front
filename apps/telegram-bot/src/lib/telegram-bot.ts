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

/**
 * Обработчик команды /start
 */
function handleStartCommand(update: TelegramUpdate): string {
  if (!update.message?.from) {
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  getSession(update.message.from.id);

  logger.info('User started bot', {
    userId: update.message.from.id,
    username: update.message.from.username,
  });

  return (
    `Добро пожаловать в ExchangeGO Bot! 👋\n\n` +
    `Я помогаю операторам управлять заявками.\n\n` +
    `Доступные команды:\n` +
    BOT_COMMANDS.map(cmd => `/${cmd.command} - ${cmd.description}`).join('\n') +
    `\n\nДля начала работы используйте /login`
  );
}

/**
 * Обработчик команды /help
 */
function handleHelpCommand(): string {
  return (
    `📋 Справка по командам:\n\n` +
    BOT_COMMANDS.map(
      cmd =>
        `/${cmd.command} - ${cmd.description}${cmd.operatorOnly ? ' (только для операторов)' : ''}`
    ).join('\n')
  );
}

/**
 * Обработчик команды /login
 */
function handleLoginCommand(update: TelegramUpdate): string {
  if (!update.message?.from) {
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const session = getSession(update.message.from.id);

  // Упрощенная проверка оператора (в production будет через API)
  const isOperatorUsername = update.message.from.username?.includes('operator') || false;

  if (isOperatorUsername) {
    session.isOperator = true;
    session.operatorId = update.message.from.username;

    logger.info('Operator logged in', {
      userId: update.message.from.id,
      username: update.message.from.username,
    });

    return (
      `✅ Вы вошли как оператор!\n\n` +
      `Теперь доступны операторские команды:\n` +
      `• /takeorder - взять заявку в работу\n` +
      `• /orders - показать активные заявки`
    );
  } else {
    return (
      `❌ Доступ запрещен\n\n` +
      `Только операторы могут использовать этого бота.\n` +
      `Обратитесь к администратору для получения доступа.`
    );
  }
}

/**
 * Обработчик команды /takeorder
 */
async function handleTakeOrderCommand(update: TelegramUpdate): Promise<string> {
  if (!update.message?.from) {
    return ERROR_MESSAGES.USER_NOT_FOUND;
  }

  const session = getSession(update.message.from.id);

  if (!session.isOperator) {
    return ERROR_MESSAGES.OPERATOR_ONLY;
  }

  // Извлечение orderId из команды /takeorder ORDER_ID
  const messageText = update.message.text || '';
  const orderIdMatch = messageText.match(/\/takeorder\s+(\w+)/);

  if (!orderIdMatch?.[1]) {
    return '❌ Укажите ID заявки: /takeorder ORDER_ID';
  }

  const orderId = orderIdMatch[1];

  const result = await gracefulHandler(
    async () => {
      // ✅ ИНТЕГРАЦИЯ: Использование нового telegram-specific API
      return await api.telegram.takeOrder({
        orderId,
        telegramOperatorId: update.message?.from?.id.toString() || 'unknown',
      });
    },
    { fallback: null }
  );

  if (result?.order) {
    session.currentOrderId = result.order.id;

    logger.info('Order taken by operator', {
      operatorId: session.operatorId,
      orderId: result.order.id,
    });

    return (
      `✅ Заявка взята в работу!\n\n` +
      `📋 Заявка #${result.order.id}\n` +
      `💰 Сумма: ${result.order.cryptoAmount} ${result.order.currency}\n` +
      `🔄 Статус: ${result.order.status}\n\n` +
      `Используйте /orders для просмотра деталей.`
    );
  } else {
    return (
      `❌ Не удалось взять заявку\n\n` +
      `Возможные причины:\n` +
      `• Заявка не найдена\n` +
      `• Заявка уже взята другим оператором\n` +
      `• Системная ошибка\n\n` +
      `Проверьте ID заявки и попробуйте снова.`
    );
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
 * Основная функция обработки telegram update
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<string | null> {
  return await gracefulHandler(
    async () => {
      const message = update.message;

      if (!message?.text) {
        return '❓ Поддерживаются только текстовые сообщения';
      }

      const text = message.text.trim();

      // Обработка команд
      if (text === '/start') {
        return handleStartCommand(update);
      }

      if (text === '/help') {
        return handleHelpCommand();
      }

      if (text === '/login') {
        return handleLoginCommand(update);
      }

      if (text === '/takeorder') {
        return await handleTakeOrderCommand(update);
      }

      if (text === '/orders') {
        return handleOrdersCommand(update);
      }

      // Неизвестная команда
      if (text.startsWith('/')) {
        return '❓ Неизвестная команда. Используйте /help для просмотра доступных команд.';
      }

      return '❓ Не понимаю это сообщение. Используйте /help для просмотра доступных команд.';
    },
    { fallback: 'Произошла ошибка при обработке сообщения' }
  );
}
