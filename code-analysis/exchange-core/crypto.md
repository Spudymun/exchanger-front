### Путь: packages/exchange-core/src/utils/crypto.ts

**Краткое назначение (1 предложение)**

Утилиты для работы с криптовалютами включая генерацию адресов, валидацию, форматирование сумм и получение метаинформации о валютах.

**Подробное описание (3–6 предложений)**

Модуль предоставляет полный набор криптографических утилит для обработки всех аспектов работы с криптовалютами в обменной системе. Включает генерацию мок-адресов для депозитов через сервисный слой, валидацию криптоадресов с использованием Zod схем, и построение ссылок на blockchain explorers для отслеживания транзакций. Система предоставляет метаинформацию о валютах включая количество десятичных знаков, символы, полные названия и минимальные суммы для транзакций. Форматирование сумм происходит с учетом специфики каждой валюты и ограничений UI для корректного отображения пользователю. Модуль также включает бизнес-логику проверки минимальных сумм транзакций для предотвращения создания слишком маленьких операций. Все функции типизированы и интегрированы с централизованными константами для консистентности.

**Экспортируемые сущности / API**

- `export function generateDepositAddress(currency: CryptoCurrency): string` — Генерация адреса для депозита
- `export function validateCryptoAddress(address: string, currency: CryptoCurrency): boolean` — Валидация крипто-адреса
- `export function getTransactionExplorerUrl(txHash: string, currency: CryptoCurrency): string` — URL для explorer
- `export function getNetworkName(currency: CryptoCurrency): string` — Название сети
- `export function getCurrencyDecimals(currency: CryptoCurrency): number` — Количество десятичных знаков
- `export function formatCryptoAmount(amount: number, currency: CryptoCurrency): string` — Форматирование суммы
- `export function getMinTransactionAmount(currency: CryptoCurrency): number` — Минимальная сумма транзакции
- `export function isTransactionAmountValid(amount: number, currency: CryptoCurrency): boolean` — Проверка минимума
- `export function getCurrencySymbol(currency: CryptoCurrency): string` — Символ валюты
- `export function getCurrencyFullName(currency: CryptoCurrency): string` — Полное название валюты

**Входы (expected inputs) / Параметры**

- `generateDepositAddress`: `currency: CryptoCurrency` — тип криптовалюты
- `validateCryptoAddress`: `address: string` (адрес для проверки), `currency: CryptoCurrency` (тип валюты)
- `getTransactionExplorerUrl`: `txHash: string` (хеш транзакции), `currency: CryptoCurrency`
- `formatCryptoAmount`: `amount: number` (сумма), `currency: CryptoCurrency`
- `isTransactionAmountValid`: `amount: number` (сумма для проверки), `currency: CryptoCurrency`
- Остальные функции принимают только `currency: CryptoCurrency`

**Выходы / Побочные эффекты**

- `generateDepositAddress`: возвращает `string` — случайный мок-адрес из предустановленного списка
- `validateCryptoAddress`: возвращает `boolean` — результат валидации через Zod схему
- `getTransactionExplorerUrl`: возвращает `string` — полный URL к транзакции в explorer
- `formatCryptoAmount`: возвращает `string` — отформатированная сумма с правильной точностью
- `isTransactionAmountValid`: возвращает `boolean` — соответствие минимальной сумме
- Геттеры возвращают соответствующие метаданные валют из констант
- Побочные эффекты: использование Math.random() в генерации адресов через сервис

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `apps/web/src/server/trpc/routers/exchange.ts` — generateDepositAddress для создания заявок
- `packages/exchange-core/src/utils/calculations.ts` — formatCryptoAmount для расчетов
- `packages/exchange-core/src/index.ts` — реэкспорт всех функций

Файлы, которые импортируются здесь:

- `@repo/constants` — EXPLORER_URLS, NETWORK_NAMES, CURRENCY_DECIMALS, MIN_TRANSACTION_AMOUNTS, CURRENCY_SYMBOLS, CURRENCY_FULL_NAMES, DECIMAL_PRECISION
- `@repo/utils` — formatCryptoAmountForUI, createCryptoAddressSchema
- `../services` — generateCryptoDepositAddress
- `../types` — CryptoCurrency тип

**Домен данных / типы**

```typescript
// Основные типы
type CryptoCurrency = 'BTC' | 'ETH' | 'USDT' | 'LTC';

// Используемые константы
const EXPLORER_URLS: Record<CryptoCurrency, string>;
const NETWORK_NAMES: Record<CryptoCurrency, string>;
const CURRENCY_DECIMALS: Record<CryptoCurrency, number>;
const MIN_TRANSACTION_AMOUNTS: Record<CryptoCurrency, number>;
const CURRENCY_SYMBOLS: Record<CryptoCurrency, string>;
const CURRENCY_FULL_NAMES: Record<CryptoCurrency, string>;
const DECIMAL_PRECISION: {
  UI_MAX_DECIMAL_PLACES: number;
};

// Примеры значений
interface ExplorerUrls {
  BTC: 'https://blockstream.info/tx';
  ETH: 'https://etherscan.io/tx';
  USDT: 'https://etherscan.io/tx';
  LTC: 'https://blockexplorer.one/litecoin/mainnet/tx';
}
```

**Риски и безопасность**

- **Mock address generation**: использование предустановленных адресов создает риски в продакшене
- **Address validation reliability**: зависимость от корректности Zod схем для валидации
- **Explorer URL integrity**: изменения в explorer URLs могут привести к нерабочим ссылкам
- **Currency metadata consistency**: рассинхронизация констант может привести к ошибкам отображения
- **Transaction amount validation**: неправильные минимальные лимиты влияют на UX
- **Random generation predictability**: Math.random() не является криптографически стойким
- **Schema injection**: некорректные схемы валидации могут пропустить невалидные адреса

**Тесты / рекомендации по покрытию**

- Unit тесты для generateDepositAddress: все валюты, проверка на валидность сгенерированных адресов
- Unit тесты для validateCryptoAddress: валидные/невалидные адреса для каждой валюты
- Unit тесты для formatCryptoAmount: различные суммы, граничные значения, точность
- Unit тесты для isTransactionAmountValid: значения выше/ниже минимума для всех валют
- Integration тесты с реальными blockchain explorers для проверки URL генерации
- Performance тесты: генерация большого количества адресов
- Security тесты: проверка на injection в адресах, валидация схем

**Оценка сложности (low/medium/high)**

**low** — простые утилитарные функции с понятной логикой, но важные для функционирования системы.

**TODO / Рефакторинг**

- Заменить мок-генерацию адресов на интеграцию с реальными кошельками/API
- Добавить поддержку testnet/mainnet для различных окружений
- Рассмотреть использование криптографически стойкого генератора вместо Math.random()
- Добавить кеширование результатов валидации адресов для производительности
- Расширить поддержку дополнительных сетей (Polygon, BSC) для USDT
- Добавить валидацию explorer URLs при старте приложения
- Рассмотреть создание TypeScript энумов для строковых констант валют
