# 🚀 DevOps Deployment Guide

> **Целевая аудитория:** DevOps инженеры, деплоящие Exchanger на production Linux серверах  
> **Последнее обновление:** 30 октября 2025  
> **Проверенные ОС:** Ubuntu 22.04 LTS, Debian 12

---

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Архитектура инфраструктуры](#архитектура-инфраструктуры)
3. [Требования к серверу](#требования-к-серверу)
4. [Environment Variables Reference](#environment-variables-reference)
5. [Production Deployment](#production-deployment)
6. [Docker Scripts](#docker-scripts)
7. [CI/CD Integration](#cicd-integration)
8. [Backup & Restore](#backup--restore)
9. [Monitoring & Logging](#monitoring--logging)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 Быстрый старт

### Минимальный Production Deploy (5 минут)

```bash
# 1. Клонировать репозиторий
git clone <repository-url> exchanger
cd exchanger

# 2. Создать production environment file
cp .env.production.example .env.production
nano .env.production  # Заполнить все переменные

# 3. Build production images (последовательно!)
docker compose -f docker-compose.production.yml build bull-board-dashboard
docker compose -f docker-compose.production.yml build telegram-bot
docker compose -f docker-compose.production.yml build web

# 4. Запуск production stack
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# 5. Проверка статуса
docker compose -f docker-compose.production.yml --env-file .env.production ps
docker logs exchanger-web-prod --tail 50
```

**⚠️ КРИТИЧЕСКИ ВАЖНО:**

- Build производить **ПОСЛЕДОВАТЕЛЬНО** (по одному сервису), не параллельно!
- Используйте флаг `--env-file .env.production` при КАЖДОЙ команде docker compose
- Минимум 4GB RAM для успешного build

---

## 🏗️ Архитектура инфраструктуры

### Production Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Reverse Proxy  │  ← nginx/Caddy/Traefik
              │   (SSL/TLS)     │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼───────┐  ┌──▼───────┐  ┌──▼────────────┐
│  Web (3000)   │  │ Bull-Board│  │ Telegram Bot  │
│  Next.js App  │  │  (3010)   │  │  (internal)   │
└───────┬───────┘  └──┬────────┘  └──┬────────────┘
        │             │              │
        └─────────────┼──────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│ PostgreSQL 15  │         │   Redis 7       │
│ (internal)     │         │ (password-auth) │
│ NO PORT EXPOSE │         │ (internal)      │
└────────────────┘         └─────────────────┘
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│ postgres_data  │         │  redis_data     │
│ Docker Volume  │         │ Docker Volume   │
└────────────────┘         └─────────────────┘
```

### Ключевые особенности

**Security:**

- ✅ PostgreSQL: **НЕТ портов** на host (только internal Docker network)
- ✅ Redis: **requirepass** + bind 0.0.0.0 + protected-mode
- ✅ Telegram Bot: **НЕТ портов** на host (только internal)
- ✅ Secrets: Runtime environment variables (НЕ в Docker layers)

**Performance:**

- ✅ Multi-stage Docker builds (pruner → installer → runner)
- ✅ Health checks с start_period 180s
- ✅ Resource limits (CPU/Memory)
- ✅ Log rotation (10MB, 3 files)

**High Availability:**

- ✅ `restart: always` для всех сервисов
- ✅ Auto-healing через health checks
- ✅ Persistent volumes для данных
- ✅ Graceful shutdown handling

---

## 💻 Требования к серверу

### Минимальные требования (Single Server)

```yaml
CPU: 4 cores (рекомендуется 8 cores для build)
RAM: 8 GB (минимум 4 GB для runtime, 8 GB для build)
Disk: 50 GB SSD (рекомендуется 100 GB)
Network: 100 Mbps
OS: Ubuntu 22.04 LTS / Debian 12
```

### Рекомендуемые требования (Production)

```yaml
CPU: 8 cores
RAM: 16 GB
Disk: 200 GB NVMe SSD
Network: 1 Gbps
OS: Ubuntu 22.04 LTS (проверено)
Backup: Отдельный диск/S3 bucket
```

### Установка зависимостей (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# КРИТИЧЕСКИ ВАЖНО: Reboot or re-login after docker group add
newgrp docker
```

---

## 🔐 Environment Variables Reference

### Создание .env.production файла

**⚠️ ВАЖНО:** Docker Compose по умолчанию читает **ТОЛЬКО** `.env` файл!  
Для production используйте флаг: `--env-file .env.production`

```bash
# Создать из примера
cp .env.production.example .env.production

# ОБЯЗАТЕЛЬНО изменить все секреты!
nano .env.production
```

### Полный список переменных

#### **1. Database (PostgreSQL)**

```bash
# Database name
POSTGRES_DB=<your-database-name>

# Database user
POSTGRES_USER=<your-database-user>

# Database password
POSTGRES_PASSWORD=<your-strong-password>

# Connection string (формат: postgresql://USER:PASSWORD@postgres:5432/DATABASE)
DATABASE_URL=postgresql://<your-database-user>:<your-strong-password>@postgres:5432/<your-database-name>
```

#### **2. Redis (Cache & Sessions)**

```bash
# Redis password
REDIS_PASSWORD=<your-redis-password>

# Redis connection URL (формат: redis://:<PASSWORD>@redis:6379)
REDIS_URL=redis://:<your-redis-password>@redis:6379
```

#### **3. NextAuth (Authentication)**

```bash
# NextAuth secret (минимум 32 символа)
NEXTAUTH_SECRET=<your-nextauth-secret>

# Public URL вашего приложения
NEXTAUTH_URL=<your-app-url>
```

#### **4. Application URLs**

```bash
# Internal web app URL (для Docker network, НЕ МЕНЯТЬ!)
WEB_APP_URL=http://web:3000

# External telegram webhook URL (должен быть доступен из интернета)
TELEGRAM_WEBHOOK_URL=<your-public-domain>/api/telegram/webhook
```

#### **5. Telegram Bot**

```bash
# Bot token from @BotFather
TELEGRAM_BOT_TOKEN=<your-bot-token>

# Bot username
TELEGRAM_BOT_USERNAME=<your-bot-username>

# Webhook secret
TELEGRAM_WEBHOOK_SECRET=<your-webhook-secret>

# API secret for internal auth
API_SECRET_KEY=<your-api-secret>

# Authorized operators (comma-separated Telegram user IDs)
AUTHORIZED_TELEGRAM_OPERATORS=<user-id-1>,<user-id-2>

# Chat IDs for notifications (получить через @userinfobot)
OPERATOR_TELEGRAM_CHAT_IDS=<chat-id-1>,<chat-id-2>
TELEGRAM_SUPPORT_CHAT_ID=<support-chat-id>
TELEGRAM_ORDERS_CHAT_ID=<orders-chat-id>

# Topic IDs (if using forum groups)
TELEGRAM_NEW_ORDERS_TOPIC_ID=<topic-id>
TELEGRAM_CANCELLED_ORDERS_TOPIC_ID=<topic-id>
TELEGRAM_PAID_ORDERS_TOPIC_ID=<topic-id>
```

#### **6. Bull Board (Queue Monitoring)**

```bash
# Bull Board admin credentials
BULL_BOARD_USER=<your-admin-username>
BULL_BOARD_PASSWORD=<your-admin-password>
```

### Проверка правильности переменных

```bash
# Проверить что все переменные установлены
grep -E "^[A-Z_]+=" .env.production | wc -l
# Должно быть минимум 20 переменных

# Проверить что нет пустых значений
grep -E "^[A-Z_]+=\s*$" .env.production
# Не должно быть вывода!

# Проверить формат DATABASE_URL
grep "DATABASE_URL" .env.production
# Формат: postgresql://USER:PASSWORD@postgres:5432/DATABASE
```

---

## 🐳 Production Deployment

### Пошаговая инструкция

#### Шаг 1: Подготовка сервера

```bash
# 1. Создать директорию проекта
sudo mkdir -p /opt/exchanger
sudo chown $USER:$USER /opt/exchanger
cd /opt/exchanger

# 2. Клонировать репозиторий
git clone <repository-url> .

# 3. Создать .env.production
cp .env.production.example .env.production
nano .env.production
# Заполнить ВСЕ переменные (см. раздел выше)

# 4. Создать директории для данных (опционально)
mkdir -p /opt/exchanger-data/{postgres,redis,backups,logs}
```

#### Шаг 2: Build Docker Images

**⚠️ КРИТИЧЕСКИ ВАЖНО:**

- Build **ПОСЛЕДОВАТЕЛЬНО** (не параллельно)!
- Причина: На системах с <32GB RAM параллельный build вызывает OOM

```bash
# Build images последовательно
docker compose -f docker-compose.production.yml build bull-board-dashboard && \
docker compose -f docker-compose.production.yml build telegram-bot && \
docker compose -f docker-compose.production.yml build web

# Проверить созданные images
docker images | grep exchanger-front
```

**Ожидаемое время:**

- bull-board-dashboard: ~2-5 секунд (минимальный образ)
- telegram-bot: ~3-5 минут (Turbo build)
- web: ~4-6 минут (Next.js build)

#### Шаг 3: Запуск Production Stack

```bash
# Запуск с env file флагом (ОБЯЗАТЕЛЬНО!)
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Мониторинг запуска
docker compose -f docker-compose.production.yml --env-file .env.production logs -f
```

**Процесс запуска (180 секунд):**

1. **0-30s:** PostgreSQL и Redis стартуют, health checks
2. **30-90s:** Web application запускается, выполняет Prisma migrations
3. **90-120s:** Web application seed database (если пустая)
4. **120-150s:** Telegram bot стартует
5. **150-180s:** Bull Board стартует
6. **180s+:** Все сервисы healthy, приложение готово

#### Шаг 4: Верификация Deployment

```bash
# 1. Проверить статус всех контейнеров
docker compose -f docker-compose.production.yml --env-file .env.production ps

# Ожидаемый вывод:
# exchanger-postgres-prod     healthy
# exchanger-redis-prod        healthy
# exchanger-web-prod          healthy
# exchanger-telegram-bot-prod healthy
# exchanger-bull-board-prod   healthy (или starting)

# 2. Проверить health endpoints
curl http://localhost:3000/api/health
# Ожидается: {"status":"ok"}

# 3. Проверить логи на ошибки
docker logs exchanger-web-prod --tail 100 | grep -i error

# 4. Проверить Redis security
docker exec exchanger-redis-prod redis-cli ping
# Ожидается: (error) NOAUTH Authentication required.

docker exec exchanger-redis-prod redis-cli -a "$REDIS_PASSWORD" ping
# Ожидается: PONG

# 5. Проверить PostgreSQL isolation
docker ps --filter "name=postgres-prod" --format "{{.Ports}}"
# Ожидается: 5432/tcp (БЕЗ 0.0.0.0:5432->5432)

# 6. Проверить Prisma migrations
docker logs exchanger-web-prod | grep "Prisma"
# Ожидается: "Running Prisma migrations..."
```

#### Шаг 5: Настройка Reverse Proxy (Nginx)

**Конфигурация Nginx:**

```nginx
# /etc/nginx/sites-available/exchanger

upstream exchanger_web {
    server localhost:3000 fail_timeout=10s max_fails=3;
    keepalive 32;
}

upstream exchanger_bullboard {
    server localhost:3010 fail_timeout=10s max_fails=3;
    keepalive 16;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name <your-domain.com> www.<your-domain.com>;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main Application (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name <your-domain.com> www.<your-domain.com>;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/<your-domain.com>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your-domain.com>/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/exchanger-access.log;
    error_log /var/log/nginx/exchanger-error.log;

    # Client limits
    client_max_body_size 10M;
    client_body_buffer_size 128k;

    # Timeouts
    proxy_connect_timeout 90s;
    proxy_send_timeout 90s;
    proxy_read_timeout 90s;
    send_timeout 90s;

    # Main Application
    location / {
        proxy_pass http://exchanger_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://exchanger_web;
        access_log off;
    }
}

# Bull Board Dashboard (HTTPS, with basic auth)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bullboard.<your-domain.com>;

    # SSL Configuration (same as above)
    ssl_certificate /etc/letsencrypt/live/<your-domain.com>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your-domain.com>/privkey.pem;

    # IP Whitelist (ОПЦИОНАЛЬНО - рекомендуется!)
    allow 1.2.3.4;      # Your office IP
    allow 5.6.7.8;      # VPN IP
    deny all;

    location / {
        proxy_pass http://exchanger_bullboard;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Активация конфигурации:**

```bash
# Проверить конфигурацию
sudo nginx -t

# Активировать
sudo ln -s /etc/nginx/sites-available/exchanger /etc/nginx/sites-enabled/

# Reload Nginx
sudo systemctl reload nginx
```

#### Шаг 6: SSL Certificates (Let's Encrypt)

```bash
# Установить Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получить сертификаты
sudo certbot --nginx -d <your-domain.com> -d www.<your-domain.com>

# Auto-renewal уже настроен через systemd timer
sudo systemctl status certbot.timer

# Тест renewal
sudo certbot renew --dry-run
```

---

## � Docker Scripts

> **Директория:** `scripts/docker/`  
> **Важно:** Все wrapper-скрипты были удалены. Используйте прямые docker compose команды.

### Автоматически используемые скрипты

В проекте есть **только 2 bash-скрипта**, которые запускаются автоматически Docker Compose:

#### 1. `entrypoint-web-dev.sh` (Development)

**Используется:** `docker-compose.yml` автоматически при старте web контейнера

**Что делает:**

```bash
1. Ожидает готовности PostgreSQL
2. Запускает: npx prisma db push --accept-data-loss
3. Запускает Next.js dev server
```

**Не требует ручного запуска** - Docker Compose монтирует и выполняет автоматически.

#### 2. `entrypoint-web-prod.sh` (Production)

**Используется:** `docker-compose.production.yml` автоматически при старте web контейнера

**Что делает:**

```bash
1. Ожидает готовности PostgreSQL (проверка SELECT 1)
2. Запускает: npx prisma migrate deploy
3. Проверяет количество записей в таблице banks
4. Если banks пустая (COUNT = 0):
   → Seed USDT wallets (7 кошельков)
   → Seed UAH banks (4 банка)
5. Запускает Next.js production server
```

**Важно:** Автоматический seeding происходит только при первом запуске с пустой БД.

**Не требует ручного запуска** - Docker Compose монтирует и выполняет автоматически.

### Используйте нативные docker compose команды

Все wrapper-скрипты (dev-up.sh, prod-deploy.sh, prod-manage.sh) были **удалены** как избыточные.

**Вместо скриптов используйте:**

```bash
# Development
docker compose --profile development up -d
docker compose down
docker compose logs -f web

# Production (ОБЯЗАТЕЛЬНО с флагом --env-file!)
docker compose -f docker-compose.production.yml --env-file .env.production up -d
docker compose -f docker-compose.production.yml --env-file .env.production down
docker compose -f docker-compose.production.yml --env-file .env.production logs -f web

# Health check
docker compose -f docker-compose.production.yml ps --format "table {{.Name}}\t{{.Health}}"

# Backup PostgreSQL
docker compose -f docker-compose.production.yml exec postgres \
  pg_dump -U exchanger_user exchanger_db > backup_$(date +%Y%m%d).sql
```

Подробнее см. `scripts/docker/README.md`

---

## �🔄 CI/CD Integration (Рекомендации)

> **Примечание:** В проекте нет готовых CI/CD конфигураций. Ниже приведены рекомендации для настройки на основе существующей Docker-инфраструктуры.

### Почему эти подходы подойдут для проекта:

1. **Monorepo + Turborepo:** Проект использует Turborepo, что позволяет эффективно кэшировать сборки
2. **Multi-stage Dockerfiles:** Уже настроены для production builds (pruner → installer → runner)
3. **Отдельные сервисы:** web, telegram-bot, bull-board можно деплоить независимо
4. **Environment variables:** Уже вынесены в `.env.production`, легко интегрировать с CI/CD secrets

### GitHub Actions (Рекомендуется)

**Файл:** `.github/workflows/production-deploy.yml`

```yaml
name: Production Deploy

on:
  push:
    branches: [main]
    paths:
      - 'apps/**'
      - 'packages/**'
      - 'docker-compose.production.yml'
      - '.github/workflows/production-deploy.yml'

env:
  DOCKER_REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/web/Dockerfile
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/web:latest
            ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/web:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_ENV=production
            NODE_OPTIONS=--max-old-space-size=4096

      - name: Build and push telegram-bot image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/telegram-bot/Dockerfile
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/telegram-bot:latest
            ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/telegram-bot:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push bull-board image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/bull-board-dashboard/Dockerfile
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/bull-board:latest
            ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_PREFIX }}/bull-board:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to production server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_SERVER_HOST }}
          username: ${{ secrets.PROD_SERVER_USER }}
          key: ${{ secrets.PROD_SERVER_SSH_KEY }}
          script: |
            cd /opt/exchanger

            # Pull latest code
            git pull origin main

            # Login to registry
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin

            # Pull latest images
            docker compose -f docker-compose.production.yml pull

            # Recreate containers with zero-downtime
            docker compose -f docker-compose.production.yml --env-file .env.production up -d --no-deps web
            docker compose -f docker-compose.production.yml --env-file .env.production up -d --no-deps telegram-bot
            docker compose -f docker-compose.production.yml --env-file .env.production up -d --no-deps bull-board-dashboard

            # Cleanup old images
            docker image prune -f

            # Health check
            sleep 30
            docker compose -f docker-compose.production.yml --env-file .env.production ps

      - name: Notify on failure
        if: failure()
        uses: appleboy/telegram-action@master
        with:
          to: ${{ secrets.TELEGRAM_ADMIN_CHAT_ID }}
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          message: |
            ❌ Production deployment FAILED!
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
            Check: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

**Секреты для настройки (GitHub Settings → Secrets):**

```bash
PROD_SERVER_HOST         # IP адрес production сервера
PROD_SERVER_USER         # SSH user (обычно root или ubuntu)
PROD_SERVER_SSH_KEY      # Private SSH key для доступа
TELEGRAM_ADMIN_CHAT_ID   # Chat ID для уведомлений
TELEGRAM_BOT_TOKEN       # Bot token для уведомлений
```

### GitLab CI (Альтернатива)

**Файл:** `.gitlab-ci.yml`

```yaml
stages:
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ''

before_script:
  - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY

build-web:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -f apps/web/Dockerfile -t $CI_REGISTRY_IMAGE/web:$CI_COMMIT_SHA -t $CI_REGISTRY_IMAGE/web:latest .
    - docker push $CI_REGISTRY_IMAGE/web:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE/web:latest
  only:
    - main

build-telegram-bot:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -f apps/telegram-bot/Dockerfile -t $CI_REGISTRY_IMAGE/telegram-bot:$CI_COMMIT_SHA -t $CI_REGISTRY_IMAGE/telegram-bot:latest .
    - docker push $CI_REGISTRY_IMAGE/telegram-bot:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE/telegram-bot:latest
  only:
    - main

deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $PROD_SERVER_HOST >> ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
  script:
    - |
      ssh $PROD_SERVER_USER@$PROD_SERVER_HOST << 'EOF'
        cd /opt/exchanger
        git pull origin main
        docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
        docker compose -f docker-compose.production.yml pull
        docker compose -f docker-compose.production.yml --env-file .env.production up -d --no-deps
        docker image prune -f
      EOF
  only:
    - main
  environment:
    name: production
    url: https://yourdomain.com
```

---

## 💾 Backup & Restore

### Автоматический Backup Script

**Файл:** `/opt/exchanger/scripts/backup.sh`

```bash
#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="/opt/exchanger-backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_PATH"

echo "🔄 Starting backup at $(date)"

# 1. Backup PostgreSQL
echo "📦 Backing up PostgreSQL database..."
docker exec exchanger-postgres-prod pg_dump -U exchanger_user exchanger_db | gzip > "$BACKUP_PATH/database.sql.gz"

# 2. Backup Redis
echo "📦 Backing up Redis data..."
docker exec exchanger-redis-prod redis-cli --rdb stdout > "$BACKUP_PATH/redis.rdb"
gzip "$BACKUP_PATH/redis.rdb"

# 3. Backup environment file
echo "📦 Backing up configuration..."
cp /opt/exchanger/.env.production "$BACKUP_PATH/"

# 4. Create metadata file
cat > "$BACKUP_PATH/backup-info.txt" << EOF
Backup Information
==================
Date: $(date)
Hostname: $(hostname)
Docker Images:
$(docker images --format "{{.Repository}}:{{.Tag}}" | grep exchanger)

Services Status:
$(docker compose -f /opt/exchanger/docker-compose.production.yml --env-file /opt/exchanger/.env.production ps)
EOF

# 5. Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
echo "✅ Backup completed: $BACKUP_SIZE"

# 6. Cleanup old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

# 7. List recent backups
echo "📋 Recent backups:"
ls -lht "$BACKUP_DIR" | head -n 6

echo "✅ Backup process completed at $(date)"
```

**Настройка автоматического backup (Cron):**

```bash
# Создать скрипт
sudo nano /opt/exchanger/scripts/backup.sh
sudo chmod +x /opt/exchanger/scripts/backup.sh

# Добавить в crontab (ежедневный backup в 3:00 AM)
sudo crontab -e

# Добавить строку:
0 3 * * * /opt/exchanger/scripts/backup.sh >> /var/log/exchanger-backup.log 2>&1
```

### Manual Backup

```bash
# Создать backup вручную
sudo /opt/exchanger/scripts/backup.sh

# Проверить backups
ls -lh /opt/exchanger-backups/
```

### Restore Process

```bash
# 1. Остановить приложение
cd /opt/exchanger
docker compose -f docker-compose.production.yml --env-file .env.production down

# 2. Выбрать backup
BACKUP_DATE="20251030_030000"  # Измените на нужную дату
BACKUP_PATH="/opt/exchanger-backups/$BACKUP_DATE"

# 3. Restore PostgreSQL
echo "Restoring PostgreSQL..."
gunzip -c "$BACKUP_PATH/database.sql.gz" | docker exec -i exchanger-postgres-prod psql -U exchanger_user -d exchanger_db

# 4. Restore Redis (требует остановки Redis)
echo "Restoring Redis..."
docker compose -f docker-compose.production.yml --env-file .env.production stop redis
docker volume rm exchanger-front_redis_data_prod
docker compose -f docker-compose.production.yml --env-file .env.production up -d redis
sleep 5
gunzip -c "$BACKUP_PATH/redis.rdb.gz" | docker exec -i exchanger-redis-prod redis-cli --pipe

# 5. Restore environment (если нужно)
cp "$BACKUP_PATH/.env.production" /opt/exchanger/.env.production

# 6. Restart all services
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# 7. Verify restore
docker compose -f docker-compose.production.yml --env-file .env.production ps
docker logs exchanger-web-prod --tail 50
```

---

## 📊 Monitoring & Logging

### Log Management

**Просмотр логов:**

```bash
# Все сервисы
docker compose -f docker-compose.production.yml --env-file .env.production logs -f

# Конкретный сервис
docker logs exchanger-web-prod -f --tail 100

# Последние 1000 строк с timestamp
docker logs exchanger-web-prod --tail 1000 --timestamps

# Логи с ошибками
docker logs exchanger-web-prod 2>&1 | grep -i error

# Логи за последний час
docker logs exchanger-web-prod --since 1h
```

**Log rotation настроен автоматически:**

```yaml
logging:
  driver: 'json-file'
  options:
    max-size: '10m' # Максимум 10MB на файл
    max-file: '3' # Хранить 3 файла
```

### Health Monitoring Script

**Файл:** `/opt/exchanger/scripts/health-check.sh`

```bash
#!/bin/bash

# Health check script
ALERT_LOG="/var/log/exchanger-health.log"

check_service() {
    local service=$1
    local container=$2

    if docker ps --filter "name=$container" --filter "health=healthy" | grep -q "$container"; then
        echo "✅ $service: healthy"
        return 0
    else
        echo "❌ $service: unhealthy" | tee -a "$ALERT_LOG"
        return 1
    fi
}

echo "=== Health Check $(date) ==="

check_service "PostgreSQL" "exchanger-postgres-prod"
check_service "Redis" "exchanger-redis-prod"
check_service "Web Application" "exchanger-web-prod"
check_service "Telegram Bot" "exchanger-telegram-bot-prod"
check_service "Bull Board" "exchanger-bull-board-prod"

# Check HTTP endpoints
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Web health endpoint: OK"
else
    echo "❌ Web health endpoint: FAILED" | tee -a "$ALERT_LOG"
fi

# Check disk space
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  WARNING: Disk usage is ${DISK_USAGE}%" | tee -a "$ALERT_LOG"
fi

echo "=== End of Health Check ==="
```

**Добавить в cron (каждые 5 минут):**

```bash
sudo crontab -e

# Добавить:
*/5 * * * * /opt/exchanger/scripts/health-check.sh >> /var/log/exchanger-health.log 2>&1
```

### Интеграция с Prometheus + Grafana (Рекомендации)

> **Примечание:** В проекте нет готовой настройки мониторинга. Ниже рекомендации для интеграции.

**Почему это подойдет для проекта:**

1. **Bull Board уже есть:** Мониторинг очередей работает (порт 3010)
2. **Docker health checks настроены:** Все сервисы имеют healthcheck endpoints
3. **Redis metrics:** Redis 7 поддерживает экспорт метрик из коробки
4. **PostgreSQL metrics:** Можно добавить postgres_exporter без изменения основного compose

**Пример docker-compose.monitoring.yml (для добавления в проект):**

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - '9090:9090'
    restart: always

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - '3001:3000'
    restart: always
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: always
    ports:
      - '9100:9100'

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    ports:
      - '8080:8080'
    restart: always

volumes:
  prometheus_data:
  grafana_data:
```

---

## 🔒 Security Best Practices

### 1. Environment Variables Security

```bash
# НЕ КОММИТИТЬ .env.production в git!
echo ".env.production" >> .gitignore

# Установить правильные права доступа
chmod 600 .env.production
chown root:root .env.production  # Или ваш deploy user
```

### 2. Docker Security

```bash
# Регулярно обновлять base images
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Удалять неиспользуемые images
docker image prune -a -f

# Scan images for vulnerabilities
docker scan exchanger-front-web:latest
```

### 3. Network Security

```bash
# Firewall rules (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# ВАЖНО: НЕ открывать порты БД!
# sudo ufw deny 5432/tcp   # PostgreSQL (already blocked by default)
# sudo ufw deny 6379/tcp   # Redis (already blocked by default)
```

### 4. SSL/TLS

```bash
# Использовать Let's Encrypt
sudo certbot --nginx -d yourdomain.com

# Автоматическое обновление
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 5. Secrets Rotation

```bash
# Менять секреты каждые 90 дней
# 1. Обновить .env.production
nano /opt/exchanger/.env.production

# 2. Пересоздать контейнеры
docker compose -f docker-compose.production.yml --env-file .env.production up -d --force-recreate

# 3. Verify
docker logs exchanger-web-prod
```

---

## 🔧 Troubleshooting

### Проблема: Build fails with OOM (Out of Memory)

**Симптомы:**

```bash
Killed
Error response from daemon: error while building image
```

**Решение:**

```bash
# 1. Build последовательно (НЕ параллельно)
docker compose -f docker-compose.production.yml build bull-board-dashboard && \
docker compose -f docker-compose.production.yml build telegram-bot && \
docker compose -f docker-compose.production.yml build web

# 2. Увеличить swap (если <4GB RAM)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 3. Ограничить Docker memory
sudo nano /etc/docker/daemon.json
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

sudo systemctl restart docker
```

### Проблема: Containers not starting

**Диагностика:**

```bash
# 1. Проверить статус
docker compose -f docker-compose.production.yml --env-file .env.production ps

# 2. Проверить логи
docker logs exchanger-web-prod --tail 100

# 3. Проверить health checks
docker inspect exchanger-web-prod | grep -A 10 Health

# 4. Проверить environment variables
docker exec exchanger-web-prod env | grep DATABASE_URL
```

**Типичные причины:**

1. **Missing env file flag:**

   ```bash
   # НЕПРАВИЛЬНО:
   docker compose -f docker-compose.production.yml up -d

   # ПРАВИЛЬНО:
   docker compose -f docker-compose.production.yml --env-file .env.production up -d
   ```

2. **Неправильные переменные окружения:**

   ```bash
   # Проверить формат
   grep DATABASE_URL .env.production
   # Должно быть: postgresql://USER:PASS@postgres:5432/DB
   ```

3. **Database migration errors:**

   ```bash
   # Проверить логи миграций
   docker logs exchanger-web-prod | grep -i prisma

   # Ручной запуск миграций
   docker exec exchanger-web-prod npx prisma migrate deploy --schema ../../packages/session-management/prisma/schema.prisma
   ```

### Проблема: Redis connection errors

**Симптомы:**

```
Error: NOAUTH Authentication required
Error: Connection refused
```

**Решение:**

```bash
# 1. Проверить Redis password
docker exec exchanger-redis-prod redis-cli -a "$REDIS_PASSWORD" ping
# Ожидается: PONG

# 2. Проверить REDIS_URL формат
grep REDIS_URL .env.production
# Должно быть: redis://:PASSWORD@redis:6379

# 3. Пересоздать Redis контейнер
docker compose -f docker-compose.production.yml --env-file .env.production up -d --force-recreate redis
```

### Проблема: PostgreSQL "role does not exist"

**Симптомы:**

```
FATAL: role "-d" does not exist
FATAL: role "exchanger_user" does not exist
```

**Решение:**

```bash
# 1. Проверить переменные
grep POSTGRES .env.production

# 2. Убедиться что env file загружен
docker compose -f docker-compose.production.yml --env-file .env.production config | grep POSTGRES

# 3. Пересоздать PostgreSQL
docker compose -f docker-compose.production.yml --env-file .env.production down postgres
docker volume rm exchanger-front_postgres_data_prod
docker compose -f docker-compose.production.yml --env-file .env.production up -d postgres
```

### Проблема: Network isolation issues

**Диагностика:**

```bash
# Проверить сети
docker network ls | grep exchanger

# Проверить контейнеры в сети
docker network inspect exchanger-front_exchanger-prod-network

# Проверить connectivity
docker exec exchanger-web-prod ping postgres -c 3
docker exec exchanger-web-prod ping redis -c 3
```

### Проблема: High memory usage

**Диагностика:**

```bash
# Проверить usage
docker stats --no-stream

# Проверить лимиты
docker inspect exchanger-web-prod | grep -A 10 Memory

# Очистить неиспользуемые данные
docker system prune -a -f --volumes
```

---

## 📞 Support & Contact

### Быстрая справка команд

```bash
# Запуск production
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Остановка
docker compose -f docker-compose.production.yml --env-file .env.production down

# Рестарт сервиса
docker compose -f docker-compose.production.yml --env-file .env.production restart web

# Логи
docker logs exchanger-web-prod -f --tail 100

# Статус
docker compose -f docker-compose.production.yml --env-file .env.production ps

# Backup
sudo /opt/exchanger/scripts/backup.sh

# Health check
curl http://localhost:3000/api/health
```

### Полезные ссылки

- Docker Compose Docs: https://docs.docker.com/compose/
- Next.js Deployment: https://nextjs.org/docs/deployment
- Prisma Production: https://www.prisma.io/docs/guides/deployment
- PostgreSQL Tuning: https://pgtune.leopard.in.ua/

---

**Версия документа:** 1.0.0  
**Дата создания:** 30 октября 2025  
**Автор:** DevOps Team  
**Статус:** Production Ready ✅
