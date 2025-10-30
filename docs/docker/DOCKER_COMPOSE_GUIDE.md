# Docker Compose: Полное руководство для Windows 11 + PowerShell

> **Целевое окружение:** Windows 11, PowerShell, Docker Desktop  
> **Версия Docker:** 28.2.2  
> **Версия Docker Compose:** v2.37.1-desktop.1  
> **Синтаксис команд:** `docker compose` (v2, не docker-compose)

---

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Архитектура стеков](#архитектура-стеков)
- [Development окружение](#development-окружение)
- [Production окружение](#production-окружение)
- [Общие операции](#общие-операции)
- [Troubleshooting](#troubleshooting)
- [Справочник команд](#справочник-команд)

---

## 🚀 Быстрый старт

### Development (быстрый запуск)

```powershell
# 1. Запустить базовые сервисы (web + telegram-bot + bull-board + databases)
docker compose up -d

# 2. Запустить ВСЕ сервисы включая инструменты (pgAdmin + Redis Commander)
docker compose --profile development up -d

# 3. Проверить статус
docker compose ps

# 4. Посмотреть логи
docker compose logs -f web
```

### Production (быстрый запуск)

```powershell
# 1. Проверить .env.production
cat .env.production

# 2. Собрать образы
docker compose -f docker-compose.production.yml --env-file .env.production build

# 3. Запустить
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# 4. Проверить health checks
docker compose -f docker-compose.production.yml --env-file .env.production ps
```

---

## 🏗️ Архитектура стеков

### Development Stack (docker-compose.yml)

```
┌─────────────────────────────────────────────────────┐
│           exchanger-dev-network (bridge)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐     ┌─────────────┐     ┌──────────┐ │
│  │   Web    │────▶│ PostgreSQL  │     │  Redis   │ │
│  │ :3000    │     │   :5432     │◀────│  :6379   │ │
│  └──────────┘     └─────────────┘     └──────────┘ │
│       │                  │                  │       │
│       │                  │                  │       │
│  ┌────▼──────┐     ┌────▼─────┐      ┌────▼─────┐ │
│  │ Telegram  │     │ PgAdmin  │      │  Redis   │ │
│  │   Bot     │     │  :8080   │      │Commander │ │
│  └───────────┘     └──────────┘      │  :8081   │ │
│       │            (profile:dev)      └──────────┘ │
│       │                               (profile:dev)│
│  ┌────▼──────┐                                     │
│  │Bull Board │                                     │
│  │  :3010    │                                     │
│  └───────────┘                                     │
│                                                     │
└─────────────────────────────────────────────────────┘

Volumes:
  - postgres_dev_data      → /var/lib/postgresql/data
  - redis_dev_data         → /data
  - pgadmin_data           → /var/lib/pgadmin
```

**Особенности Development:**

- **Exposed порты:** PostgreSQL (5432), Redis (6379) доступны с хоста
- **NODE_ENV:** development
- **Database init:** `npx prisma db push` (без миграций, сразу синхронизация схемы)
- **Seeding:** Опциональный (задаётся через AUTO_SEED_DB=true)
- **Restart policy:** unless-stopped (не автоперезапуск при падении)
- **Profiles:** `development` для pgAdmin и Redis Commander (запускаются только с --profile)
- **Health checks:** 30s interval, 120s start_period для приложений
- **Entrypoint:** scripts/docker/entrypoint-web-dev.sh

### Production Stack (docker-compose.production.yml)

```
┌─────────────────────────────────────────────────────┐
│          exchanger-prod-network (bridge)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐     ┌─────────────┐     ┌──────────┐ │
│  │   Web    │────▶│ PostgreSQL  │     │  Redis   │ │
│  │ :3000 ▓▓▓│     │ (internal)  │◀────│(internal)│ │
│  └──────────┘     └─────────────┘     └──────────┘ │
│       │                  │                  │       │
│       │                  │                  │       │
│  ┌────▼──────┐           │                  │       │
│  │ Telegram  │───────────┘                  │       │
│  │   Bot     │──────────────────────────────┘       │
│  └───────────┘                                      │
│       │                                             │
│  ┌────▼──────┐                                      │
│  │Bull Board │                                      │
│  │ :3010 ▓▓▓ │                                      │
│  └───────────┘                                      │
│                                                     │
│  ▓▓▓ = Exposed to host                             │
└─────────────────────────────────────────────────────┘

Volumes:
  - postgres_data_prod     → /var/lib/postgresql/data
  - redis_data_prod        → /data
```

**Особенности Production:**

- **Exposed порты:** ТОЛЬКО web (3000) и bull-board (3010)
- **Databases:** PostgreSQL и Redis НЕ доступны с хоста (только внутри сети)
- **NODE_ENV:** production
- **Database init:** `npx prisma migrate deploy` (строгие миграции)
- **Seeding:** Автоматический при первом запуске (seed-usdt-wallets.sql, seed-uah-banks.sql)
- **Restart policy:** always (автоперезапуск при падении и после перезагрузки системы)
- **Build args:** NODE_ENV=production, NODE_OPTIONS=--max-old-space-size=4096, shm_size=2gb
- **Health checks:** 30s interval, 180s start_period (дольше из-за migrations)
- **Resource limits:** CPU/Memory limits для всех сервисов
- **Redis security:** --requirepass + protected-mode yes
- **Entrypoint:** scripts/docker/entrypoint-web-prod.sh

---

## 💻 Development окружение

### Предварительные требования

**Проверить версии:**

```powershell
# Docker Desktop версии
docker --version
# Должно быть: Docker version 28.2.2 или новее

docker compose version
# Должно быть: Docker Compose version v2.37.1 или новее
```

**Проверить запущен ли Docker Desktop:**

```powershell
docker info
# Если ошибка - запустите Docker Desktop
```

### Настройка переменных окружения

**Файл .env уже существует в корне проекта.**

Проверить содержимое:

```powershell
cat .env
```

Основные переменные для Development:

```env
# Telegram Bot (обязательно для telegram-bot сервиса)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-ngrok-url.ngrok.io
TELEGRAM_OPERATOR_IDS=12345678,87654321

# PostgreSQL (есть fallback значения в docker-compose.yml)
POSTGRES_DB=exchanger_db
POSTGRES_USER=exchanger_user
POSTGRES_PASSWORD=exchanger_password
POSTGRES_PORT=5432

# Redis (есть fallback значения)
REDIS_PORT=6379

# Bull Board (есть fallback значения)
BULL_BOARD_USER=admin
BULL_BOARD_PASSWORD=admin123

# Опциональные
AUTO_SEED_DB=false  # true = автоматический seed при первом запуске
```

> **Важно:** Если переменные не указаны, используются значения по умолчанию:  
> `${POSTGRES_USER:-exchanger_user}` → exchanger_user

### Сборка образов

**Базовые сервисы (без инструментов):**

```powershell
docker compose build
```

Это соберёт образы для:

- web (apps/web/Dockerfile)
- telegram-bot (apps/telegram-bot/Dockerfile)
- bull-board-dashboard (apps/bull-board-dashboard/Dockerfile)

**Сборка конкретного сервиса:**

```powershell
docker compose build web
docker compose build telegram-bot
docker compose build bull-board-dashboard
```

**Пересборка без кэша (если были изменения в Dockerfile):**

```powershell
docker compose build --no-cache web
```

### Запуск сервисов

**Вариант 1: Базовые сервисы (без pgAdmin и Redis Commander)**

```powershell
docker compose up -d
```

Запускаются:

- web (Next.js на :3000)
- telegram-bot (BullMQ worker)
- bull-board-dashboard (UI для очередей на :3010)
- postgres-dev (PostgreSQL на :5432)
- redis-dev (Redis на :6379)

**Вариант 2: ВСЕ сервисы включая инструменты**

```powershell
docker compose --profile development up -d
```

Дополнительно запускаются:

- pgadmin (на :8080)
- redis-commander (на :8081)

**Запуск без фонового режима (с выводом логов):**

```powershell
docker compose up
# Ctrl+C для остановки
```

**Запуск конкретного сервиса и его зависимостей:**

```powershell
docker compose up -d web
# Автоматически запустит postgres-dev и redis-dev
```

### Первый запуск (что происходит внутри)

**Web сервис (entrypoint-web-dev.sh):**

1. Ждёт доступности PostgreSQL (ping через psql)
2. Выполняет `npx prisma db push` (синхронизация схемы БД)
3. Если `AUTO_SEED_DB=true` → выполняет SQL скрипты из packages/session-management/scripts/
4. Запускает `npm run dev` (Next.js dev server)

**Telegram Bot:**

1. Ждёт доступности PostgreSQL и Redis
2. Ждёт доступности Web сервиса (требуется для API contract типов)
3. Запускает Next.js сервер + BullMQ worker

**Bull Board Dashboard:**

1. Ждёт доступности Redis
2. Запускает Express сервер с Bull Board UI

### Проверка статуса

```powershell
# Список запущенных контейнеров
docker compose ps

# Детальная информация с health checks
docker compose ps --format json | ConvertFrom-Json | Format-Table Name, State, Health
```

Пример вывода:

```
NAME                          STATUS                   HEALTH
exchanger-web-dev             Up 2 minutes             healthy
exchanger-telegram-bot-dev    Up 2 minutes             healthy
exchanger-bull-board-dev      Up 2 minutes             healthy
exchanger-postgres-dev        Up 2 minutes (healthy)   healthy
exchanger-redis-dev           Up 2 minutes (healthy)   healthy
```

**Health check timing:**

- Приложения: проверка каждые 30s, первая через 120s после старта
- Базы данных: проверка каждые 10s, первая через 10s

### Доступ к сервисам

| Сервис              | URL                   | Credentials (default)               |
| ------------------- | --------------------- | ----------------------------------- |
| Web (Next.js)       | http://localhost:3000 | -                                   |
| Bull Board          | http://localhost:3010 | admin / admin123                    |
| PgAdmin             | http://localhost:8080 | admin@admin.com / admin             |
| Redis Commander     | http://localhost:8081 | -                                   |
| PostgreSQL (direct) | localhost:5432        | exchanger_user / exchanger_password |
| Redis (direct)      | localhost:6379        | (no password)                       |

**Подключение к PostgreSQL из DBeaver/TablePlus:**

```
Host:     localhost
Port:     5432
Database: exchanger_db
User:     exchanger_user
Password: exchanger_password
```

**Подключение к Redis из RedisInsight:**

```
Host: localhost
Port: 6379
Name: exchanger-dev
```

### Просмотр логов

**Все сервисы (follow mode):**

```powershell
docker compose logs -f
```

**Конкретный сервис:**

```powershell
docker compose logs -f web
docker compose logs -f telegram-bot
docker compose logs -f bull-board-dashboard
```

**Последние N строк:**

```powershell
docker compose logs --tail 100 web
```

**Логи с timestamp:**

```powershell
docker compose logs -f -t web
```

**Логи нескольких сервисов:**

```powershell
docker compose logs -f web telegram-bot
```

### Остановка сервисов

**Остановить все сервисы (сохраняя контейнеры и volumes):**

```powershell
docker compose stop
```

**Остановить и удалить контейнеры (volumes сохраняются):**

```powershell
docker compose down
```

**Остановить + удалить volumes (ПОТЕРЯ ДАННЫХ):**

```powershell
docker compose down -v
```

**Остановить конкретный сервис:**

```powershell
docker compose stop web
```

### Перезапуск сервисов

**Перезапустить все:**

```powershell
docker compose restart
```

**Перезапустить конкретный сервис:**

```powershell
docker compose restart web
```

**Пересоздать контейнер (применить изменения в docker-compose.yml):**

```powershell
docker compose up -d --force-recreate web
```

### Выполнение команд внутри контейнеров

**Интерактивный shell (bash/sh):**

```powershell
docker compose exec web sh
# Внутри контейнера Alpine (нет bash)
```

**Выполнить команду без входа:**

```powershell
docker compose exec web npm run build
docker compose exec web npx prisma studio
```

**Выполнить команду в остановленном контейнере:**

```powershell
docker compose run --rm web npm install новая-зависимость
```

**Prisma commands:**

```powershell
# Открыть Prisma Studio
docker compose exec web npx prisma studio

# Синхронизировать схему БД
docker compose exec web npx prisma db push

# Сбросить БД (ОПАСНО)
docker compose exec web npx prisma migrate reset
```

### Доступ к базам данных через CLI

**PostgreSQL (psql):**

```powershell
docker compose exec postgres-dev psql -U exchanger_user -d exchanger_db
```

Внутри psql:

```sql
\dt          -- список таблиц
\d users     -- структура таблицы users
SELECT * FROM users LIMIT 10;
\q           -- выход
```

**Redis (redis-cli):**

```powershell
docker compose exec redis-dev redis-cli
```

Внутри redis-cli:

```
PING           # проверка соединения
KEYS *         # список всех ключей (НЕ на production!)
GET key_name   # получить значение
QUIT           # выход
```

---

## 🚀 Production окружение

### ⚠️ Критические отличия от Development

| Аспект                  | Development                   | Production                                                                       |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| **ENV файл**            | `.env` (автоматически)        | `.env.production` (явно указывать)                                               |
| **Синтаксис команд**    | `docker compose ...`          | `docker compose -f docker-compose.production.yml --env-file .env.production ...` |
| **Exposed порты**       | PostgreSQL :5432, Redis :6379 | ТОЛЬКО web :3000, bull-board :3010                                               |
| **Database init**       | `prisma db push`              | `prisma migrate deploy`                                                          |
| **Restart policy**      | unless-stopped                | always                                                                           |
| **Resource limits**     | Нет                           | CPU + Memory limits                                                              |
| **Build args**          | Нет                           | NODE_ENV=production, shm_size=2gb                                                |
| **Health start_period** | 120s                          | 180s                                                                             |
| **Redis security**      | Нет пароля                    | --requirepass + protected-mode                                                   |

### Предварительные требования

**1. Проверить версии (аналогично Development)**

```powershell
docker --version        # 28.2.2+
docker compose version  # v2.37.1+
```

**2. Убедиться что Development стек остановлен:**

```powershell
docker compose ps
# Если есть запущенные контейнеры:
docker compose down
```

> **Важно:** Development и Production стеки используют РАЗНЫЕ сети и volumes, могут работать одновременно.  
> Но порты :3000 и :3010 будут конфликтовать. Рекомендуется запускать только один стек.

### Настройка переменных окружения

**Файл .env.production уже существует в корне проекта.**

Проверить содержимое:

```powershell
cat .env.production
```

**КРИТИЧЕСКИ ВАЖНЫЕ переменные (БЕЗ fallback значений):**

```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/dbname

# Redis
REDIS_URL=redis://:strong_password@redis:6379
REDIS_PASSWORD=strong_password

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-64-char-secret

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_production_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Bull Board
BULL_BOARD_USER=admin
BULL_BOARD_PASSWORD=secure_password
```

> **⚠️ ВНИМАНИЕ:** Текущий `.env.production` содержит тестовые значения с комментарием "TEMPORARY FOR LOCAL TESTING".  
> **ПЕРЕД production deployment** замените все значения на реальные.

**Генерация секретов:**

```powershell
# NEXTAUTH_SECRET (64 символа)
-join ((1..64) | ForEach-Object { '{0:X}' -f (Get-Random -Max 16) })

# Redis password (32 символа)
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Сборка образов

**⚠️ ВАЖНО:** Production build использует multi-stage Dockerfiles с build-time аргументами.

**Собрать все сервисы:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production build
```

**Build args автоматически передаются:**

- `NODE_ENV=production`
- `NODE_OPTIONS=--max-old-space-size=4096` (4GB heap для Node.js)
- `shm_size=2gb` (shared memory для Chrome в тестах)

**Собрать конкретный сервис:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production build web
```

**Пересборка без кэша:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production build --no-cache
```

**Прогресс сборки (plain mode):**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production build --progress=plain
```

### Запуск сервисов

**Запустить production stack:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

Запускаются все 5 сервисов:

1. postgres (первым, зависимость для всех)
2. redis (первым, зависимость для всех)
3. web (зависит от postgres + redis)
4. telegram-bot (зависит от postgres + redis + web)
5. bull-board-dashboard (зависит от redis)

**Запуск без фонового режима (с логами):**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production up
```

**Запуск конкретного сервиса:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production up -d web
# Автоматически запустит postgres и redis
```

### Первый запуск (что происходит внутри)

**PostgreSQL:**

1. Инициализирует data directory
2. Создаёт базу данных (из DATABASE_URL)
3. Health check: pg_isready каждые 10s

**Redis:**

1. Загружает конфигурацию из docker/redis/redis.conf
2. Применяет CLI overrides: --requirepass, --protected-mode yes
3. Health check: redis-cli ping каждые 10s

**Web сервис (entrypoint-web-prod.sh):**

1. Ждёт доступности PostgreSQL (до 30 секунд)
2. Выполняет `npx prisma migrate deploy` (применяет pending migrations)
3. Проверяет количество записей в таблице `banks`:
   ```bash
   BANKS_COUNT=$(npx prisma db execute \
     --stdin <<< "SELECT COUNT(*) FROM banks;" | grep -oP '\d+')
   ```
4. Если `BANKS_COUNT == 0` → выполняет SEED скрипты:
   - packages/session-management/scripts/seed-usdt-wallets.sql (7 кошельков)
   - packages/session-management/scripts/seed-uah-banks.sql (4 банка)
5. Запускает `npm run start` (Next.js production server)

> **Важно:** Seed выполняется ТОЛЬКО при первом запуске (если таблица banks пустая).  
> При последующих запусках seed пропускается.

**Telegram Bot:**

1. Ждёт healthy статус PostgreSQL и Redis
2. Ждёт healthy статус Web (требуется для API contract типов)
3. Запускает Next.js сервер (порт 3003) + BullMQ worker

**Bull Board Dashboard:**

1. Ждёт healthy статус Redis
2. Запускает Express сервер на порту 3010
3. Подключается к Redis DB #1 (REDIS_DB_QUEUE=1)
4. Health check: Node.js HTTP GET к /health endpoint

### Мониторинг Health Checks

**Проверка статуса всех сервисов:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production ps
```

**Health check timing:**

| Сервис       | Interval | Start Period | Timeout | Retries |
| ------------ | -------- | ------------ | ------- | ------- |
| web          | 30s      | 180s         | 10s     | 3       |
| telegram-bot | 30s      | 180s         | 10s     | 3       |
| bull-board   | 30s      | 40s          | 10s     | 3       |
| postgres     | 10s      | 10s          | 5s      | 5       |
| redis        | 10s      | 10s          | 5s      | 5       |

> **Start Period = 180s** для приложений из-за `prisma migrate deploy` (может занять время).

**Ожидание healthy статуса:**

```powershell
# Проверять каждые 10 секунд пока все не станут healthy
while ($true) {
    $unhealthy = docker compose -f docker-compose.production.yml --env-file .env.production ps --format json |
                 ConvertFrom-Json |
                 Where-Object { $_.Health -ne "healthy" }

    if (-not $unhealthy) {
        Write-Host "✅ All services are healthy!"
        break
    }

    Write-Host "⏳ Waiting for: $($unhealthy.Name -join ', ')"
    Start-Sleep -Seconds 10
}
```

**Проверка конкретного health check:**

```powershell
docker inspect exchanger-web-prod --format='{{json .State.Health}}' | ConvertFrom-Json
```

### Доступ к сервисам

**ТОЛЬКО exposed порты:**

| Сервис        | URL                   | Credentials          |
| ------------- | --------------------- | -------------------- |
| Web (Next.js) | http://localhost:3000 | -                    |
| Bull Board    | http://localhost:3010 | (из .env.production) |

**Недоступны с хоста (internal only):**

- PostgreSQL (5432/tcp) - только внутри exchanger-prod-network
- Redis (6379/tcp) - только внутри exchanger-prod-network

**Доступ к PostgreSQL через Docker:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production exec postgres psql $env:DATABASE_URL
```

**Доступ к Redis через Docker:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production exec redis redis-cli -a $env:REDIS_PASSWORD
```

### Просмотр логов

**Все сервисы:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production logs -f
```

**Конкретный сервис:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production logs -f web
```

**Последние N строк:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production logs --tail 200 web
```

**Логи с timestamp:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production logs -f -t web
```

**Экспорт логов в файл:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production logs --no-color > logs-$(Get-Date -Format 'yyyy-MM-dd-HHmm').txt
```

### Остановка сервисов

**Остановить все (контейнеры сохраняются):**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production stop
```

**Остановить и удалить контейнеры (volumes сохраняются):**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production down
```

**⚠️ ОПАСНО: Остановить + удалить volumes (ПОТЕРЯ ДАННЫХ):**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production down -v
```

### Перезапуск сервисов

**Перезапустить все:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production restart
```

**Перезапустить конкретный сервис:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production restart web
```

**Пересоздать контейнер (применить изменения):**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production up -d --force-recreate web
```

### Обновление приложения (deployment процесс)

**Полный цикл обновления:**

```powershell
# 1. Остановить сервисы (НЕ удалять volumes!)
docker compose -f docker-compose.production.yml --env-file .env.production down

# 2. Получить новый код
git pull origin main

# 3. Пересобрать образы
docker compose -f docker-compose.production.yml --env-file .env.production build

# 4. Запустить
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# 5. Проверить health checks
docker compose -f docker-compose.production.yml --env-file .env.production ps
```

**Zero-downtime deployment (rolling update):**

```powershell
# Обновить сервис без остановки (создаёт новый контейнер, потом удаляет старый)
docker compose -f docker-compose.production.yml --env-file .env.production up -d --no-deps --build web
```

### Выполнение команд внутри контейнеров

**Интерактивный shell:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production exec web sh
```

**Выполнить команду:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production exec web npm run db:studio
```

**Prisma commands:**

```powershell
# Применить миграции
docker compose -f docker-compose.production.yml --env-file .env.production exec web npx prisma migrate deploy

# Проверить статус миграций
docker compose -f docker-compose.production.yml --env-file .env.production exec web npx prisma migrate status

# Открыть Prisma Studio
docker compose -f docker-compose.production.yml --env-file .env.production exec web npx prisma studio
```

---

## 🔧 Общие операции

### Управление volumes

**Список всех volumes:**

```powershell
docker volume ls | Select-String "exchanger"
```

Вывод:

```
local     exchanger-front_pgadmin_data
local     exchanger-front_postgres_data_prod
local     exchanger-front_postgres_dev_data
local     exchanger-front_redis_data_prod
local     exchanger-front_redis_dev_data
```

**Детальная информация о volume:**

```powershell
docker volume inspect exchanger-front_postgres_data_prod
```

**Backup PostgreSQL volume:**

```powershell
# Создать backup (dump)
docker compose -f docker-compose.production.yml --env-file .env.production exec -T postgres pg_dump -U user dbname > backup-$(Get-Date -Format 'yyyy-MM-dd').sql

# Или через volume
docker run --rm -v exchanger-front_postgres_data_prod:/data -v ${PWD}:/backup alpine tar czf /backup/postgres-backup-$(Get-Date -Format 'yyyy-MM-dd').tar.gz /data
```

**Restore PostgreSQL volume:**

```powershell
# Из SQL dump
Get-Content backup-2025-10-29.sql | docker compose -f docker-compose.production.yml --env-file .env.production exec -T postgres psql -U user dbname

# Или через volume
docker run --rm -v exchanger-front_postgres_data_prod:/data -v ${PWD}:/backup alpine tar xzf /backup/postgres-backup-2025-10-29.tar.gz -C /
```

**Удалить volume (ОПАСНО):**

```powershell
docker volume rm exchanger-front_postgres_dev_data
```

### Управление networks

**Список networks:**

```powershell
docker network ls | Select-String "exchanger"
```

Вывод:

```
exchanger-front_exchanger-dev-network
exchanger-front_exchanger-prod-network
```

**Инспектировать network:**

```powershell
docker network inspect exchanger-front_exchanger-prod-network
```

**Подключить контейнер к network:**

```powershell
docker network connect exchanger-front_exchanger-prod-network some-external-container
```

### Очистка ресурсов

**Удалить остановленные контейнеры:**

```powershell
docker container prune
```

**Удалить неиспользуемые образы:**

```powershell
docker image prune -a
```

**Удалить все неиспользуемые ресурсы (volumes НЕ затрагиваются):**

```powershell
docker system prune
```

**ОПАСНО: Удалить ВСЁ включая volumes:**

```powershell
docker system prune -a --volumes
```

**Удалить только ресурсы проекта:**

```powershell
# Development
docker compose down -v --remove-orphans

# Production
docker compose -f docker-compose.production.yml --env-file .env.production down -v --remove-orphans
```

### Мониторинг ресурсов

**Использование CPU/Memory в реальном времени:**

```powershell
docker stats
```

**Только production контейнеры:**

```powershell
docker stats (docker compose -f docker-compose.production.yml --env-file .env.production ps -q)
```

**Disk usage:**

```powershell
docker system df
```

Детальная информация:

```powershell
docker system df -v
```

### Проверка конфигурации

**Валидация docker-compose.yml:**

```powershell
# Development
docker compose config

# Production
docker compose -f docker-compose.production.yml --env-file .env.production config
```

**Показать resolved конфигурацию (с подставленными env переменными):**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production config --resolve-image-digests
```

**Показать только конкретный сервис:**

```powershell
docker compose -f docker-compose.production.yml --env-file .env.production config --services
docker compose -f docker-compose.production.yml --env-file .env.production config web
```

---

## 🔍 Troubleshooting

### Health Check Failures

#### Проблема: Сервис unhealthy после старта

**Диагностика:**

```powershell
# 1. Проверить health check logs
docker inspect <container-name> --format='{{range .State.Health.Log}}{{.Output}}{{end}}'

# 2. Проверить логи приложения
docker logs <container-name> --tail 100

# 3. Вручную выполнить health check команду
docker exec <container-name> <health-check-command>
```

**Пример для bull-board (unhealthy из-за curl):**

```powershell
# Проблема: "curl: executable file not found"
docker inspect exchanger-bull-board-prod --format='{{range .State.Health.Log}}{{.Output}}{{end}}'

# Решение: В docker-compose.production.yml удалить healthcheck override
# (позволить использовать healthcheck из Dockerfile с node вместо curl)
```

**Решение:**

1. Если healthcheck использует curl в Alpine образе → установить curl или использовать node/wget
2. Проверить start_period достаточен для инициализации (migrations могут занять >120s)
3. Проверить timeout достаточен для медленных ответов

#### Проблема: Web unhealthy долгое время

**Причины:**

1. Prisma migrations занимают >180s (start_period)
2. PostgreSQL недоступен (проверить depends_on + health check)
3. DATABASE_URL неправильный

**Диагностика:**

```powershell
# Проверить логи web
docker compose -f docker-compose.production.yml --env-file .env.production logs web | Select-String "error|fail|timeout"

# Проверить PostgreSQL healthy
docker compose -f docker-compose.production.yml --env-file .env.production ps postgres

# Проверить DATABASE_URL
docker compose -f docker-compose.production.yml --env-file .env.production exec web printenv DATABASE_URL
```

**Решение:**

1. Увеличить start_period в healthcheck (если migrations долгие)
2. Проверить подключение к БД вручную:
   ```powershell
   docker compose -f docker-compose.production.yml --env-file .env.production exec web npx prisma db execute --stdin <<< "SELECT 1;"
   ```

### Port Conflicts

#### Проблема: "port is already allocated"

**Диагностика:**

```powershell
# Найти процесс использующий порт 3000
netstat -ano | Select-String ":3000"

# Или
Get-NetTCPConnection -LocalPort 3000 | Format-Table -Property LocalAddress, LocalPort, OwningProcess

# Узнать имя процесса
Get-Process -Id <PID>
```

**Решение:**

1. Остановить конфликтующий Docker контейнер:

   ```powershell
   docker ps | Select-String "3000"
   docker stop <container-id>
   ```

2. Или изменить порт в docker-compose.yml:
   ```yaml
   ports:
     - '3001:3000' # Хост:Контейнер
   ```

### Volume Permission Issues

#### Проблема: "Permission denied" при записи в volume

**Диагностика:**

```powershell
# Проверить владельца внутри volume
docker compose exec postgres ls -la /var/lib/postgresql/data
```

**Решение:**

1. В Dockerfile убедиться что создан пользователь:

   ```dockerfile
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   USER nextjs
   ```

2. Или запустить с конкретным UID:
   ```yaml
   user: '1001:1001'
   ```

### Environment Variable Issues

#### Проблема: Переменные не подставляются

**Диагностика:**

```powershell
# Проверить какие переменные видит контейнер
docker compose -f docker-compose.production.yml --env-file .env.production exec web printenv | Sort-Object

# Проверить resolved config
docker compose -f docker-compose.production.yml --env-file .env.production config | Select-String "REDIS_PASSWORD"
```

**Решение:**

1. Убедиться что используется правильный env файл:

   ```powershell
   # НЕПРАВИЛЬНО (использует .env)
   docker compose -f docker-compose.production.yml up -d

   # ПРАВИЛЬНО
   docker compose -f docker-compose.production.yml --env-file .env.production up -d
   ```

2. Проверить формат .env файла (без пробелов вокруг =):

   ```env
   # ПРАВИЛЬНО
   REDIS_PASSWORD=mypassword

   # НЕПРАВИЛЬНО
   REDIS_PASSWORD = mypassword
   ```

3. Проверить экранирование спецсимволов:
   ```env
   # Если пароль содержит $ или "
   REDIS_PASSWORD='password$with$special'
   ```

### Connection Issues

#### Проблема: Приложение не может подключиться к PostgreSQL

**Диагностика:**

```powershell
# 1. Проверить PostgreSQL запущен и healthy
docker compose -f docker-compose.production.yml --env-file .env.production ps postgres

# 2. Проверить сеть
docker network inspect exchanger-front_exchanger-prod-network

# 3. Проверить DATABASE_URL
docker compose -f docker-compose.production.yml --env-file .env.production exec web printenv DATABASE_URL

# 4. Проверить доступность из web контейнера
docker compose -f docker-compose.production.yml --env-file .env.production exec web sh -c "apk add postgresql-client && psql $DATABASE_URL -c 'SELECT 1;'"
```

**Решение:**

1. Проверить hostname в DATABASE_URL = имени сервиса (`postgres`, НЕ `localhost`)
2. Проверить оба сервиса в одной сети
3. Проверить depends_on + condition: service_healthy

#### Проблема: Не могу подключиться к PostgreSQL с хоста (production)

**Это нормально!** В production PostgreSQL НЕ exposed.

**Для доступа используйте:**

```powershell
# Через docker exec
docker compose -f docker-compose.production.yml --env-file .env.production exec postgres psql -U user dbname

# Или временно expose порт (НЕ для production!)
# Добавить в docker-compose.production.yml:
# postgres:
#   ports:
#     - "5432:5432"
```

### Build Issues

#### Проблема: Out of Memory (OOM) during build

**Симптомы:**

```
npm ERR! errno 137
npm ERR! killed
```

**Решение:**

1. Увеличить память для Docker Desktop:
   - Settings → Resources → Memory → 8GB+

2. Собирать последовательно (не параллельно):

   ```powershell
   docker compose -f docker-compose.production.yml --env-file .env.production build web
   docker compose -f docker-compose.production.yml --env-file .env.production build telegram-bot
   docker compose -f docker-compose.production.yml --env-file .env.production build bull-board-dashboard
   ```

3. Использовать --no-cache только когда необходимо (кэш экономит память)

#### Проблема: Build занимает слишком долго

**Решение:**

1. Использовать BuildKit cache:

   ```powershell
   $env:DOCKER_BUILDKIT=1
   docker compose build
   ```

2. Проверить .dockerignore (должен исключать node_modules, .next, .turbo)

3. Использовать multi-stage builds (уже используется)

### Database Migration Issues

#### Проблема: Migrations failed во время entrypoint

**Диагностика:**

```powershell
# Проверить логи web
docker compose -f docker-compose.production.yml --env-file .env.production logs web | Select-String "prisma|migration"

# Проверить статус миграций
docker compose -f docker-compose.production.yml --env-file .env.production exec web npx prisma migrate status
```

**Решение:**

1. Если migration failed → resolve вручную:

   ```powershell
   docker compose -f docker-compose.production.yml --env-file .env.production exec web npx prisma migrate resolve --applied "<migration-name>"
   ```

2. Если нужно откатить миграцию → НЕТ АВТО-ROLLBACK, только вручную через SQL

3. Если schema drift (база не соответствует schema.prisma):
   ```powershell
   # Проверить diff
   docker compose -f docker-compose.production.yml --env-file .env.production exec web npx prisma migrate diff \
     --from-schema-datamodel prisma/schema.prisma \
     --to-schema-datasource prisma/schema.prisma
   ```

### Redis Connection Issues

#### Проблема: Bull Board не видит очереди

**Диагностика:**

```powershell
# 1. Проверить Redis healthy
docker compose -f docker-compose.production.yml --env-file .env.production ps redis

# 2. Проверить REDIS_URL в bull-board
docker compose -f docker-compose.production.yml --env-file .env.production exec bull-board-dashboard printenv | Select-String "REDIS"

# 3. Проверить подключение
docker compose -f docker-compose.production.yml --env-file .env.production exec bull-board-dashboard sh -c "apk add redis && redis-cli -u \$REDIS_URL ping"

# 4. Проверить ключи в Redis DB #1
docker compose -f docker-compose.production.yml --env-file .env.production exec redis redis-cli -a $env:REDIS_PASSWORD -n 1 KEYS "bull:*"
```

**Решение:**

1. Проверить REDIS_DB_QUEUE=1 (Bull использует DB 1, не default DB 0)
2. Проверить REDIS_PASSWORD совпадает во всех сервисах
3. Проверить Redis protected-mode (должен быть yes в production)

### Orphaned Containers Warning

#### Проблема: "Found orphan containers"

```
WARNING: Found orphan containers [exchanger-pgadmin] for this project.
```

**Это НЕ ошибка.** Означает что есть контейнеры от старых/других compose файлов.

**Решение:**

```powershell
# Удалить orphaned контейнеры
docker compose -f docker-compose.production.yml --env-file .env.production up -d --remove-orphans
```

---

## 📚 Справочник команд

### Development Quick Commands

```powershell
# === ЗАПУСК ===
# Базовые сервисы
docker compose up -d

# С инструментами (pgAdmin + Redis Commander)
docker compose --profile development up -d

# Без фона (с логами)
docker compose up

# === СТАТУС ===
docker compose ps
docker compose logs -f web

# === ОСТАНОВКА ===
docker compose stop          # Остановить (сохранить контейнеры)
docker compose down          # Остановить + удалить контейнеры
docker compose down -v       # + удалить volumes (ОПАСНО)

# === REBUILD ===
docker compose build web
docker compose up -d --build web

# === EXEC ===
docker compose exec web sh
docker compose exec web npx prisma studio
docker compose exec postgres-dev psql -U exchanger_user -d exchanger_db
docker compose exec redis-dev redis-cli

# === CLEANUP ===
docker compose down --remove-orphans
docker system prune
```

### Production Quick Commands

```powershell
# Короткий алиас для production команд
$dc_prod = "docker compose -f docker-compose.production.yml --env-file .env.production"

# === ЗАПУСК ===
& $dc_prod build
& $dc_prod up -d

# === СТАТУС ===
& $dc_prod ps
& $dc_prod logs -f web

# === ОСТАНОВКА ===
& $dc_prod stop
& $dc_prod down

# === DEPLOYMENT ===
& $dc_prod down
git pull origin main
& $dc_prod build
& $dc_prod up -d
& $dc_prod ps

# === EXEC ===
& $dc_prod exec web sh
& $dc_prod exec web npx prisma migrate status
& $dc_prod exec postgres psql $env:DATABASE_URL
& $dc_prod exec redis redis-cli -a $env:REDIS_PASSWORD

# === CLEANUP ===
& $dc_prod down --remove-orphans
```

### Useful PowerShell Functions

Добавьте в `$PROFILE`:

```powershell
# Быстрые команды для Development
function dcup { docker compose up -d @args }
function dcdown { docker compose down @args }
function dcps { docker compose ps @args }
function dclogs { docker compose logs -f @args }
function dcexec { docker compose exec @args }
function dcbuild { docker compose build @args }

# Быстрые команды для Production
function dcpup {
    docker compose -f docker-compose.production.yml --env-file .env.production up -d @args
}
function dcpdown {
    docker compose -f docker-compose.production.yml --env-file .env.production down @args
}
function dcpps {
    docker compose -f docker-compose.production.yml --env-file .env.production ps @args
}
function dcplogs {
    docker compose -f docker-compose.production.yml --env-file .env.production logs -f @args
}
function dcpexec {
    docker compose -f docker-compose.production.yml --env-file .env.production exec @args
}

# Мониторинг
function dc-health {
    docker compose ps --format json | ConvertFrom-Json |
    Format-Table Name, State, Health -AutoSize
}

# Cleanup
function dc-clean {
    docker system prune -f
    docker volume prune -f
    Write-Host "✅ Cleaned up unused Docker resources"
}
```

Использование:

```powershell
# Development
dcup                    # docker compose up -d
dclogs web             # docker compose logs -f web
dcexec web sh          # docker compose exec web sh

# Production
dcpup                  # production up
dcplogs web           # production logs web
dcpexec web sh        # production exec web sh

# Monitoring
dc-health             # Показать health статус
dc-clean              # Очистить unused resources
```

---

## 🎯 Best Practices

### 1. **Всегда указывайте env файл явно для production**

```powershell
# ❌ НЕПРАВИЛЬНО (использует .env)
docker compose -f docker-compose.production.yml up -d

# ✅ ПРАВИЛЬНО
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

### 2. **Проверяйте health checks перед считыванием результата успешным**

```powershell
# Запустить
docker compose up -d

# НЕ сразу curl http://localhost:3000
# Дождаться healthy (может занять 2-3 минуты)
docker compose ps
```

### 3. **Используйте --remove-orphans при переключении между dev/prod**

```powershell
docker compose down --remove-orphans
docker compose -f docker-compose.production.yml --env-file .env.production up -d --remove-orphans
```

### 4. **Backup volumes перед обновлениями**

```powershell
# Backup PostgreSQL
docker compose -f docker-compose.production.yml --env-file .env.production exec -T postgres \
    pg_dump -U user dbname > backup-$(Get-Date -Format 'yyyy-MM-dd').sql

# Потом безопасно обновляться
git pull
docker compose -f docker-compose.production.yml --env-file .env.production down
docker compose -f docker-compose.production.yml --env-file .env.production build
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

### 5. **Мониторьте ресурсы на production**

```powershell
# Добавить в scheduled task (каждый час)
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" > stats-$(Get-Date -Format 'yyyy-MM-dd-HH').txt
```

### 6. **Используйте .dockerignore**

Убедитесь что в корне проекта есть `.dockerignore`:

```
node_modules
.next
.turbo
dist
build
.git
.env*
*.log
npm-debug.log*
coverage
.vscode
```

### 7. **Rotation логов**

Docker Compose уже настроен на rotation:

```yaml
logging:
  driver: 'json-file'
  options:
    max-size: '10m'
    max-file: '3'
```

Но можно проверить размер логов:

```powershell
docker ps -q | ForEach-Object {
    $size = (docker inspect $_ --format='{{.LogPath}}' | Get-Item).Length / 1MB
    Write-Host "$($_): $([math]::Round($size, 2)) MB"
}
```

---

## 📞 Дополнительные ресурсы

- **Docker Compose документация:** https://docs.docker.com/compose/
- **Dockerfile best practices:** https://docs.docker.com/develop/dev-best-practices/
- **Prisma Migrate:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **BullMQ:** https://docs.bullmq.io/
- **Next.js production deployment:** https://nextjs.org/docs/deployment

---

## 🔄 Changelog

- **2025-10-30:** Исправлен bull-board healthcheck (убран curl override, используется node из Dockerfile)
- **2025-10-30:** Создан comprehensive guide для Windows 11 + PowerShell на основе 100% verified фактов

---

**Вопросы?** Проверьте [Troubleshooting](#troubleshooting) или создайте issue в репозитории.
