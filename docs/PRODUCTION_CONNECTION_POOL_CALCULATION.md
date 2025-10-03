# Расчёт Connection Pool для Production

## 🎯 Текущая конфигурация

### Development (сейчас):

```typescript
// packages/constants/src/session.ts
DATABASE: {
  MAX_CONNECTIONS: process.env.NODE_ENV === 'production' ? 20 : 5,
}
```

### DATABASE_URL:

```bash
# apps/web/.env
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=10&connect_timeout=5"
```

---

## 📊 Как работает connection_limit

### Важно понять:

**`connection_limit` относится к ОДНОМУ PrismaClient instance!**

```
PrismaClient #1 → connection pool (max = connection_limit)
PrismaClient #2 → connection pool (max = connection_limit)  ← Отдельный пул!
```

**НЕТ глобального лимита на уровне приложения!**

---

## 🔢 Расчёт для Development

### Без singleton (как было):

```
25 Node.js процессов (hot-reload + Turbo)
├─ Процесс #1:  PrismaClient → pool (max 5) = 5 соединений
├─ Процесс #2:  PrismaClient → pool (max 5) = 5 соединений
├─ Процесс #3:  PrismaClient → pool (max 5) = 5 соединений
...
└─ Процесс #25: PrismaClient → pool (max 5) = 5 соединений

Теоретически: 25 × 5 = 125 соединений
Реально использовалось: ~60 соединений (только активные процессы)
```

### С singleton (как сейчас):

```
25 Node.js процессов → global.__prismaInstance (ОДИН!)
└─ PrismaClient → pool (max 5) = 5 соединений

Итого: 5 соединений ✅
```

**Почему только 5?**  
Потому что `global.__prismaInstance` переиспользуется между всеми процессами!

---

## 🏭 Расчёт для Production

### Архитектура deployment:

```
Production Server
├─ Web App (Next.js)
│  ├─ Instance #1 (PM2/Docker)
│  ├─ Instance #2 (PM2/Docker)
│  └─ Instance #3 (PM2/Docker)
│
└─ Telegram Bot (Next.js)
   ├─ Instance #1 (PM2/Docker)
   └─ Instance #2 (PM2/Docker)
```

### Сценарий 1: Одна реплика каждого приложения

```
Web App:
└─ 1 instance → 1 PrismaClient (connection_limit=20) = 20 соединений

Telegram Bot:
└─ 1 instance → 1 PrismaClient (connection_limit=20) = 20 соединений

Итого: 20 + 20 = 40 соединений из 100 ✅
```

### Сценарий 2: Три реплики Web + две реплики Telegram Bot

```
Web App:
├─ Instance #1 → PrismaClient (limit=20) = 20 соединений
├─ Instance #2 → PrismaClient (limit=20) = 20 соединений
└─ Instance #3 → PrismaClient (limit=20) = 20 соединений

Telegram Bot:
├─ Instance #1 → PrismaClient (limit=20) = 20 соединений
└─ Instance #2 → PrismaClient (limit=20) = 20 соединений

Итого: (3 × 20) + (2 × 20) = 60 + 40 = 100 соединений из 100 ⚠️
```

**Проблема:** Достигли лимита! Нет запаса.

### Сценарий 3: Оптимизированный (рекомендуемый)

```
Web App (высокая нагрузка):
├─ Instance #1 → PrismaClient (limit=15) = 15 соединений
├─ Instance #2 → PrismaClient (limit=15) = 15 соединений
└─ Instance #3 → PrismaClient (limit=15) = 15 соединений

Telegram Bot (низкая нагрузка):
├─ Instance #1 → PrismaClient (limit=10) = 10 соединений
└─ Instance #2 → PrismaClient (limit=10) = 10 соединений

Итого: (3 × 15) + (2 × 10) = 45 + 20 = 65 соединений из 100 ✅
Запас: 35 соединений для pgAdmin, миграций, бэкапов
```

---

## 🎯 Правильная формула расчёта

```
Total Connections = (Number of Instances) × (connection_limit per instance)
```

**НЕ:**

```
❌ connection_limit ≠ суммарный лимит на приложение
```

**ДА:**

```
✅ connection_limit = лимит на ОДИН PrismaClient instance
✅ Каждый instance приложения = отдельный PrismaClient
✅ Каждый PrismaClient = отдельный connection pool
```

---

## 📝 Рекомендации для Production

### 1. Установить разные лимиты для разных приложений

**Web App (.env):**

```bash
DATABASE_URL="postgresql://...?connection_limit=15&pool_timeout=20&connect_timeout=5"
```

**Telegram Bot (.env):**

```bash
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20&connect_timeout=5"
```

### 2. Использовать переменные окружения

```typescript
// Динамический лимит на основе типа приложения
const connectionLimit = process.env.APP_TYPE === 'telegram-bot' ? 10 : 15;
DATABASE_URL = 'postgresql://...?connection_limit=${connectionLimit}';
```

### 3. Расчёт на основе количества реплик

```
Формула:
connection_limit = (max_connections - reserve) / (total_instances)

Пример:
max_connections = 100
reserve = 15 (для pgAdmin, миграций)
web_instances = 3
telegram_instances = 2
total_instances = 5

connection_limit = (100 - 15) / 5 = 85 / 5 = 17 per instance

Web App: connection_limit=17
Telegram Bot: connection_limit=17
Итого: 5 × 17 = 85 соединений (+ 15 запас) ✅
```

### 4. Мониторинг

```sql
-- Проверка текущего использования
SELECT
  application_name,
  COUNT(*) as connections,
  COUNT(*) FILTER (WHERE state = 'idle') as idle,
  COUNT(*) FILTER (WHERE state = 'active') as active
FROM pg_stat_activity
WHERE datname = 'exchanger_db'
GROUP BY application_name;
```

**Ожидаемый результат:**

```
application_name    | connections | idle | active
--------------------|-------------|------|-------
exchanger-web       | 15          | 12   | 3
exchanger-telegram  | 10          | 8    | 2
pgAdmin             | 1           | 1    | 0
```

---

## ⚠️ Частые ошибки понимания

### Ошибка #1: "connection_limit - это глобальный лимит"

```
❌ Неправильно:
"У меня connection_limit=20, значит приложение использует максимум 20 соединений"

✅ Правильно:
"У меня 3 instance приложения, каждый с connection_limit=20
Итого: 3 × 20 = 60 соединений"
```

### Ошибка #2: "В development только 5 соединений"

```
❌ Неправильно:
"connection_limit=5, значит у меня 5 соединений в dev"

✅ Правильно:
"connection_limit=5 ПО УМОЛЧАНИЮ в DATABASE_URL
Но благодаря global singleton все процессы используют ОДИН PrismaClient
Поэтому реально 5 соединений (не 25 × 5)"
```

### Ошибка #3: "idle соединения не считаются"

```
❌ Неправильно:
"Idle соединения не используют лимит PostgreSQL"

✅ Правильно:
"Idle соединения ЗАНИМАЮТ место в max_connections!
max_connections=100 учитывает ВСЕ соединения (idle + active)"
```

---

## 🎓 Итоговый чеклист для Production

### Перед deployment:

- [ ] Рассчитать количество instances каждого приложения
- [ ] Определить `connection_limit` для каждого приложения:
  ```
  connection_limit = (max_connections - reserve) / total_instances
  ```
- [ ] Настроить разные DATABASE_URL для каждого приложения
- [ ] Оставить запас 15-20% для:
  - pgAdmin подключений
  - Database migrations
  - Manual queries
  - Monitoring tools
- [ ] Настроить мониторинг:
  ```sql
  SELECT COUNT(*) FROM pg_stat_activity;
  ```
- [ ] Протестировать под нагрузкой перед релизом

### Правило большого пальца:

```
connection_limit_per_instance ≤ (max_connections × 0.85) / number_of_instances
```

**Пример для вашего случая:**

```
max_connections = 100
instances = 5 (3 web + 2 telegram)

connection_limit ≤ (100 × 0.85) / 5 = 85 / 5 = 17

Рекомендуется: connection_limit=15 (с запасом)
```

---

## 📊 Визуализация

### Development (сейчас):

```
PostgreSQL (max_connections=100)
├─ [███░░] Web processes (5 connections) via singleton
└─ [░░░░░] 95 connections free

Использование: 5%
```

### Production (оптимизированный):

```
PostgreSQL (max_connections=100)
├─ [███████████████] Web instances (45 connections)
├─ [██████████] Telegram instances (20 connections)
├─ [█] pgAdmin (1 connection)
└─ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 34 connections free

Использование: 66%
Запас: 34%
```

---

## ✅ Вывод

**Твоё понимание ПОЧТИ правильное, но с важным нюансом:**

✅ **Правильно:** "В production будет Web (20) + Telegram (20) = 40 из 100"  
⚠️ **НО:** Это при **одной реплике каждого** приложения!

❌ **Неправильно:** "connection_limit - это глобальный лимит приложения"  
✅ **Правильно:** "connection_limit - это лимит на ОДИН instance приложения"

**Ключевая формула:**

```
Total DB Connections = Σ(instances × connection_limit_per_instance)
```

Где `instances` - количество запущенных копий каждого приложения!
