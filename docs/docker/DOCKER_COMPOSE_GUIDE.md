# Docker Compose Quick Start Guide

## 🚀 Быстрый запуск

### Основные команды

```bash
# Базовая команда (PostgreSQL + Redis)
docker-compose up -d

# С development сервисами (+ pgAdmin + Redis Commander)
docker-compose --profile development up -d

# Остановка всех контейнеров
docker-compose down

# Полная очистка (удаление контейнеров + volumes)
docker-compose down -v
```

## 📋 Профили запуска

### Production профиль (по умолчанию)

```bash
docker-compose up -d
```

**Включает:**

- ✅ PostgreSQL (порт 5432)
- ✅ Redis (порт 6379)

**НЕ включает:**

- ❌ pgAdmin
- ❌ Redis Commander

### Development профиль

```bash
docker-compose --profile development up -d
```

**Включает:**

- ✅ PostgreSQL (порт 5432)
- ✅ Redis (порт 6379)
- ✅ pgAdmin (порт 8080)
- ✅ Redis Commander (порт 8081)

## 🔧 Доступ к сервисам

### pgAdmin (развертывание DB)

- **URL:** http://localhost:8080
- **Email:** `admin@example.com` (по умолчанию)
- **Пароль:** `admin123`

### Redis Commander (мониторинг кэша)

- **URL:** http://localhost:8081
- **Логин:** `admin`
- **Пароль:** `admin123`

### PostgreSQL (прямое подключение)

- **Host:** localhost
- **Port:** 5432
- **Database:** `exchanger_db`
- **User:** `exchanger_user`
- **Password:** `exchanger_password`

### Redis (прямое подключение)

- **Host:** localhost
- **Port:** 6379
- **Password:** не требуется

## 🔄 Типовые сценарии

### Первый запуск проекта

```bash
# Запуск с development сервисами
docker-compose --profile development up -d

# Проверка статуса
docker-compose ps
```

### Ежедневная разработка

```bash
# Запуск (если контейнеры уже созданы)
docker-compose --profile development up -d

# Остановка (сохранение данных)
docker-compose down
```

### Изменил конфигурацию

```bash
# Остановка
docker-compose down

# Пересборка и запуск
docker-compose --profile development up -d --build
```

### Нужна чистая база данных

```bash
# Полная очистка
docker-compose down -v

# Запуск с нуля
docker-compose --profile development up -d
```

### Проблемы с запуском

```bash
# Полная очистка + пересборка
docker-compose down -v
docker-compose build --no-cache
docker-compose --profile development up -d
```

## 🐛 Устранение проблем

### pgAdmin не запускается

**Причина:** Забыли указать профиль development
**Решение:**

```bash
docker-compose --profile development up -d
```

### База данных не подключается

**Причина:** PostgreSQL еще не готов
**Решение:** Подождать 10-30 секунд или проверить:

```bash
docker-compose logs postgres
```

### Изменения конфигурации не применяются

**Причина:** Кэш Docker
**Решение:**

```bash
docker-compose down -v
docker-compose --profile development up -d --build
```

### Порты заняты

**Причина:** Другие сервисы используют порты 5432, 6379, 8080, 8081
**Решение:** Остановить конфликтующие сервисы или изменить порты в docker-compose.yml

## ⚙️ Переменные окружения

Создайте файл `.env` в корне проекта для кастомизации:

```env
# PostgreSQL
POSTGRES_DB=exchanger_db
POSTGRES_USER=exchanger_user
POSTGRES_PASSWORD=exchanger_password
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# pgAdmin
PGADMIN_EMAIL=your.email@example.com
PGADMIN_PASSWORD=your_password

# Redis Commander
REDIS_COMMANDER_USER=admin
REDIS_COMMANDER_PASSWORD=admin123
```

## 🏃‍♂️ Быстрые команды

```bash
# Запуск для разработки (все сервисы)
alias docker-dev="docker-compose --profile development up -d"

# Остановка
alias docker-stop="docker-compose down"

# Полная перезагрузка
alias docker-reset="docker-compose down -v && docker-compose --profile development up -d"

# Логи всех сервисов
alias docker-logs="docker-compose logs -f"
```

## 📚 Дополнительные команды

```bash
# Просмотр логов конкретного сервиса
docker-compose logs postgres
docker-compose logs redis
docker-compose logs pgadmin

# Выполнение команд внутри контейнера
docker-compose exec postgres psql -U exchanger_user -d exchanger_db
docker-compose exec redis redis-cli

# Статус всех сервисов
docker-compose ps

# Использование ресурсов
docker-compose top
```

---

**Совет:** Для ежедневной разработки используйте команду `docker-compose --profile development up -d` - она запустит все необходимые сервисы для комфортной работы.
