import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { type Context } from './context';

// Инициализация tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Базовые строительные блоки
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Middleware для логирования
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();

  const result = await next();

  const durationMs = Date.now() - start;
  const status = result.ok ? '✅' : '❌';

  console.log(`${status} tRPC ${type} ${path} - ${durationMs}ms`);

  return result;
});

// Процедура с логированием
export const loggedProcedure = publicProcedure.use(loggingMiddleware);
