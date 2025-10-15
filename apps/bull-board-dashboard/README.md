# Bull Board Dashboard

Standalone мониторинг BullMQ очередей для ExchangeGO

## 🎯 Назначение

Production-ready standalone Express server для мониторинга `telegram-notifications` очереди через Bull Board UI.

## 🚀 Запуск

### Development

```bash
# Из корня монорепы
npm run dev:bull-board

# Или напрямую
cd apps/bull-board-dashboard
npm run dev
```

### Production

```bash
npm run start
```

### Docker

```bash
docker-compose up -d bull-board-dashboard
```

## 🔧 Конфигурация

### Environment Variables

| Variable         | Required | Default                  | Description                             |
| ---------------- | -------- | ------------------------ | --------------------------------------- |
| `REDIS_URL`      | ✅ Yes   | `redis://localhost:6379` | Redis connection URL                    |
| `REDIS_DB_QUEUE` | No       | `1`                      | Redis database index для очереди (0-15) |
| `PORT`           | No       | `3010`                   | HTTP server port                        |
| `NODE_ENV`       | No       | `development`            | Environment (development/production)    |

### Example `.env`

```properties
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_DB_QUEUE=1

# Server Configuration
PORT=3010
NODE_ENV=development
```

## 📡 API Endpoints

### Dashboard UI

- **URL**: `http://localhost:3010/`
- **Description**: Bull Board UI для мониторинга очереди
- **Access**: Public (TODO: добавить authentication в production)

### Health Check

- **URL**: `http://localhost:3010/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "bull-board-dashboard",
    "timestamp": "2025-10-14T...",
    "uptime": 123.456
  }
  ```

## 🏗️ Архитектура

### Design Decisions

1. **Standalone Express Server**
   - ✅ Независим от telegram-bot приложения
   - ✅ Работает даже если telegram-bot crashed
   - ✅ Минимальные зависимости
   - ✅ Простая конфигурация

2. **Read-Only Connection**
   - ✅ Безопасный доступ к очереди
   - ✅ Не влияет на Worker operations
   - ✅ BullMQ использует Redis BLPOP (non-blocking для readers)

3. **Production-Ready**
   - ✅ Graceful shutdown (SIGTERM/SIGINT)
   - ✅ Health check endpoint для Docker
   - ✅ Structured JSON logging
   - ✅ Error handling с fallbacks
   - ✅ Security headers

### Technology Stack

- **Express**: HTTP server
- **BullMQ**: Queue client (read-only)
- **Bull Board**: Monitoring UI
- **IORedis**: Redis connection

## 🐳 Docker Integration

### Service Configuration

```yaml
bull-board-dashboard:
  build:
    context: .
    dockerfile: ./apps/bull-board-dashboard/Dockerfile
  container_name: exchanger-bull-board
  restart: unless-stopped
  environment:
    - NODE_ENV=development
    - REDIS_URL=redis://redis:6379
    - REDIS_DB_QUEUE=1
    - PORT=3010
  ports:
    - '3010:3010'
  networks:
    - exchanger-network
  depends_on:
    redis:
      condition: service_healthy
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:3010/health']
    interval: 30s
    timeout: 10s
    retries: 3
```

## 📊 Monitoring Features

### Available Metrics

- **Jobs Count**: Waiting, Active, Completed, Failed, Delayed
- **Job Details**: Payload, Progress, Timestamps, Attempts
- **Retry Information**: Retry count, Backoff delays, Next retry time
- **Dead Letter Queue**: Failed jobs after max attempts
- **Manual Actions**: Retry job, Delete job, Clean queue

### Queue Operations

- ✅ **View Jobs**: Real-time job list with filters
- ✅ **Job Details**: Full payload и metadata
- ✅ **Retry Failed**: Manual retry для DLQ jobs
- ✅ **Clean Queue**: Bulk cleanup operations
- ⚠️ **Add Job**: Disabled в production (security)

## 🔒 Security Considerations

### Current State (Development)

- ❌ No authentication
- ❌ Public access
- ✅ Read-only Redis connection
- ✅ Security headers
- ✅ CORS disabled

### Production TODO

```javascript
// TODO: Добавить basic auth middleware
app.use(
  '/dashboard',
  basicAuth({
    users: { admin: process.env.DASHBOARD_PASSWORD },
    challenge: true,
  })
);
```

## 🛠️ Troubleshooting

### Server Not Starting

```bash
# Check Redis connection
docker exec exchanger-redis redis-cli -n 1 ping
# Expected: PONG

# Check port availability
netstat -ano | findstr :3010
```

### Dashboard Empty

```bash
# Verify queue exists
docker exec exchanger-redis redis-cli -n 1 KEYS "bull:telegram-notifications:*"

# Check worker is running
docker logs exchanger-telegram-bot | grep "WORKER_STARTED"
```

### Connection Refused

```bash
# Check Docker network
docker network inspect exchanger-network

# Verify service health
docker ps | grep bull-board
curl http://localhost:3010/health
```

## 📚 Related Documentation

- [BullMQ Integration Plan](../../docs/implementation/BULLMQ_INTEGRATION_PLAN.md)
- [Bull Board Official Docs](https://github.com/felixmosh/bull-board)
- [Docker Network Guide](../../docs/docker/DOCKER_NETWORK_AUTH_GUIDE.md)
- [Redis Configuration](../../docs/docker/redis.md)

## 🔄 Migration from telegram-bot

Этот сервис заменяет Bull Board интеграцию внутри `apps/telegram-bot`:

### Removed Files

- ❌ `apps/telegram-bot/pages/api/admin/queues/[[...path]].ts`
- ❌ `apps/telegram-bot/src/bull-board/bull-board-setup.ts`
- ❌ `apps/telegram-bot/src/bull-board/index.ts`

### Removed Dependencies

```json
// Removed from apps/telegram-bot/package.json
{
  "@bull-board/api": "^6.7.3",
  "@bull-board/express": "^6.7.3"
}
```

### Migration Checklist

- [x] Create standalone Express server
- [x] Configure Docker service
- [ ] Remove Bull Board from telegram-bot
- [ ] Update turbo.json dev tasks
- [ ] Update documentation references
- [ ] Add authentication middleware (production)

## 📝 Development Notes

### Code Structure

```
apps/bull-board-dashboard/
├── server.js           # Main Express server (ESM)
├── package.json        # Dependencies и scripts
├── tsconfig.json       # TypeScript config (type checking only)
├── .env.example        # Environment variables template
├── Dockerfile          # Production Docker image
└── README.md           # This file
```

### Testing Locally

```bash
# Terminal 1: Start Redis
docker-compose up -d redis

# Terminal 2: Start Bull Board
cd apps/bull-board-dashboard
npm run dev

# Terminal 3: Create test job (через web app)
# Open http://localhost:3000 → Create order

# Terminal 4: Check dashboard
# Open http://localhost:3010
```

## 🎯 Success Criteria

- [x] Standalone server на порту 3010
- [x] Graceful shutdown support
- [x] Health check endpoint
- [x] Production-ready logging
- [x] Docker integration
- [ ] Authentication middleware
- [ ] Integration tests
- [ ] Load testing (concurrent connections)

---

**Последнее обновление**: 14 октября 2025  
**Версия**: 1.0.0  
**Автор**: ExchangeGO Team
