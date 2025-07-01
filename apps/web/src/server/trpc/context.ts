import { userManager } from '@repo/exchange-core';
import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';

export const createContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Получаем IP для rate limiting
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || 'unknown';

  // Проверяем аутентификацию через cookie или header
  let user = null;
  const sessionId = req.cookies.sessionId || req.headers.authorization?.replace('Bearer ', '');

  if (sessionId) {
    // Поиск пользователя по session ID (мок)
    const foundUser = userManager.getAll().find(u => u.sessionId === sessionId);
    if (foundUser) {
      user = foundUser;
    }
  }

  return {
    req,
    res,
    ip,
    user,
    sessionId,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
