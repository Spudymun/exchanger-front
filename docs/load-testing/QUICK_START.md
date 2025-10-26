# 🚀 Быстрый запуск нагрузочного тестирования

## ⚡ Quick Start (TL;DR)

```powershell
# 1. Проверка готовности системы
.\scripts\health-check.ps1

# 2. (Опционально) Запуск Bull Board Dashboard для мониторинга
npm run dev:bull-board
# Открыть: http://localhost:3010

# 3. Запуск нагрузочного теста
node scripts/load-test-concurrent.mjs
```

## 📋 Полная последовательность

### 1. Подготовка окружения

```powershell
# Запуск сервисов
docker-compose up postgres redis -d

# Миграции БД
cd packages/session-management
npx prisma migrate dev
npx prisma generate
cd ..\..

# Запуск приложения
npm run dev
```

### 2. Health Check

```powershell
# Базовая проверка
.\scripts\health-check.ps1

# Если есть проблемы - смотри рекомендации в выводе
```

### 3. Мониторинг (опционально)

#### Bull Board Dashboard (рекомендуется)

```bash
# Запустить Bull Board Dashboard для мониторинга очередей и Redis
npm run dev:bull-board
# Открыть: http://localhost:3010
```

**Метрики доступные в Bull Board:**

- 📊 Redis connections и memory usage
- 📋 BullMQ jobs (waiting, active, completed, failed)
- 🔄 Retry information и backoff delays
- 💾 Queue operations в real-time

#### Docker Stats (для контейнеров)

```bash
# Мониторинг использования ресурсов
docker stats exchanger-postgres exchanger-redis
```

#### Prisma Studio (для БД)

```bash
# Просмотр данных БД в реальном времени
npm run db:studio
# Открыть: http://localhost:5555
```

### 4. Load Testing

```bash
# Основной инструмент (рекомендуется)
node scripts/load-test-concurrent.mjs
```

**Что тестируется:**

- 10 concurrent заявок (USDT-TRC20)
- Автоматическая подготовка БД
- Валидные карты украинских банков
- Wallet allocation и distribution
- Database performance

## 🔍 Альтернативные способы

### Ручное тестирование

```bash
# Один запрос для проверки
curl -X POST http://localhost:3000/api/trpc/exchange.createOrder \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","cryptoAmount":100,"currency":"USDT-TRC20"}'
```

## 📊 Что ожидать

### ✅ Успешный результат

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

### ⚠️ Возможные проблемы

- **Wallet pool exhausted** → Добавить кошельки в БД
- **High response times** → Проверить индексы БД
- **Database deadlocks** → Оптимизировать concurrent access
- **Redis connection failed** → Проверить Redis сервис

## 🛠️ Troubleshooting

### Проблема: API не отвечает

```powershell
# Проверка
Test-NetConnection localhost -Port 3000

# Решение
npm run dev
```

### Проблема: Database connection failed

```powershell
# Проверка
$env:DATABASE_URL
docker ps | grep postgres

# Решение
docker-compose up postgres -d
```

### Проблема: No available wallets

```sql
-- Добавить тестовые кошельки
INSERT INTO wallets (address, currency, status) VALUES
('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'BTC', 'available'),
('0x742d35Cc6634C0532925a3b8D430f1FB14F74f44', 'ETH', 'available'),
('TXYZabcd1234567890', 'USDT-TRC20', 'available');
```

## 🎯 Интерпретация результатов

| Метрика           | Отлично | Хорошо  | Плохо   |
| ----------------- | ------- | ------- | ------- |
| Success Rate      | 100%    | >90%    | <90%    |
| Avg Response Time | <500ms  | <2000ms | >2000ms |
| Queue Length      | 0       | 1-3     | >5      |
| DB Connections    | <10     | <50     | >50     |

## 🚀 Оптимизация после тестирования

### Если медленно

1. Добавить индексы в БД
2. Увеличить connection pool
3. Оптимизировать Redis

### Если много в очереди

1. Добавить кошельки
2. Оптимизировать FIFO алгоритм
3. Увеличить wallet pool

### Если ошибки

1. Проверить логи приложения
2. Анализировать database deadlocks
3. Проверить validation errors
