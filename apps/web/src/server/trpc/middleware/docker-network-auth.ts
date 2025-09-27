import { createUnauthorizedError } from '@repo/utils';

import { publicProcedure } from '../init';

/**
 * Docker Network Authentication Middleware
 *
 * НАЗНАЧЕНИЕ: Аутентификация запросов от внутренних сервисов Docker сети
 * БЕЗОПАСНОСТЬ: Проверяет что запрос пришел из Docker network через анализ IP
 * ПРИМЕНЕНИЕ: Для системных API вызовов от telegram-bot к web app
 *
 * ПРИНЦИП:
 * - В Docker сети сервисы получают внутренние IP адреса (обычно 172.x.x.x)
 * - Внешние запросы приходят с публичных IP или через proxy
 * - Проверяем что источник запроса - внутренний Docker контейнер
 */

/**
 * Проверяет является ли IP адрес внутренним для Docker сети
 */
function isDockerNetworkIP(ip: string): boolean {
  // Docker default bridge network: 172.17.0.0/16
  // Docker custom networks: 172.18-31.0.0/16
  // Docker Compose networks: обычно 172.x.0.0/16
  const dockerNetworkPatterns = [
    /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/, // 172.16-31.x.x (custom networks)
    /^172\.17\.\d+\.\d+$/, // 172.17.x.x (default bridge)
    /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/, // IPv6 mapped IPv4
  ];

  return dockerNetworkPatterns.some(pattern => pattern.test(ip));
}

/**
 * Проверяет является ли запрос внутренним Docker вызовом по заголовкам
 */
function isInternalDockerRequest(headers: Record<string, string | string[] | undefined>): boolean {
  // Docker внутренние запросы часто имеют специфичные заголовки
  const host = headers.host as string;

  // Проверяем что host содержит имя Docker сервиса (не внешний домен)
  if (host && (host.startsWith('web:') || host.startsWith('telegram-bot:'))) {
    return true;
  }

  // Можно добавить другие проверки специфичные для Docker
  return false;
}

/**
 * Docker Network Authentication Middleware
 * Заменяет systemApiMiddleware для Docker окружения
 */
export const dockerNetworkMiddleware = publicProcedure.use(async ({ ctx, next }) => {
  const ip = ctx.ip;
  const headers = ctx.req.headers;

  // DEBUG: Логирование для диагностики
  console.log('DOCKER_NETWORK_AUTH_DEBUG:', {
    ip,
    host: headers.host,
    userAgent: headers['user-agent'],
    authorization: headers.authorization ? 'present' : 'missing',
    nodeEnv: process.env.NODE_ENV,
    hasApiSecretKey: !!process.env.API_SECRET_KEY,
  });

  // РЕЖИМ РАЗРАБОТКИ: Разрешаем все localhost запросы
  if (process.env.NODE_ENV === 'development') {
    // В development разрешаем все локальные запросы
    return next({
      ctx: {
        ...ctx,
        isSystemCall: true,
        authMethod: 'docker-network-dev',
      },
    });
  }

  // ОСНОВНАЯ ПРОВЕРКА: Docker network IP
  if (ip && isDockerNetworkIP(ip)) {
    return next({
      ctx: {
        ...ctx,
        isSystemCall: true,
        authMethod: 'docker-network-ip',
      },
    });
  }

  // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Docker internal headers
  if (isInternalDockerRequest(headers)) {
    return next({
      ctx: {
        ...ctx,
        isSystemCall: true,
        authMethod: 'docker-network-headers',
      },
    });
  }

  // FALLBACK для API_SECRET_KEY (совместимость)
  const apiKey = ctx.req.headers.authorization?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.API_SECRET_KEY) {
    return next({
      ctx: {
        ...ctx,
        isSystemCall: true,
        authMethod: 'api-secret-key',
      },
    });
  }

  // БЛОКИРОВКА: Не Docker network и не валидный API key
  throw createUnauthorizedError('Access denied: not from Docker network or invalid API key');
});

/**
 * Legacy alias для обратной совместимости
 * @deprecated Используйте dockerNetworkMiddleware
 */
export const systemApiMiddleware = dockerNetworkMiddleware;
