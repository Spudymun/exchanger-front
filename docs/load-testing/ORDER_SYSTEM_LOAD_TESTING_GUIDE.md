# 🧪 Руководство по нагрузочному тестированию Order System

## 📋 Описание

Скрипты для тестирования создания 10 одновременных заявок с целью проверки:

- **Wallet Allocation System** - распределение кошельков и очередь
- **PostgreSQL Performance** - deadlocks, race conditions, связи между таблицами
- **Redis Queue Management** - производительность очереди заявок
- **tRPC API под нагрузкой** - реальные запросы к `exchange.createOrder`

## 🎯 Архитектурная основа

Тестирование основано на **РЕАЛЬНОЙ** архитектуре проекта:

### База данных (PostgreSQL)

```sql
-- Основные таблицы для тестирования:
users          -- автоматическая регистрация пользователей
sessions       -- создание сессий для новых пользователей
orders         -- создание заявок с валидацией
wallets        -- выделение кошельков (AVAILABLE → ALLOCATED)
wallet_queue   -- управление очередью при нехватке кошельков
order_audit_logs -- аудит изменений статусов
```

### API (tRPC)

```typescript
// Реальный эндпоинт:
exchange.createOrder: rateLimitMiddleware.createOrder
  .input(securityEnhancedCreateExchangeOrderSchema)
  .mutation(async ({ input, ctx }) => {
    // Полный цикл: validation → user creation → wallet allocation → email → telegram
  })
```

### Validation Schema

```typescript
// Схема валидации из packages/utils:
securityEnhancedCreateExchangeOrderSchema = z.object({
  email: xssProtectedEmailSchema,
  cryptoAmount: z.number().positive().finite(),
  currency: currencySchema, // BTC, ETH, USDT-TRC20, USDT-ERC20
  tokenStandard: z.enum(['TRC-20', 'ERC-20']).optional(),
  recipientData: z
    .object({
      cardNumber: securityEnhancedCardNumberSchema.optional(),
      bankId: z.string().optional(), // monobank, privat, oschadbank, pumb
    })
    .optional(),
});
```

## 🚀 Запуск тестирования

### Вариант 1: PowerShell (Рекомендуется для Windows)

```powershell
# Базовый запуск (10 заявок на localhost:3000)
.\scripts\load-test-orders.ps1

# Расширенные параметры
.\scripts\load-test-orders.ps1 -ApiBaseUrl "http://localhost:3000" -ConcurrentOrders 10 -TimeoutSeconds 30 -DetailedLogging

# Тестирование на production URL
.\scripts\load-test-orders.ps1 -ApiBaseUrl "https://your-domain.com" -ConcurrentOrders 5
```

### Вариант 2: Node.js (Кроссплатформенно)

```bash
# Установка зависимостей (если нужно)
npm install node-fetch

# Базовый запуск
node scripts/load-test-orders.mjs

# С переменными окружения
API_BASE_URL=http://localhost:3000 DETAILED_LOGGING=true node scripts/load-test-orders.mjs
```

## 📊 Что тестируется

### Реалистичные тестовые данные

```javascript
// 10 разных заявок с валидными данными:
const testOrders = [
  {
    email: 'loadtest1@example.com',
    cryptoAmount: 100,
    currency: 'USDT-TRC20',
    tokenStandard: 'TRC-20',
    recipientData: {
      cardNumber: '4149 4978 0323 7281', // Валидная карта Visa
      bankId: 'monobank',
    },
  },
  // ... 9 других заявок с разными валютами, суммами, банками
];
```

### Проверяемые сценарии

1. **Параллельное создание пользователей**
   - AutoRegistrationService.ensureUserWithSession()
   - 10 новых email → 10 новых пользователей

2. **Выделение кошельков (Wallet Allocation)**
   - WalletPoolManagerFactory.allocateWallet()
   - FIFO распределение available кошельков
   - Race conditions при одновременном доступе

3. **Система очередей**
   - Превышение лимита кошельков → WalletQueue
   - FIFO обработка очереди
   - Redis производительность

4. **Database Performance**
   - Concurrent INSERT в orders, users, sessions
   - Foreign key constraints
   - Potential deadlocks

5. **Email отправка**
   - RateLimitedEmailService.sendCryptoAddress()
   - 10 одновременных email

6. **Telegram уведомления**
   - sendTelegramNotification() для операторов

## 📈 Интерпретация результатов

### Успешный результат

```
📊 LOAD TEST RESULTS
═══════════════════════════════════════════════════════════════════════════════
📈 SUMMARY:
   Total Orders: 10
   ✅ Successful: 10
   ❌ Failed: 0
   🎯 Success Rate: 100%
   ⏱️  Total Time: 2847ms

⚡ PERFORMANCE:
   📊 Avg Response Time: 284ms
   🚀 Min Response Time: 156ms
   🐌 Max Response Time: 445ms
```

### Возможные проблемы

#### ❌ Wallet Pool Exhausted

```
⚠️ 7 orders were queued - wallet pool may need expansion

// Решение: Добавить больше кошельков в таблицу wallets
```

#### ❌ Database Deadlocks

```
❌ Order 3: Database error - deadlock detected
❌ Order 7: Database error - could not serialize access

// Решение: Оптимизировать порядок блокировок или isolation level
```

#### ❌ High Response Times

```
🐌 Max Response Time: 12547ms
⚠️ High response times detected - check database performance

// Решение: Проверить индексы, connection pool, query performance
```

## 🔍 Мониторинг во время тестирования

### 1. Database Monitoring

```sql
-- Активные подключения
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Заблокированные запросы
SELECT blocked_locks.pid, blocked_activity.usename, blocked_activity.query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid;

-- Состояние кошельков
SELECT status, count(*) FROM wallets GROUP BY status;

-- Очередь заявок
SELECT count(*) FROM wallet_queue WHERE processed_at IS NULL;
```

### 2. Redis Monitoring

```bash
# Redis stats
redis-cli info stats

# Queue length
redis-cli llen wallet:queue

# Memory usage
redis-cli info memory
```

### 3. Application Logs

```bash
# Логи Next.js приложения
npm run dev

# Следить за логами в консоли:
# - WALLET_ALLOCATION_FAILED
# - CRITICAL_WALLET_ALLOCATION_ERROR
# - ORDER_CREATED_SUCCESSFULLY
# - QUEUE_PROCESSING
```

## ⚠️ Предварительные требования

### 1. Запущенные сервисы

```bash
# Убедитесь что запущены:
✅ PostgreSQL (DATABASE_URL настроен)
✅ Redis (REDIS_URL настроен)
✅ Next.js приложение (npm run dev)
✅ Telegram Bot (опционально)
```

### 2. Environment Variables

```bash
# .env файл должен содержать:
DATABASE_URL="postgresql://user:password@localhost:5432/exchanger_db"
REDIS_URL="redis://localhost:6379"
EMAIL_PROVIDER="development"  # для тестирования
TELEGRAM_BOT_TOKEN="xxx"      # опционально
```

### 3. Database Schema

```bash
# Примените миграции Prisma:
cd packages/session-management
npx prisma migrate dev
npx prisma generate
```

## 📋 Чеклист перед тестированием

- [ ] ✅ Все сервисы запущены (PostgreSQL, Redis, Next.js)
- [ ] ✅ DATABASE_URL и REDIS_URL настроены
- [ ] ✅ Применены миграции БД
- [ ] ✅ В таблице `wallets` есть доступные кошельки
- [ ] ✅ API доступно по http://localhost:3000/api/health
- [ ] ✅ Достаточно свободного места в БД
- [ ] ✅ Email сервис настроен (хотя бы development mode)

## 🎯 Расширенное тестирование

### Stress Testing (больше нагрузки)

```powershell
# 20 одновременных заявок
.\scripts\load-test-orders.ps1 -ConcurrentOrders 20

# 50 заявок с таймаутом 60 секунд
.\scripts\load-test-orders.ps1 -ConcurrentOrders 50 -TimeoutSeconds 60
```

### Edge Cases Testing

```powershell
# Тест на исчерпание кошельков
# 1. Установить все кошельки в статус ALLOCATED
# 2. Запустить тест - все должны попасть в очередь

# Тест на database deadlocks
# Запустить несколько экземпляров одновременно
```

### Performance Profiling

```bash
# Мониторинг во время выполнения:
# Terminal 1: Database metrics
watch -n 1 'psql $DATABASE_URL -c "SELECT status, count(*) FROM wallets GROUP BY status;"'

# Terminal 2: Redis metrics
watch -n 1 'redis-cli info stats | grep instantaneous'

# Terminal 3: Load test
.\scripts\load-test-orders.ps1 -DetailedLogging
```

## 📝 Результаты и выводы

После тестирования:

1. **Документируйте bottlenecks** - где система показала слабые места
2. **Анализируйте wallet allocation** - достаточно ли кошельков, работает ли FIFO
3. **Проверьте queue system** - корректно ли обрабатывается очередь
4. **Оцените database performance** - нет ли deadlocks, медленных запросов
5. **Планируйте оптимизации** - на основе выявленных проблем

Это даст понимание готовности системы к реальной нагрузке и поможет выявить узкие места до production deploy.
