### Путь: packages/exchange-core/src/utils/calculations.ts

**Краткое назначение (1 предложение)**

Централизованные математические расчеты для обменных операций включая курсы валют, комиссии, конвертацию сумм и проверку лимитов.

**Подробное описание (3–6 предложений)**

Модуль является математическим ядром обменной системы, предоставляя все необходимые расчетные функции для работы с криптовалютами и фиатными суммами. Включает получение актуальных курсов из мок-данных, двустороннюю конвертацию между криптовалютой и гривнами с учетом комиссий, а также расчет чистых комиссий для отображения пользователю. Система использует централизованные утилиты из @repo/utils для устранения дублирования кода в расчетах комиссий и форматирования. Все функции работают с типизированными курсами и поддерживают проверку лимитов в USD эквиваленте для унифицированного контроля сумм. Модуль также предоставляет информацию о лимитах для каждой валюты в удобном формате для UI компонентов. Точность расчетов обеспечивается константами округления и специализированными функциями форматирования.

**Экспортируемые сущности / API**

- `export function getExchangeRate(currency: CryptoCurrency): ExchangeRate` — Получение курса валюты
- `export function calculateUahAmount(cryptoAmount: number, currency: CryptoCurrency): number` — Конвертация крипто → UAH
- `export function calculateCryptoAmount(uahAmount: number, currency: CryptoCurrency): number` — Конвертация UAH → крипто
- `export function calculateCommission(cryptoAmount: number, currency: CryptoCurrency): number` — Расчет комиссии в UAH
- `export function isAmountWithinLimits(cryptoAmount: number, currency: CryptoCurrency): { isValid: boolean; reason?: string }` — Проверка лимитов
- `export function getCurrencyLimits(currency: CryptoCurrency)` — Получение лимитов валюты

**Входы (expected inputs) / Параметры**

- `getExchangeRate`: `currency: CryptoCurrency` — тип криптовалюты (BTC, ETH, USDT, LTC)
- `calculateUahAmount`: `cryptoAmount: number` (сумма крипто), `currency: CryptoCurrency`
- `calculateCryptoAmount`: `uahAmount: number` (сумма в гривнах), `currency: CryptoCurrency`
- `calculateCommission`: `cryptoAmount: number`, `currency: CryptoCurrency`
- `isAmountWithinLimits`: `cryptoAmount: number`, `currency: CryptoCurrency`
- `getCurrencyLimits`: `currency: CryptoCurrency`

**Выходы / Побочные эффекты**

- `getExchangeRate`: возвращает `ExchangeRate` с курсами USD/UAH, комиссией и временем обновления
- `calculateUahAmount`: возвращает `number` — сумма в гривнах после вычета комиссии
- `calculateCryptoAmount`: возвращает `number` — сумма криптовалюты с учетом комиссии
- `calculateCommission`: возвращает `number` — размер комиссии в гривнах
- `isAmountWithinLimits`: возвращает объект с флагом валидности и причиной ошибки
- `getCurrencyLimits`: возвращает объект с минимальными/максимальными лимитами в крипто и USD
- Побочные эффекты: форматирование и парсинг сумм через утилиты

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `apps/web/src/server/trpc/routers/exchange.ts` — курсы и конвертация для API
- `apps/web/src/server/trpc/routers/fiat.ts` — расчеты для фиатных операций
- `packages/hooks/src/state/exchange-helpers.ts` — расчеты для UI компонентов
- `packages/exchange-core/src/utils/business-validators.ts` — проверка лимитов
- `packages/exchange-core/src/index.ts` — реэкспорт функций

Файлы, которые импортируются здесь:

- `@repo/constants` — COMMISSION_RATES, AMOUNT_LIMITS, MOCK_EXCHANGE_RATES, PERCENTAGE_CALCULATIONS
- `@repo/utils` — calculateNetAmount, calculateGrossAmountFromNet, calculateCommissionAmount, formatUahAmount, parseFormattedAmount
- `../types` — CryptoCurrency, ExchangeRate типы
- `./crypto` — formatCryptoAmount функция

**Домен данных / типы**

```typescript
// Основные типы
type CryptoCurrency = 'BTC' | 'ETH' | 'USDT' | 'LTC';

interface ExchangeRate {
  currency: CryptoCurrency;
  usdRate: number;
  uahRate: number;
  commission: number;
  lastUpdated: Date;
}

// Результат проверки лимитов
interface AmountValidationResult {
  isValid: boolean;
  reason?: string;
}

// Информация о лимитах
interface CurrencyLimitsInfo {
  minCrypto: number;
  maxCrypto: number;
  minUSD: number;
  maxUSD: number;
}

// Используемые константы
const COMMISSION_RATES: Record<CryptoCurrency, number>;
const AMOUNT_LIMITS: { MIN_USD: number; MAX_USD: number };
const MOCK_EXCHANGE_RATES: Record<CryptoCurrency, { usdRate: number; uahRate: number }>;
```

**Риски и безопасность**

- **Mock data dependency**: использование MOCK_EXCHANGE_RATES в продакшене может привести к неактуальным курсам
- **Floating point precision**: расчеты с числами с плавающей точкой могут привести к неточностям
- **Commission calculation**: неправильные расчеты комиссий влияют на доходность бизнеса
- **Currency rate synchronization**: отсутствие реального источника курсов создает риски
- **Amount limits bypass**: неправильная проверка лимитов может привести к слишком большим/маленьким операциям
- **Rounding errors**: накопление ошибок округления в сложных расчетах

**Тесты / рекомендации по покрытию**

- Unit тесты для getExchangeRate: все поддерживаемые валюты, корректность структуры ответа
- Unit тесты двусторонней конвертации: crypto→UAH→crypto должна давать близкий результат
- Unit тесты расчета комиссий: различные суммы, граничные значения
- Unit тесты проверки лимитов: значения ниже/выше лимитов, граничные случаи
- Integration тесты с реальными UI компонентами для проверки точности расчетов
- Performance тесты: скорость расчетов при высокой нагрузке
- Precision тесты: проверка точности при малых и больших суммах

**Оценка сложности (low/medium/high)**

**medium** — умеренная сложность из-за множественных математических операций, зависимостей от констант и требований к точности.

**TODO / Рефакторинг**

- Заменить MOCK_EXCHANGE_RATES на реальный API источник курсов валют
- Добавить валидацию входящих параметров на NaN, Infinity, отрицательные значения
- Рассмотреть использование библиотеки для точных вычислений (decimal.js) для устранения ошибок округления
- Добавить кеширование курсов с TTL для повышения производительности
- Реализовать fallback механизм для получения курсов при недоступности основного источника
- Добавить логирование всех расчетных операций для аудита и отладки
