/**
 * @fileoverview Standalone Bull Board Dashboard для мониторинга BullMQ очередей
 *
 * @architecture
 * - Standalone Express server на порту 3010
 * - Независим от telegram-bot приложения
 * - Production-ready с graceful shutdown
 * - Health check endpoint для Docker
 *
 * @environment
 * - REDIS_URL: Redis connection URL (required)
 * - REDIS_DB_QUEUE: Redis database index для очереди (default: 1)
 * - PORT: Server port (default: 3010)
 * - NODE_ENV: Environment (development/production)
 *
 * @author ExchangeGO Team
 * @version 1.0.0
 */

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import express from 'express';
import basicAuth from 'express-basic-auth';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
  PORT: process.env.PORT || 3010,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_DB: parseInt(process.env.REDIS_DB_QUEUE || '1', 10),
  QUEUE_NAME: 'telegram-notifications',
  NODE_ENV: process.env.NODE_ENV || 'development',
  HEALTH_CHECK_PATH: '/health',
  DASHBOARD_PATH: '/',
  // Basic Auth credentials
  AUTH_USER: process.env.BULL_BOARD_USER || 'admin',
  AUTH_PASSWORD: process.env.BULL_BOARD_PASSWORD || 'admin123',
};

// ========================================
// LOGGER
// ========================================

/** Simple logger для standalone приложения */
const logger = {
  info: (message, meta = {}) => {
    console.log(
      JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      })
    );
  },
  error: (message, meta = {}) => {
    console.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      })
    );
  },
  warn: (message, meta = {}) => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        ...meta,
      })
    );
  },
};

// ========================================
// VALIDATION
// ========================================

/** Validate environment configuration */
function validateConfig() {
  if (!CONFIG.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is required');
  }

  if (isNaN(CONFIG.REDIS_DB) || CONFIG.REDIS_DB < 0 || CONFIG.REDIS_DB > 15) {
    throw new Error('REDIS_DB_QUEUE must be a number between 0 and 15');
  }

  if (isNaN(CONFIG.PORT) || CONFIG.PORT < 1 || CONFIG.PORT > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)');
  }

  logger.info('CONFIGURATION_VALIDATED', {
    port: CONFIG.PORT,
    redisDb: CONFIG.REDIS_DB,
    queueName: CONFIG.QUEUE_NAME,
    env: CONFIG.NODE_ENV,
  });
}

// ========================================
// BULL BOARD SETUP
// ========================================

/** Initialize Bull Board Dashboard */
function initializeBullBoard() {
  try {
    logger.info('INITIALIZING_BULL_BOARD');

    // Create BullMQ Queue connection (read-only)
    const telegramQueue = new Queue(CONFIG.QUEUE_NAME, {
      connection: {
        url: CONFIG.REDIS_URL,
        db: CONFIG.REDIS_DB,
        // Read-only connection settings
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      },
    });

    // Create Express adapter для Bull Board UI
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath(CONFIG.DASHBOARD_PATH);

    // Create Bull Board instance
    createBullBoard({
      queues: [new BullMQAdapter(telegramQueue)],
      serverAdapter,
      options: {
        uiConfig: {
          boardTitle: 'Telegram Notifications Queue',
          boardLogo: {
            path: '',
            width: 0,
            height: 0,
          },
          miscLinks: [
            {
              text: 'Documentation',
              url: 'https://github.com/felixmosh/bull-board',
            },
          ],
        },
      },
    });

    logger.info('BULL_BOARD_INITIALIZED', {
      basePath: CONFIG.DASHBOARD_PATH,
      queueName: CONFIG.QUEUE_NAME,
    });

    return { serverAdapter, queue: telegramQueue };
  } catch (error) {
    logger.error('BULL_BOARD_INITIALIZATION_FAILED', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// ========================================
// EXPRESS SERVER
// ========================================

/** Create and configure Express application */
function createApp(serverAdapter) {
  const app = express();

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Request logging (development only)
  if (CONFIG.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      logger.info('HTTP_REQUEST', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      next();
    });
  }

  // Health check endpoint (для Docker healthcheck)
  app.get(CONFIG.HEALTH_CHECK_PATH, (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'bull-board-dashboard',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Basic Auth для Bull Board UI (production обязательно, dev опционально)
  if (CONFIG.NODE_ENV === 'production' || CONFIG.AUTH_PASSWORD !== 'admin123') {
    logger.info('BASIC_AUTH_ENABLED', {
      user: CONFIG.AUTH_USER,
      env: CONFIG.NODE_ENV,
    });

    app.use(
      CONFIG.DASHBOARD_PATH,
      basicAuth({
        users: { [CONFIG.AUTH_USER]: CONFIG.AUTH_PASSWORD },
        challenge: true,
        realm: 'Bull Board Dashboard - Authentication Required',
        unauthorizedResponse: (req) => {
          logger.warn('UNAUTHORIZED_ACCESS_ATTEMPT', {
            ip: req.ip,
            path: req.path,
          });
          return {
            error: 'Unauthorized',
            message: 'Access denied. Valid credentials required.',
          };
        },
      })
    );
  } else {
    logger.warn('BASIC_AUTH_DISABLED', {
      reason: 'Development mode with default password',
      recommendation: 'Set BULL_BOARD_PASSWORD for production',
    });
  }

  // Bull Board UI
  app.use(CONFIG.DASHBOARD_PATH, serverAdapter.getRouter());

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
      availablePaths: [CONFIG.DASHBOARD_PATH, CONFIG.HEALTH_CHECK_PATH],
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    logger.error('EXPRESS_ERROR', {
      error: err.message,
      stack: err.stack,
      path: req.path,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: CONFIG.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  });

  return app;
}

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

/** Graceful shutdown handler */
async function gracefulShutdown(signal, server, queue) {
  logger.info('GRACEFUL_SHUTDOWN_INITIATED', { signal });

  const shutdownTimeout = setTimeout(() => {
    logger.error('GRACEFUL_SHUTDOWN_TIMEOUT');
    process.exit(1);
  }, 10000); // 10 seconds timeout

  try {
    // Close HTTP server
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    logger.info('HTTP_SERVER_CLOSED');

    // Close Redis connection
    await queue.close();
    logger.info('REDIS_CONNECTION_CLOSED');

    clearTimeout(shutdownTimeout);
    logger.info('GRACEFUL_SHUTDOWN_COMPLETED');
    process.exit(0);
  } catch (error) {
    logger.error('GRACEFUL_SHUTDOWN_FAILED', {
      error: error.message,
    });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// ========================================
// MAIN
// ========================================

async function main() {
  try {
    // Validate configuration
    validateConfig();

    // Initialize Bull Board
    const { serverAdapter, queue } = initializeBullBoard();

    // Create Express app
    const app = createApp(serverAdapter);

    // Start HTTP server
    const server = app.listen(CONFIG.PORT, () => {
      logger.info('SERVER_STARTED', {
        port: CONFIG.PORT,
        dashboardUrl: `http://localhost:${CONFIG.PORT}${CONFIG.DASHBOARD_PATH}`,
        healthCheckUrl: `http://localhost:${CONFIG.PORT}${CONFIG.HEALTH_CHECK_PATH}`,
        env: CONFIG.NODE_ENV,
      });
    });

    // Graceful shutdown handlers
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM', server, queue));
    process.once('SIGINT', () => gracefulShutdown('SIGINT', server, queue));

    // Unhandled errors
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('UNHANDLED_REJECTION', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: String(promise),
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('UNCAUGHT_EXCEPTION', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('UNCAUGHT_EXCEPTION', server, queue);
    });
  } catch (error) {
    logger.error('SERVER_STARTUP_FAILED', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Run server
main();
