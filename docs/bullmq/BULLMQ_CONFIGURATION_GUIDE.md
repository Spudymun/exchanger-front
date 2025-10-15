# BullMQ Configuration Guide

## Overview

This document describes the complete configuration for the BullMQ-based reliable notification system.

## Architecture

```
┌─────────────┐      Enqueue      ┌──────────────┐
│   Web App   │ ───────────────► │ Redis Queue  │
│ (Producer)  │                   │   (BullMQ)   │
└─────────────┘                   └──────┬───────┘
                                         │
                                    Process Jobs
                                         │
                                         ▼
                                  ┌──────────────┐      HTTP POST      ┌──────────────┐
                                  │   Worker     │ ──────────────────► │ Telegram Bot │
                                  │ (telegram-   │   /api/notify-     │   (Telegraf) │
                                  │  bot app)    │    operators        └──────────────┘
                                  └──────────────┘
```

## Environment Variables

### Required for All Apps

#### 1. `REDIS_URL`

- **Required by:** web, telegram-bot
- **Purpose:** Connection to Redis server for BullMQ queue
- **Format:** `redis://host:port`
- **Example:** `redis://localhost:6379`
- **Production:** `redis://redis:6379` (Docker Compose)

#### 2. `TELEGRAM_BOT_URL` 🆕

- **Required by:** telegram-bot (for worker)
- **Purpose:** URL where worker sends HTTP requests to process notifications
- **Format:** `http://host:port`
- **Example:** `TELEGRAM_BOT_URL=http://localhost:3003`
- **Production:** `TELEGRAM_BOT_URL=http://telegram-bot:3003` (Docker Compose)
- **Why needed:** Worker runs in telegram-bot app and needs to call its own `/api/notify-operators` endpoint

### Optional Configuration

#### 3. `REDIS_DB_QUEUE`

- **Default:** `1` (defined in `@repo/constants`)
- **Purpose:** Separate Redis database for BullMQ to avoid conflicts with sessions
- **Range:** 0-15
- **Note:** DB 0 is used for sessions/cache, DB 1 for BullMQ

## Configuration Files

### 1. apps/telegram-bot/.env

```bash
# ===== BULLMQ QUEUE CONFIGURATION =====
REDIS_URL=redis://localhost:6379
REDIS_DB_QUEUE=1

# ===== BULLMQ WORKER CONFIGURATION =====
TELEGRAM_BOT_URL=http://localhost:3003
```

### 2. apps/web/.env

```bash
# ===== REDIS CONFIGURATION =====
REDIS_URL=redis://localhost:6379
```

## Queue Constants

Defined in `packages/constants/src/telegram-queue.ts`:

```typescript
export const TELEGRAM_QUEUE_CONSTANTS = {
  QUEUE_NAME: 'telegram-notifications',
  REDIS_DB: 1,

  RETRY: {
    MAX_ATTEMPTS: 5,
    BACKOFF_TYPE: 'exponential',
    BASE_DELAY_MS: 5000,
  },

  WORKER: {
    CONCURRENCY: 3,
    RATE_LIMIT: {
      MAX: 10,
      DURATION_MS: 1000,
    },
  },

  CLEANUP: {
    COMPLETED_TTL_HOURS: 24,
    COMPLETED_MAX_COUNT: 1000,
    FAILED_TTL_HOURS: 168, // 7 days
  },
};
```

## Troubleshooting

### Error: "TELEGRAM_BOT_URL is required"

**Cause:** `TELEGRAM_BOT_URL` environment variable is not set in `apps/telegram-bot/.env`

**Solution:**

```bash
# Add to apps/telegram-bot/.env
TELEGRAM_BOT_URL=http://localhost:3003
```

### Error: "REDIS_URL_NOT_CONFIGURED"

**Cause:** `REDIS_URL` environment variable is not set

**Solution:**

```bash
# Add to .env file
REDIS_URL=redis://localhost:6379
```

### Jobs Stuck in "Waiting" State

**Cause:** Worker is not running or cannot connect to Redis

**Debug:**

1. Check worker logs in telegram-bot app
2. Verify Redis is running: `redis-cli ping`
3. Check worker initialization: Look for "WORKER_STARTED" log

### Jobs Failing with "Connection Refused"

**Cause:** `TELEGRAM_BOT_URL` points to wrong host/port

**Debug:**

```bash
# Test if telegram-bot API is accessible
curl http://localhost:3003/api/health

# Check PORT in apps/telegram-bot/.env matches TELEGRAM_BOT_URL
```

## Production Configuration

### Docker Compose

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --maxmemory 256mb --maxmemory-policy noeviction

  telegram-bot:
    build: ./apps/telegram-bot
    environment:
      - REDIS_URL=redis://redis:6379
      - TELEGRAM_BOT_URL=http://telegram-bot:3003
      - PORT=3003
    depends_on:
      - redis

  web:
    build: ./apps/web
    environment:
      - REDIS_URL=redis://redis:6379
      - TELEGRAM_BOT_URL=http://telegram-bot:3003
    depends_on:
      - redis
      - telegram-bot
```

### Environment Variables

```bash
# Production .env
REDIS_URL=redis://redis:6379
TELEGRAM_BOT_URL=http://telegram-bot:3003
```

## Monitoring

### Bull Board Dashboard

- **URL:** http://localhost:3003/api/admin/queues
- **Purpose:** Monitor queue health, view jobs, retry failed jobs
- **Access:** Available only in development mode

### Key Metrics

1. **Queue Depth:** Number of jobs waiting
2. **Processing Rate:** Jobs completed per minute
3. **Failed Jobs:** Jobs that exhausted all retry attempts
4. **Average Wait Time:** Time from enqueue to processing

### Logs

Worker logs include:

- `WORKER_STARTED` - Worker initialized successfully
- `JOB_PROCESSING_START` - Job picked up for processing
- `JOB_COMPLETED` - Job finished successfully
- `JOB_FAILED` - Job failed (will retry)
- `WORKER_EVENT_FAILED` - Job exhausted all retries (moved to DLQ)

## Testing

### 1. Create Test Order

```bash
# Navigate to web app
open http://localhost:3000

# Create exchange order
# Check Bull Board: http://localhost:3003/api/admin/queues
```

### 2. Test Retry Mechanism

```bash
# Stop telegram-bot
# Create order (job will fail and retry)
# Check Bull Board - job should be in "Failed" with retry count
# Restart telegram-bot
# Job should be picked up and processed
```

### 3. Test Graceful Degradation

```bash
# Stop Redis
redis-cli shutdown

# Create order
# Check logs - should show fallback to direct send (if implemented)
```

## Migration from Direct Send

Old code (direct send):

```typescript
await sendOperatorNotifications(order, ...);
```

New code (queue-based):

```typescript
const { getTelegramQueue } = await import('@repo/utils/telegram-queue');
const queue = await getTelegramQueue();
await queue.enqueue({ orderId, notificationType, payload });
```

## References

- **Implementation Plan:** `docs/implementation/BULLMQ_INTEGRATION_PLAN.md`
- **Verification Report:** `docs/implementation/BULLMQ_PLAN_VERIFICATION_REPORT.md`
- **Producer:** `packages/utils/src/telegram-queue/telegram-queue-producer.ts`
- **Worker:** `apps/telegram-bot/src/workers/telegram-notification-worker.ts`
- **Constants:** `packages/constants/src/telegram-queue.ts`

## Support

For issues or questions:

1. Check this configuration guide
2. Review worker logs for error messages
3. Verify all environment variables are set correctly
4. Test Redis connectivity
5. Check Bull Board dashboard for queue state
