# Руководство для передачи проекта — DevOps-ready

**Цель:** дать полноценное, максимально подробное руководство для разработчика, чтобы при передаче проекта сеньор DevOps не испытывал проблем. Документ покрывает организацию кодовой базы, инфраструктуру, CI/CD, безопасность, мониторинг, миграции, бэкапы, сетевые настройки, управление секретами и чек-листы при деплое и эксплуатации.

> Предположение: проект — Next.js приложения (один или два), backend-API (Next.js API routes), очередь BullMQ на Redis, Postgres как БД. Деплой может быть через `docker-compose` (локальный / VPS) или с разделением (Vercel для фронта + managed DB + внешние воркеры). Если стек другой — адаптируй советы соответственно.

---

## Содержание
1. Высокоуровневая архитектура
2. Требования к репозиторию и layout проекта
3. Что задокументировать обязательно
4. Управление переменными окружения и секретами
5. Докеризация: Dockerfile, образы, tagging, multi-stage
6. `docker-compose` и окружения (dev/staging/prod)
7. Базы данных: миграции, seed, бэкапы и восстановления
8. Очереди и воркеры (BullMQ): надежность и мониторинг
9. CI/CD: pipeline, тесты, миграции, деплой, rollback
10. Инфраструктура как код (IaC) — рекомендации (Terraform / Ansible)
11. Логи, мониторинг, алерты, tracing
12. Безопасность: сеть, права, зависимости
13. Производительность и масштабирование
14. Документация и handoff checklist
15. Примеры команд и snippets
16. Частые проблемы и способы их диагностики
17. Контакты и SLA для передачи

---

# 1. Высокоуровневая архитектура (чёткая карта)
- **Диаграмма компонентов** — обязательно приложи диаграмму (draw.io/mermaid) с компонентами: Frontend (Next.js), API, Postgres, Redis, Worker(s), Storage (S3/R2), CDN (Cloudflare/Vercel), CI system, мониторинг. Укажи все сетевые пути и порты.
- **Deployment targets** — опиши, куда можно развернуть (Vercel, Cloudflare, VPS с docker-compose, Fly/Render/Railway) и преимущества/ограничения каждого.
- **Сценарии отказа** — опиши кратко: потеря одного воркера, падение БД, Redis недоступен, осложнения при масштабировании фронта.

# 2. Требования к репозиторию и layout проекта
### Общие правила
- Один репо — один проект. Если в проекте несколько приложений (app1, app2, worker), оформляй как mono-repo с папками `/apps/app1`, `/apps/app2`, `/services/worker` и корнем с infra/CI.
- `README.md` в корне — минимум: как запустить dev, тесты, построение образов, quickstart docker-compose.
- `docs/` — техническая документация (диаграммы, инфра-описания, runbooks).
- `scripts/` — вспомогательные скрипты (migrate.sh, backup.sh, deploy.sh).
- `infra/` — terraform/ansible/k8s manifests, docker-compose files, nginx/traefik configs.

### Пример структуры
```
/README.md
/docs/
  /architecture.md
  /runbooks/
/apps/
  /app1/
    package.json
    next.config.js
    Dockerfile
  /app2/
/services/
  /worker/
    package.json
    worker.js
    Dockerfile
/infra/
  docker-compose.yml
  traefik.yml
  terraform/
/scripts/
  migrate.sh
  backup.sh
.github/
  workflows/ci.yml
  workflows/deploy.yml
```

# 3. Что задокументировать обязательно
- Список env vars (название, формат, обязательность, пример).  
- Пошаговый сценарий запуска локально (`docker-compose up --build`) и на staging/prod.  
- Порядок миграций: как запускать, кто их выполняет (CI или manual), инструкции отката.  
- Как добавлять/удалять worker'ы, как менять concurrency.  
- Политики бэкапов: частота, хранение, тест восстановления.  
- Настройки логирования и где смотреть логи (ELK / Loki / stdout & docker logs).  
- Контактное лицо разработчиков, ответственные за архитектуру.  

# 4. Управление переменными окружения и секретами
### Что нужно
- Полный `.env.example` в репо (без реальных секретов). Каждая переменная: описание, формат, примеры.
- Не храни секреты в репозитории. Используй: **HashiCorp Vault**, **AWS Secrets Manager**, **GCP Secret Manager**, **Azure Key Vault** или provider-specific secrets (Vercel Secrets, Railway variables). Для VPS — Ansible Vault / env files на сервере с ограниченным доступом.

### Best practices
- Разделяй env для `development`, `staging`, `production`. В CI используй переменные окружения в настройках GitHub Actions/GitLab CI.
- Для Docker Compose используй `.env` файлы, но убедись, что `.env` для production не в репо.
- Прятать ключи в CI: переменные в настройках репозитория, и доступ ограничивать ролями.
- Секреты ротация: документируй процедуру ротации ключей и ревокации.

# 5. Докеризация: Dockerfile, образы, tagging, multi-stage
### Dockerfile
- Используй multi-stage builds: `builder` (установить deps, build), `runner` (копировать только результат сборки, production deps). Уменьшит размер образа и ускорит CI.
- Минимизируй слои, используйте `npm ci --only=production`/`pnpm` для prod deps.
- Примеры: использовать `node:18-alpine`, устанавливать `ca-certificates` если нужен HTTPS.

### Тегирование образов
- Используй семантические теги: `project:latest`, `project:sha-<commit>`, `project:tag-<release>`. CI должен пушить immutable тег — хеш коммита.
- Docker registry: Docker Hub / GitHub Container Registry / GitLab Registry / private registry. Документируй где хранится образ и права доступа.

### Безопасность образов
- Сканируй образы в CI (Trivy, Clair). Обновляй base images регулярно.

# 6. `docker-compose` и окружения (dev/staging/prod)
- Держи `docker-compose.dev.yml` и `docker-compose.prod.yml` (в prod минимальный compose: app, reverse-proxy, healthchecks). Не храните prod docker-compose с реальными секретами в репо.
- Используй named volumes для БД и Redis.
- Healthchecks: `pg_isready`, `redis-cli ping`, и для приложения endpoint `/healthz`.
- Depends_on в compose — не гарантирует readiness. Используй healthcheck или init-scripts.

# 7. Базы данных: миграции, seed, бэкапы и восстановления
### Миграции
- Используй миграции: Prisma Migrate / Flyway / Liquibase / TypeORM migrations. Никогда не полагайся на `schema sync` в runtime.
- Кто запускает миграции: **CI** перед деплоем или **одиночный админский процесс** (чётко указать). Авто-миграции в параллельных деплоях — риск.
- Документируй порядок: `backup -> run migrations -> smoke tests -> switch traffic`.

### Бэкапы и восстановление
- Автоматические бэкапы (daily, hourly при критичности) — хранить offsite (S3/Cloud storage). Периодически тестируй восстановление.
- Инкрементальные WAL (Postgres WAL archiving) и PITR для production.
- Скрипт restore: как развернуть новую БД из бекапа и переключить подключение.

# 8. Очереди и воркеры (BullMQ): надежность и мониторинг
- **Worker как долгоживущий процесс**: держи его в контейнере/VM с авто-restart. Не запускать воркеры inside serverless функций.
- Конфигурация concurrency и ретраев: документируй. Используй `limiter`/rate limiter при высоких нагрузках.
- Используй `bull-board`/`arena` для визуализации очередей (в staging/prod с auth).
- Dead-letter queues: настраивай retry/backoff и dead queues, логирование неуспешных задач.
- Мониторинг Redis health и latency (Redis slowlog). Если используешь Upstash — следи за квотами.

# 9. CI/CD: pipeline, тесты, миграции, деплой, rollback
### CI (пример GitHub Actions)
- Stages: `lint -> unit tests -> build -> integration tests -> container build -> image scan -> push image -> deploy_staging -> run_migrations_staging -> smoke_tests -> deploy_prod -> run_migrations_prod -> smoke_tests_prod`.
- Разделяй права: только tagged releases/maintainers могут триггерить прод деплой.
- Автоматические миграции: либо в CI, либо через отдельный job, но контроль транзакций обязателен.

### Rollback
- Держи предыдущую версию образа и быстрый план rollback: `docker-compose pull project:sha-<prev> && docker-compose up -d`. Документируй шаги и checks.

# 10. Инфраструктура как код (IaC)
- Все infra-ресурсы (VPC, load balancers, dns, buckets) описывать в Terraform/CloudFormation/Ansible. Храни state для Terraform в remote backend (S3 + DynamoLock / Terraform Cloud).
- Пиши scripts/terraform/README — кто apply, кто review.

# 11. Логи, мониторинг, алерты, tracing
### Логи
- Используй централизованные логи: Loki/Promtail + Grafana, ELK stack, Papertrail или cloud provider solution. Логи структурированные (JSON).
- Настрой retention policies и ротацию.

### Метрики и алерты
- Собирай метрики: CPU, memory, request latency, error rates, queue length, jobs failed, DB connections, slow queries.
- Инструменты: Prometheus + Grafana, Datadog, NewRelic, Cloudwatch.
- Настрой алерты на критичные thresholds и runbooks (pager duty/telegram/email).

### Tracing
- Интегрируй distributed tracing: OpenTelemetry -> Jaeger/Tempo. Помогает отлаживать запросы через Next.js API -> worker -> DB.

# 12. Безопасность: сеть, права, зависимости
- Минимизируй доступы: principle of least privilege для DB пользователей и S3 buckets.
- Используй TLS для всех внешних соединений. На internal сети — также шифруй если есть регуляторные требования.
- Регулярно сканируй зависимости (Dependabot, Snyk). Обновления security-патчей в base images.
- Сканирование уязвимостей Docker образов (Trivy) в CI.

# 13. Производительность и масштабирование
- Горизонтальное масштабирование frontend: stateless Next.js (оставить state в external storages — Redis, Postgres). Для SSR — кешируй часто используемые страницы (ISR, edge cache).
- Воркеры: масштабировать горизонтально, использовать redis namespaces и отдельные очереди для тяжёлых задач.
- Пул соединений к Postgres: используйте pgBouncer или connection pooling (важно для serverless / multiple instances).

# 14. Документация и handoff checklist (для DevOps)
### Необходимые артефакты
- `README.md` с quickstart.  
- `infra/docker-compose.yml` (prod variant without secrets).  
- `infra/terraform` (или указание, что infra ручная).  
- `docs/architecture.md`, diagram.png/mermaid.  
- `.env.example` и полный список env vars (.env.production stored in secrets manager).  
- CI workflow yaml и описание deploy flow.  
- Скрипты: `scripts/migrate.sh`, `scripts/backup.sh`, `scripts/rollback.sh`.  
- Runbooks: `runbooks/db_restore.md`, `runbooks/worker_restart.md`, `runbooks/high_cpu.md`.

### Handoff checklist (шаги передачи)
1. Доступы: предоставить доступ к репо, registry, cloud consoles, DNS, monitoring. Использовать invite/temporary access.  
2. Совместный walkthrough: провести walkthrough с DevOps (30–60 минут) по architecture.md и demo запуска.  
3. Передача секретов через secrets manager / secure channel.  
4. Демонстрация процесса deployment и rollback.  
5. CRUD тест: запуск миграций и восстановление бэкапа на staging.  
6. Подписать SLA/expectations: RTO/RPO для сервисов, контакты on-call.

# 15. Примеры команд и snippets
- Запуск локально: `docker-compose -f infra/docker-compose.yml --env-file .env.dev up --build -d`  
- Просмотр логов: `docker-compose logs -f worker`  
- Запустить миграции (Prisma): `docker-compose exec app1 npx prisma migrate deploy`  
- Бэкап Postgres (host machine):
  ```bash
  docker exec -t $(docker-compose ps -q postgres) pg_dumpall -c -U $POSTGRES_USER > dump_$(date +%F).sql
  ```
- Восстановление:
  ```bash
  cat dump.sql | docker exec -i $(docker-compose ps -q postgres) psql -U $POSTGRES_USER
  ```

# 16. Частые проблемы и способы диагностики
- **Worker не подключается к Redis:** проверить env, docker network, `redis-cli -h redis ping`. Просмотреть логи worker.  
- **Приложение падает при старте из-за миграций:** запуск миграций в CI или init контейнере, убедиться, что миграции совместимы.  
- **Недостаточно соединений к Postgres:** использовать pgBouncer, увеличить max_connections аккуратно.  
- **Проблемы с rate limits внешних API:** в очередях внедрить rate limiters и retry/backoff.

# 17. Контакты и SLA для передачи
- Укажи: кто contacts, who-on-call, escalation path, preferred channels (Telegram/Slack/email), hours (on-call 24/7 or business hours). Сформируй небольшую таблицу контактов.

---

## Appendix A — Шаблон `.env.example`
```
# Postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=appdb
DATABASE_URL=postgres://postgres:postgres@postgres:5432/appdb

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://:password@redis:6379

# Next / App
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# BullMQ
QUEUE_NAME=jobs

# Storage
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Monitoring
PROMETHEUS_PUSHGATEWAY=
SENTRY_DSN=

# CI/CD
DOCKER_REGISTRY=ghcr.io/org/repo
IMAGE_TAG=sha-<commit>
```

---

## Closing notes
Этот документ рассчитан чтобы покрыть большинство вопросов, которые возникают при передаче проекта DevOps-инженеру. Если хочешь, я могу:
- Сгенерировать готовые `scripts/` (migrate.sh, backup.sh, restore.sh, deploy.sh) по твоему стеку.  
- Подготовить GitHub Actions workflow для CI/CD с секвенцией, которую мы описали.  
- Подготовить terraform skeleton для создания infra (VPC, db, buckets).

Скажи, что желаешь получить в приоритете — сгенерирую прямо сейчас.

