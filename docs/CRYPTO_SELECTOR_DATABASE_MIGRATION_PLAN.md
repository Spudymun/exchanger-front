# План миграции выбора криптовалют: от статических констант к базе данных

## Обзор

Этот план описывает **прозрачную** миграцию компонентов выбора криптовалют с использования статических констант на динамические данные из базы данных. Миграция изменяет **только внутреннюю логику** существующего API `exchange.getSupportedCurrencies` без создания новых эндпоинтов, хуков или состояний загрузки.

## Текущее состояние системы (ПРОВЕРЕНО)

### API

- **Эндпоинт**: `exchange.getSupportedCurrencies` (строка 905)
- **Реализация**: Использует массив `CRYPTOCURRENCIES` из констант
- **Возвращает**:

```typescript
{
  symbol: string; // валюта из CRYPTOCURRENCIES
  name: string; // из CURRENCY_NAMES
  rate: number; // из getExchangeRate()
  commission: number; // из getExchangeRate()
  limits: object; // из getCurrencyLimits()
  isActive: boolean; // всегда true
}
[];
```

### Компоненты

- **CryptoCurrencySelector**: Использует `CRYPTOCURRENCIES` напрямую из констант
- **TokenStandardSelector**: Использует `getTokenStandards(currency)` из констант
- **Кэширование**: React Query с 5-минутным staleTime глобально

### База данных

- **Таблица**: `wallets` с полями `currency`, `tokenStandard`
- **Репозиторий**: `WalletRepositoryInterface` существует, но НЕ содержит методы `findDistinct*`
- **Адаптер**: `PostgresWalletAdapter` наследует от `BasePostgresAdapter`

## Цель миграции

**ЕДИНСТВЕННАЯ цель**: Заменить источник данных в API `getSupportedCurrencies` с констант на базу данных **БЕЗ изменения интерфейса API**.

## План миграции

### Этап 1: Добавление методов в репозиторий

#### 1.1 Дополнить WalletRepositoryInterface

**Файл**: `packages/exchange-core/src/repositories/wallet-repository-interface.ts`

Добавить после существующих методов:

```typescript
// Методы для получения поддерживаемых валют
findDistinctCurrencies(): Promise<string[]>;
findDistinctTokenStandards(currency?: string): Promise<string[]>;
```

#### 1.2 Реализовать в PostgresWalletAdapter

**Файл**: `packages/session-management/src/adapters/postgres-wallet-adapter.ts`

Добавить методы:

```typescript
async findDistinctCurrencies(): Promise<string[]> {
  const result = await this.executeQuery(
    'SELECT DISTINCT currency FROM wallets WHERE status != $1 ORDER BY currency',
    ['DISABLED']  // исключаем только DISABLED, включаем AVAILABLE и ALLOCATED
  );
  return result.rows.map(row => row.currency);
}

async findDistinctTokenStandards(currency?: string): Promise<string[]> {
  const query = currency
    ? 'SELECT DISTINCT token_standard FROM wallets WHERE currency = $1 AND status != $2 AND token_standard IS NOT NULL ORDER BY token_standard'
    : 'SELECT DISTINCT token_standard FROM wallets WHERE status != $1 AND token_standard IS NOT NULL ORDER BY token_standard';

  const params = currency ? [currency, 'DISABLED'] : ['DISABLED'];
  const result = await this.executeQuery(query, params);

  return result.rows.map(row => row.token_standard);
}
```

### Этап 2: Изменение логики API

**Файл**: `apps/web/src/server/trpc/routers/exchange.ts`

Заменить строки 905-919 (используя существующий паттерн из строк 223-234):

```typescript
// Получить поддерживаемые криптовалюты
getSupportedCurrencies: publicProcedure.query(async () => {
  // Используем тот же паттерн создания адаптера, что и в getWalletByAddress (строки 223-234)
  const { PostgresWalletAdapter, getPrismaClient } = await import('@repo/session-management');
  const { SESSION_CONSTANTS } = await import('@repo/constants');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // Fallback на константы если БД недоступна
    return CRYPTOCURRENCIES.map(currency => {
      const rate = getExchangeRate(currency);
      const limits = getCurrencyLimits(currency);
      return {
        symbol: currency,
        name: CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES],
        rate: rate.uahRate,
        commission: rate.commission,
        limits,
        isActive: true,
      };
    });
  }

  const prisma = getPrismaClient({
    url: databaseUrl,
    maxConnections: SESSION_CONSTANTS.DATABASE.MAX_CONNECTIONS,
  });

  const walletRepository = new PostgresWalletAdapter(prisma);

  try {
    // Получаем валюты из базы данных вместо констант
    const databaseCurrencies = await walletRepository.findDistinctCurrencies();

    return databaseCurrencies.map(currency => {
      const rate = getExchangeRate(currency);
      const limits = getCurrencyLimits(currency);
      return {
        symbol: currency,
        name: CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES] || currency,
        rate: rate.uahRate,
        commission: rate.commission,
        limits,
        isActive: true,
      };
    });
  } catch (error) {
    // Graceful degradation: fallback на константы при ошибке БД
    console.error('Database error in getSupportedCurrencies, falling back to constants:', error);

    return CRYPTOCURRENCIES.map(currency => {
      const rate = getExchangeRate(currency);
      const limits = getCurrencyLimits(currency);
      return {
        symbol: currency,
        name: CURRENCY_NAMES[currency as keyof typeof CURRENCY_NAMES],
        rate: rate.uahRate,
        commission: rate.commission,
        limits,
        isActive: true,
      };
    });
  }
}),
```

### Этап 3: Обновление логики компонентов (опционально)

Компоненты могут **продолжать использовать константы** ИЛИ переключиться на API:

**Вариант A**: Оставить как есть - компоненты используют константы
**Вариант B**: Обновить компоненты для использования tRPC (уже кэшируется 5 минут)

## Что НЕ изменяется

1. **Нет новых эндпоинтов** - используем существующий `getSupportedCurrencies`
2. **Нет новых хуков** - компоненты могут продолжать работать с константами
3. **Нет состояний загрузки** - данные уже кэшируются 5 минут
4. **Нет изменений интерфейса** - API возвращает тот же формат данных
5. **Совместимость** - если база недоступна, можно добавить fallback на константы

## Умная логика сетей

TokenStandardSelector получает сети через:

```typescript
// В компоненте
const standards = getTokenStandards(currency);
```

Можно **дополнительно** обновить `getTokenStandards()` чтобы она:

1. Сначала проверяла кэш tRPC (если API уже вызывался)
2. Если есть данные из базы - использовала их
3. Если нет - использовала константы как fallback

## Откат

В случае проблем:

1. Восстановить старую версию `getSupportedCurrencies` из git
2. Все компоненты продолжат работать с константами

## ✅ ИСПРАВЛЕНИЯ КРИТИЧЕСКИХ ПРОБЛЕМ

### 🚨 Проблема 1: Неверный статус в SQL

**ИСПРАВЛЕНО**: Вместо `status = 'ACTIVE'` используется `status != 'DISABLED'`

- Включает валюты со статусами `AVAILABLE` и `ALLOCATED`
- Исключает только `DISABLED` кошельки
- Соответствует реальной схеме БД

### 🚨 Проблема 2: Отсутствие walletRepository в контексте

**ИСПРАВЛЕНО**: Используется существующий паттерн создания адаптера

- Применен паттерн из функции `getWalletByAddress` (строки 223-234)
- Локальное создание `PostgresWalletAdapter` вместо контекста
- Добавлен graceful degradation с fallback на константы

### 🚨 Проблема 3: Неправильные номера строк

**ИСПРАВЛЕНО**: Обновлены корректные номера строк 905-919

## Преимущества исправленного подхода

1. **Консистентность**: Использует существующую архитектуру проекта
2. **Надежность**: Graceful degradation при проблемах с БД
3. **Гибкость**: Включает все активные кошельки
4. **Безопасность**: Правильная фильтрация по статусам

## Заключение

Это **исправленная минимальная прозрачная миграция**, которая меняет только источник данных в одном API методе, сохраняя всю существующую функциональность и производительность с добавлением надежности через fallback механизмы.
