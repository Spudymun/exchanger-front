Отлично — даю **production-grade** архитектурно-операционный план для реализации **отложенной задачи (job queue)** при создании заказа. Это независимая, абстрактная спецификация — применима к любому бэкенду (SQL/NoSQL, любой языка/фреймворка) и покрывает все практические аспекты: надёжность, корректность, восстановление, мониторинг и эксплуатацию.

# Краткая идея (в 1-й строке)

При создании заказа сохраняем `expire_at` и помещаем **отложенную задачу** в устойчивую очередь. Worker при срабатывании job выполняет **атомарную проверку статуса** заказа и — только если заказ всё ещё в `awaiting_payment` и `expire_at <= now()` — выполняет отмену и все компенсационные операции. Все побочные действия идемпотентны и логируются.

# 1. Основные сущности и поля (минимум)

- Order
  - `id` (UUID)
  - `user_id`
  - `status` (enum: `awaiting_payment`, `paid`, `processing`, `cancelled`, `failed`, etc.)
  - `expire_at` (timestamp, UTC)
  - `amount`, `currency`
  - `deposit_address` (если генерируете)
  - `version` или `updated_at` (optimistic lock)
  - `metadata` (reason, payment_tx, retries, job_id)

- Job (в очереди)
  - `job_type` = `order_expire`
  - `payload` = `{ orderId, createdAt, expireAt, idempotencyKey }`
  - `scheduled_at` = `expire_at` (delay)
  - built-in meta: retries, attempts, DLQ

# 2. Выбор очереди — официальные требования

- Очередь должна хранить задачи **персистентно** (при перезапуске сервера job не теряются).
- Поддержка delayed jobs / scheduled jobs.
- Поддержка retries, backoff, dead-letter queue (DLQ).
- Поддержка мониторинга/metrics (queue length, failed jobs).
- Популярные варианты: Redis + BullMQ/Bee-Queue, RabbitMQ (delayed exchange/plugin), AWS SQS + Lambda/EC2, Google Pub/Sub, Kafka + scheduler (редко для простых delayed jobs). Выбери по требованиям масштабируемости и 운영: SQS для облака, Redis/BullMQ для низкой задержки и гибкости.

# 3. Жизненный цикл заказа и job’а

1. Клиент создаёт заказ (API).
2. В рамках транзакции/атомарной операции:
   - Вставляем запись заказа с `status = awaiting_payment` и `expire_at = now + TTL`.
   - Создаём job в очереди с `delay = TTL` и payload `{ orderId, expireAt }`. Сохраняем `job_id` в `order.metadata` (необязательно, полезно для отмены).

3. Клиент видит таймер в UI — **только информационный**.
4. При поступлении платежа (webhook / chain watcher / ручной confirm) сервер выполняет **атомарное** обновление `status`:
   - `UPDATE orders SET status='paid', paid_at=NOW() WHERE id = ? AND status = 'awaiting_payment' AND expire_at >= NOW()`
   - По результату: если `rowsAffected = 1` — продолжаем обработку; иначе — логируем/тримируем.

5. Worker по срабатыванию job:
   - Загружает order, проверяет `status` и `expire_at`.
   - Выполняет **conditional update**:
     - `UPDATE orders SET status='cancelled', cancelled_at=NOW() WHERE id = ? AND status = 'awaiting_payment' AND expire_at <= NOW()`

   - Если обновление прошло — запускает компенсационные шаги; если нет — ничего не делает.

6. Компенсационные шаги (см. §6).

# 4. Атомарность и конкурентность

- Никогда не делай: SELECT → логика → UPDATE без проверки состояния в UPDATE. Всегда `UPDATE ... WHERE status = 'awaiting_payment'` и проверяй `affectedRows`/`matchedCount`.
- Для NoSQL используйте CAS/optimistic lock (версия) или транзакции (если есть).
- Для race condition с webhook-ами: webhook должен пытаться `UPDATE` транзакционно; если `0 rowsAffected` — проверить текущее состояние и принять решение (e.g., спор / лог).
- Не полагайтесь на блокировки уровня приложения (в памяти) — они не работают в кластере.

# 5. Idempotency и побочные эффекты

- Worker и обработчики webhook должны быть идемпотентными. Используй `idempotencyKey` для внешних вызовов (платёжные провайдеры, банковские API).
- Все внешние действия (освобождение адреса, возврат резерва, уведомления) должны записывать факты в таблицу аудита: `audit (order_id, action, payload, status, created_at)`.
- Если внешняя операция неуспешна — ретраить по backoff и, при длительном провале, перевести job в DLQ и поднять оповещение в операторскую.

# 6. Компенсационные операции при отмене

- Пометки:
  - release/mark deposit_address as free / return to pool
  - освобождение резервов (балансы)
  - возврат hold/authorization (если используется)
  - создание записи в audit
  - нотификация пользователя (email/SMS/push)
  - метрики и событие в event bus (topic `order.cancelled`)
  - optional: notify downstream services (webhooks)

- Каждое действие — отдельный шаг с retries и audit-trace.

# 7. Ретраи, backoff, DLQ

- У job-а: консервативный retry policy (например 3 попытки) с экспоненциальным backoff.
- Ошибки, которые не реентранируются (business errors) — переводить в failed/DLQ и звонить оператору.
- Для DLQ устраивай отдельный consumer для ручной разбора и reprocess.

# 8. Отмена job-а если платеж пришёл раньше

- Когда приход платежа: попытаться удалить/отменить отложенный job по `job_id` (если очередь поддерживает) — но **не обязательно**. Даже если не удалишь — worker при выполнении увидит `status != awaiting` и ничего не сделает. Тем не менее сохранение `job_id` полезно для оптимизации (чтобы job не выполнялся лишний раз).
- Не полагаться на гарантированное удаление — проектировать логику таким образом, чтобы лишний запуск job был безопасен.

# 9. Мониторинг, метрики и SLA

- Метрики:
  - queue_length, scheduled_jobs_count
  - rate of job_failures, avg_job_latency
  - count orders expired per time window
  - count orders cancelled unexpectedly / manual interventions

- Алерты:
  - рост DLQ
  - worker crash / no workers
  - queue задержка > SLO (например > 1 min)

- SLA/targets:
  - job execution latency: <= 5s после scheduled time (в нормальных условиях)
  - max acceptable delay during partial outage: документировать (например 5–15 min)

- Логи и трассировка: correlationId = orderId included in logs and traces.

# 10. Тестирование и э2е-валидация

- Unit: conditional UPDATE behavior (rowsAffected = 0/1).
- Integration: очередь + worker — тест в staging с настоящими delayed job.
- Chaos tests: kill worker/DB mid-job, проверить, что job выполнится позже и идемпотентно.
- Load test: массовое создание заказов с TTL, проверить queue scaling и DB load.
- Regression: сценарии partial payments, duplicate webhooks, manual operator cancels.

# 11. Безопасность и согласованность времени

- Все timestamps в UTC.
- NTP на всех хостах.
- Проверять `expire_at <= now()` в worker: не доверять `delay` очереди как единственный источник истины.
- Защита от DOS: rate limit создания заказов и создания адресов.
- Secrets (API keys, queue creds) — хранить в vault.

# 12. Эксплуатация и runbook

- Runbook для инцидентов:
  - проверка очереди и workers,
  - ручной requeue job-ов,
  - ручная отмена/восстановление заказов через админ-панель (с audit),
  - действия при DLQ overflow.

- Admin UI: таблица jobs + ability requeue, inspect payload, view audit trail.
- Регулярные операции: cleanup старых заказов, rotate DLQ.

# 13. Очередь и масштабирование

- Horizontally scale workers (stateless); гарантировать, что обработка конкретного order идёт атомарно.
- DB индекс на `expire_at` и `status` — для админ-отчетов.
- Если ожидается всплеск — использовать partitioning или sharding для очереди/DB.

# 14. Особые сценарии и рекомендации

- Частичная оплата: четко описать бизнес-правило (принимать частичное, ожидать остатка, создавать dispute). Обрабатывать в worker только полные оплаты.
- Fraud checks: можно вставить промежуточную задачу (delayed short, например 1–2 min) для базовой валидации перед окончательной отменой/завершением.
- Multi-step expiry: можно иметь soft-expire (notify user) и hard-expire (cancel). Это требует двух job’ов с разными задачами.
- Экономия адресов: если адреса дорогие — освобождать сразу на cancel; возможно реиспользовать после полного confirmation timeout.

# 15. Что логично добавить в MVP прямо сейчас

1. Implement ordered flow: create order → create delayed job → atomic UPDATE on cancel/pay.
2. Add audit log for each state transition.
3. Add simple dashboard: pending jobs, failed jobs.
4. Add tests: unit + integration for cancel worker.
5. Настроить мониторинг DLQ и worker health.

# Итоговая формула (one-liner)

`Order creation (with expire_at) + Persistent delayed job → Worker does conditional atomic cancel → safe idempotent compensations + monitoring/Audit`.

---

Если нужно — следующим шагом подготовлю:

- конкретный checklist для деплоя (service accounts, IAM, мониторинг),
- шаблон таблиц DB (DDL) и пример payload job-а,
- и/или короткий псевдокод для твоего стека (Postgres + Redis/BullMQ / SQS) — без излишних деталей, production-ready.

Хочешь, дам checklist деплоя и DDL сейчас?
