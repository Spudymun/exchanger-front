# Гибридная архитектура - структура проекта

```
exchanger-monorepo/
├── apps/
│   ├── web/                    # Next.js Core (основное приложение)
│   ├── admin-panel/            # Next.js Admin
│   ├── docs/                   # Next.js Docs
│   ├── telegram-bot/           # Микросервис Telegram бота
│   ├── email-service/          # Микросервис email уведомлений
│   ├── analytics-service/      # Микросервис аналитики
│   └── notification-service/   # Микросервис push уведомлений
├── packages/
│   ├── shared-types/           # Общие типы для всех сервисов
│   ├── trpc-client/           # tRPC клиент для микросервисов
│   ├── ui/                    # UI компоненты
│   └── constants/             # Общие константы
└── docker-compose.yml         # Оркестрация всех сервисов
```

## Коммуникация между сервисами

### 1. Next.js Core → Микросервисы

```typescript
// apps/web/src/server/trpc/routers/orders.ts

export const ordersRouter = createTRPCRouter({
  createOrder: publicProcedure.input(createOrderSchema).mutation(async ({ input }) => {
    // Создаем заказ в основной БД
    const order = await db.order.create({ data: input });

    // Уведомляем микросервисы
    await Promise.allSettled([
      // Email уведомление
      emailService.sendOrderConfirmation.mutate({
        email: input.email,
        orderId: order.id,
        amount: input.amount,
      }),

      // Telegram уведомление (если есть Telegram ID)
      telegramService.notifyOrderCreated.mutate({
        userId: input.userId,
        orderId: order.id,
      }),

      // Аналитика
      analyticsService.trackEvent.mutate({
        event: 'order_created',
        userId: input.userId,
        properties: { amount: input.amount, currency: input.currency },
      }),
    ]);

    return order;
  }),
});
```

### 2. Микросервисы → Next.js Core

```typescript
// apps/telegram-bot/src/handlers/balance.ts

bot.command('balance', async ctx => {
  const telegramId = ctx.from.id;

  // Обращаемся к основному API
  const user = await coreAPI.user.getByTelegramId.query({ telegramId });

  if (!user) {
    ctx.reply('Пользователь не найден. Зарегистрируйтесь на сайте.');
    return;
  }

  const orders = await coreAPI.user.getActiveOrders.query({ userId: user.id });

  ctx.reply(`
💰 Ваш баланс: ${user.balance} UAH
📊 Активных заказов: ${orders.length}
🔗 Перейти на сайт: https://exchange.com/profile
  `);
});
```

### 3. Межсервисная коммуникация

```typescript
// packages/trpc-client/src/services.ts

// Клиенты для микросервисов
export const emailService = createTRPCClient<EmailRouter>({
  links: [httpBatchLink({ url: 'http://email-service:4001/trpc' })],
});

export const telegramService = createTRPCClient<TelegramRouter>({
  links: [httpBatchLink({ url: 'http://telegram-bot:4002/trpc' })],
});

export const analyticsService = createTRPCClient<AnalyticsRouter>({
  links: [httpBatchLink({ url: 'http://analytics-service:4003/trpc' })],
});
```

## Docker Compose конфигурация

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Основное Next.js приложение
  web:
    build: ./apps/web
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/exchange
      - EMAIL_SERVICE_URL=http://email-service:4001
      - TELEGRAM_SERVICE_URL=http://telegram-bot:4002
    depends_on:
      - db
      - redis

  # Микросервис Telegram бота
  telegram-bot:
    build: ./apps/telegram-bot
    ports:
      - '4002:4002'
    environment:
      - BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - CORE_API_URL=http://web:3000/api/trpc
      - INTERNAL_API_KEY=${INTERNAL_API_KEY}
    depends_on:
      - web

  # Микросервис email уведомлений
  email-service:
    build: ./apps/email-service
    ports:
      - '4001:4001'
    environment:
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}

  # Микросервис аналитики
  analytics-service:
    build: ./apps/analytics-service
    ports:
      - '4003:4003'
    environment:
      - CLICKHOUSE_URL=${CLICKHOUSE_URL}
      - GOOGLE_ANALYTICS_ID=${GA_ID}

  # База данных
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=exchange
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis для кеширования и очередей
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

## Преимущества гибридной архитектуры

### ✅ Плюсы:

1. **Лучшее из двух миров** - быстрая разработка core + гибкость микросервисов
2. **Постепенная миграция** - можно выносить сервисы по мере необходимости
3. **Независимое масштабирование** - Telegram бот может работать на отдельном сервере
4. **Технологическое разнообразие** - можно использовать Python для ML, Go для высоконагруженных частей
5. **Отказоустойчивость** - падение Telegram бота не влияет на основной сайт

### ⚠️ Минусы:

1. **Сложность деплоя** - больше сервисов для управления
2. **Сетевые задержки** - межсервисные вызовы добавляют латентность
3. **Отладка** - сложнее трейсить запросы через несколько сервисов
4. **Консистентность данных** - нужно продумывать транзакции между сервисами

## Когда выносить в микросервисы

### 🎯 Критерии для выделения:

1. **Независимая функциональность** (Telegram бот, email)
2. **Разные технологические требования** (ML на Python)
3. **Разная нагрузка** (аналитика может обрабатывать миллионы событий)
4. **Разные команды** (отдельная команда для мобильных уведомлений)
5. **Разные циклы релизов** (бот обновляется чаще основного сайта)

### 📊 Пример решения для Telegram бота:

**Оставить в Next.js если:**

- Простой бот (только уведомления)
- Малая команда (1-3 разработчика)
- Низкая нагрузка (<1000 пользователей)

**Вынести в микросервис если:**

- Сложная логика (игры, торговые команды)
- Отдельная команда разработки
- Высокая нагрузка (>10000 пользователей)
- Нужны специфичные библиотеки
