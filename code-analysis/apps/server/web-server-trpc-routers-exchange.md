### Путь: apps/web/src/server/trpc/routers/exchange.ts

**Краткое назначение (1 предложение)**

tRPC роутер для основной бизнес-логики обмена криптовалют включая расчеты курсов, создание заявок и отслеживание статусов.

**Подробное описание (3–6 предложений)**

Роутер реализует полный цикл обменных операций от получения курсов до создания и отслеживания заявок на обмен криптовалют. Включает защищенные rate limiting операции для создания заявок, публичные запросы курсов и лимитов, а также расчетные функции для конвертации между криптовалютами и гривной. Система автоматически создает пользователей при первой заявке, генерирует адреса для депозитов и управляет жизненным циклом заявок через orderManager. Все операции включают валидацию через Zod схемы, локализованные сообщения об ошибках и имитацию API задержек для реалистичного UX. Архитектура использует вспомогательные функции для разделения бизнес-логики и обеспечивает type safety через TypeScript guards.

**Экспортируемые сущности / API**

- `export const exchangeRouter` — композитный роутер с процедурами:
  - `getRates` — получение текущих курсов всех криптовалют
  - `getLimits` — получение лимитов для конкретной валюты
  - `calculateExchange` — расчет суммы обмена в обе стороны
  - `createOrder` — создание новой заявки на обмен (protected)
  - `getOrderStatus` — получение статуса заявки по ID
  - `getOrderHistory` — история заявок по email с пагинацией
  - `getSupportedCurrencies` — список поддерживаемых валют с метаданными

**Входы (expected inputs) / Параметры**

- `getRates`: без параметров
- `getLimits`: `{ currency: string }` — символ криптовалюты
- `calculateExchange`: `{ amount: number, currency: string, direction: 'crypto-to-uah' | 'uah-to-crypto' }`
- `createOrder`: `{ email: string, cryptoAmount: number, currency: string, recipientData?: object }`
- `getOrderStatus`: `{ orderId: string }` — ID заявки
- `getOrderHistory`: `{ email: string, limit?: number }` — email и лимит записей
- `getSupportedCurrencies`: без параметров

**Выходы / Побочные эффекты**

- Создание/обновление пользователей через userManager
- Создание заявок через orderManager с уникальными ID
- Генерация криптоадресов для депозитов
- Возврат детализированных данных об обменах с комиссиями
- Задержки выполнения для имитации реальных API (API_DELAY_MS, ORDER_CREATION_DELAY_MS)
- Валидация и санитизация email адресов

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `./index.ts` — композиция в главный appRouter
- Клиентский код через `trpc.exchange.*` вызовы
- Компоненты обменных форм и калькуляторов

Файлы, которые импортируются здесь:

- `@repo/constants` — валюты, задержки, статусы заявок, UI константы
- `@repo/exchange-core` — вся бизнес-логика (валидация, расчеты, менеджеры)
- `@repo/utils` — схемы валидации, утилиты пагинации и сортировки, фабрики ошибок
- `zod` — дополнительная валидация recipientData
- `../context` — типизация контекста
- `../init` — базовые строительные блоки tRPC
- `../middleware/rateLimit` — защита создания заявок

**Домен данных / типы**

```typescript
// Основные типы обмена
interface ExchangeRate {
  currency: CryptoCurrency;
  uahRate: number;
  commission: number;
  timestamp: Date;
}

interface Order {
  id: string;
  email: string;
  cryptoAmount: number;
  uahAmount: number;
  currency: CryptoCurrency;
  status: OrderStatus;
  depositAddress: string;
  recipientData?: { cardNumber?: string; bankDetails?: string };
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
}

// Расчетные результаты
interface ExchangeCalculation {
  cryptoAmount: number;
  uahAmount: number;
  rate: number;
  commission: number;
  commissionAmount: number;
}
```

**Риски и безопасность**

- **Rate limiting**: Критически важно для предотвращения spam заявок
- **Data validation**: Множественные уровни валидации входных данных
- **Email security**: Санитизация email для предотвращения injection
- **Business logic**: Корректность расчетов влияет на финансы
- **Address generation**: Безопасность генерации криптоадресов
- **User creation**: Автоматическое создание пользователей может быть использовано для spam

**Тесты / рекомендации по покрытию**

- Unit тесты всех helper functions (assertValidCurrency, ensureUser, etc.)
- Integration тесты полного flow создания заявки
- Математические тесты расчетов обмена с edge cases
- Валидационные тесты для всех входных схем
- Performance тесты rate limiting и задержек
- E2E тесты с реальными криптоадресами (в testnet)

**Оценка сложности (low/medium/high)**

**high** — критическая бизнес-логика с финансовыми расчетами и множественными интеграциями

**TODO / Рефакторинг**

- **PRIORITY 1**: Интеграция с реальными blockchain сетями для генерации адресов
- **PRIORITY 2**: Подключение к реальным API курсов криптовалют
- Добавить webhook уведомления о статусах заявок
- Реализовать автоматическое обновление курсов в реальном времени
- Добавить более сложную логику комиссий (volume-based, tier-based)
- Реализовать KYC/AML проверки для крупных сумм
- Добавить мониторинг и алерты для подозрительных операций
