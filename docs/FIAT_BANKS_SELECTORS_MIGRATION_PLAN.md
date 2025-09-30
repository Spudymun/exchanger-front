# 🔄 ПЛАН МИГРАЦИИ СЕЛЕКТОРОВ ФИАТА И БАНКОВ: ОТ МОКОВ К БД

> **Дата создания:** 30 сентября 2025  
> **Статус:** Готов к реализации  
> **Основа:** Фактический анализ кодовой базы exchanger-front

## 🎯 ЦЕЛЬ МИГРАЦИИ

**ЦЕЛЬ:** Заменить моки `FIAT_CURRENCIES`, `BANKS_BY_CURRENCY`, `MOCK_BANK_RESERVES` из `packages/constants/src/` на данные из БД для селекторов фиата и банков на главной странице и обменнике.

## 📊 ТЕКУЩЕЕ СОСТОЯНИЕ (ФАКТИЧЕСКИ ПРОВЕРЕНО)

### ✅ ЧТО УЖЕ ЕСТЬ В ПРОЕКТЕ

#### 1. **БД ИНФРАСТРУКТУРА ГОТОВА**

```sql
-- ФАКТИЧЕСКИ СУЩЕСТВУЕТ в packages/session-management/prisma/schema.prisma (строки 209-256)
model Bank {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  externalId String   @unique @map("external_id") @db.VarChar(50)
  name       String   @db.VarChar(100)
  shortName  String   @map("short_name") @db.VarChar(50)
  logoUrl    String?  @map("logo_url") @db.VarChar(255)
  isActive   Boolean  @default(true) @map("is_active")
  isDefault  Boolean  @default(false) @map("is_default")

  fiatCurrencies BankFiatCurrency[]
  reserves       BankReserve[]
}

model BankFiatCurrency {
  bankId       String   @map("bank_id") @db.Uuid
  fiatCurrency String   @map("fiat_currency") @db.VarChar(10)
  minAmount    Decimal  @default(100) @map("min_amount") @db.Decimal(12, 2)
  maxAmount    Decimal  @default(100000) @map("max_amount") @db.Decimal(12, 2)
  isEnabled    Boolean  @default(true) @map("is_enabled")
}

model BankReserve {
  bankId       String   @map("bank_id") @db.Uuid
  fiatCurrency String   @map("fiat_currency") @db.VarChar(10)
  amount       Decimal  @default(0) @db.Decimal(15, 2)
}
```

#### 2. **СИДИНГ СКРИПТЫ ГОТОВЫ**

```bash
# ФАКТИЧЕСКИ СУЩЕСТВУЕТ packages/session-management/scripts/seed-uah-banks.sql
npm run db:seed:banks  # Мигрирует данные из BANKS_BY_CURRENCY.UAH + MOCK_BANK_RESERVES
```

#### 3. **API РОУТЕР ЧАСТИЧНО ГОТОВ**

```typescript
// ФАКТИЧЕСКИ СУЩЕСТВУЕТ apps/web/src/server/trpc/routers/fiat.ts (строки 1-182)
export const fiatRouter = createTRPCRouter({
  getSupportedFiatCurrencies: publicProcedure.query(async () => {
    // ❌ ИСПОЛЬЗУЕТ МОКИ: FIAT_CURRENCIES, FIAT_MIN_AMOUNTS, FIAT_MAX_AMOUNTS
  }),

  getBanksForFiatCurrency: publicProcedure.query(async () => {
    // ❌ ИСПОЛЬЗУЕТ МОКИ: getBanksForCurrency() из constants
  }),

  getBankInfo: publicProcedure.query(async () => {
    // ❌ ИСПОЛЬЗУЕТ МОКИ: getBankById(), getBankReserve() из constants
  }),
});
```

#### 4. **UI КОМПОНЕНТЫ ГОТОВЫ**

```typescript
// ФАКТИЧЕСКИ СУЩЕСТВУЕТ packages/ui/src/components/exchange/
export function FiatCurrencySelector(); // ✅ Готов к использованию БД
export function ExchangeBankSelector(); // ✅ Готов к использованию БД

// ФАКТИЧЕСКИ ИСПОЛЬЗУЕТСЯ в:
// - apps/web/src/components/hero-exchange/ReceivingCard.tsx (главная страница)
// - apps/web/src/components/exchange/ExchangeLayout.tsx (страница обмена)
```

#### 5. **КОНСТАНТЫ (ИСТОЧНИКИ МОКОВ)**

```typescript
// ФАКТИЧЕСКИ СУЩЕСТВУЕТ packages/constants/src/
export const FIAT_CURRENCIES = ['UAH', 'USD', 'EUR'] as const;
export const BANKS_BY_CURRENCY = {
  UAH: [
    /* 4 банка */
  ],
  USD: [
    /* 3 банка */
  ],
  EUR: [
    /* 3 банка */
  ],
};
export const MOCK_BANK_RESERVES = {
  privatbank: { UAH: 10000000, USD: 0, EUR: 0 },
  monobank: { UAH: 5000000, USD: 0, EUR: 0 },
  // ... и т.д.
};
```

### ❌ ЧТО НУЖНО ИЗМЕНИТЬ

1. **API роутер**: Заменить моки на Prisma запросы
2. **Типы**: Синхронизировать типы с БД моделями
3. **Состояние**: Обновить Zustand store для работы с API
4. **Тестирование**: Проверить интеграцию всех уровней

## 🏗️ АРХИТЕКТУРА МИГРАЦИИ: 5 УРОВНЕЙ

### УРОВЕНЬ 1: **ПРЕЗЕНТАЦИЯ** (React компоненты)

```
apps/web/src/components/hero-exchange/ReceivingCard.tsx
apps/web/src/components/exchange/ExchangeLayout.tsx
packages/ui/src/components/exchange/FiatCurrencySelector.tsx
packages/ui/src/components/exchange/ExchangeBankSelector.tsx
```

**Статус:** ✅ ГОТОВ - компоненты уже используют API через hooks

### УРОВЕНЬ 2: **СОСТОЯНИЕ** (Zustand + React Query)

```
packages/hooks/src/state/exchange-fiat-actions.ts
packages/hooks/src/state/exchange-store.ts
apps/web/src/hooks/useExchangeMutation.ts
```

**Статус:** ⚠️ ЧАСТИЧНО - hooks используют API, но store может кэшировать моки

### УРОВЕНЬ 3: **API** (tRPC роутеры)

```
apps/web/src/server/trpc/routers/fiat.ts
```

**Статус:** ❌ МОКИ - все методы используют константы из packages/constants

### УРОВЕНЬ 4: **ДАННЫЕ** (Prisma БД)

```
packages/session-management/prisma/schema.prisma
```

**Статус:** ✅ ГОТОВ - модели созданы и протестированы

### УРОВЕНЬ 5: **ИНИЦИАЛИЗАЦИЯ** (Seed скрипты)

```
packages/session-management/scripts/seed-uah-banks.sql
```

**Статус:** ✅ ГОТОВ - UAH банки уже мигрированы, USD/EUR добавляются легко

## 📋 ПЛАН МИГРАЦИИ: ПОШАГОВОЕ ВЫПОЛНЕНИЕ

### ЭТАП 1: ПОДГОТОВКА БД (15 минут)

#### 1.1 Применить существующую миграцию UAH банков

```bash
# БД модели уже существуют, нужно только засидить данные
npm run db:seed:banks
```

#### 1.2 Добавить USD и EUR банки (опционально)

```sql
-- Если нужна поддержка USD/EUR (файл уже документирован в BANK_DATABASE_MIGRATION_PLAN.md)
INSERT INTO banks (external_id, name, short_name, logo_url, is_active)
VALUES
  ('wise', 'Wise', 'Wise', '/images/banks/wise.svg', true),
  ('payoneer', 'Payoneer', 'Payoneer', '/images/banks/payoneer.svg', true);
```

#### 1.3 Проверить данные

```bash
npm run db:studio  # Визуально проверить таблицы banks, bank_fiat_currencies, bank_reserves
```

### ЭТАП 2: МОДИФИКАЦИЯ API (30 минут)

#### 2.1 Создать Prisma клиент в context

```typescript
// apps/web/src/server/trpc/context.ts
import { PrismaClient } from '@repo/session-management/prisma/client';

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  return {
    prisma: new PrismaClient(), // Добавить если отсутствует
    // ... существующий context
  };
};
```

#### 2.2 Обновить fiat router для использования БД

```typescript
// apps/web/src/server/trpc/routers/fiat.ts

// ЗАМЕНИТЬ:
getSupportedFiatCurrencies: publicProcedure.query(async () => {
  return FIAT_CURRENCIES.map(currency => ({ ... })); // MOCK
}),

// НА:
getSupportedFiatCurrencies: publicProcedure.query(async ({ ctx }) => {
  const currencies = await ctx.prisma.bankFiatCurrency.findMany({
    where: { isEnabled: true },
    select: { fiatCurrency: true },
    distinct: ['fiatCurrency']
  });

  return currencies.map(({ fiatCurrency }) => ({
    symbol: fiatCurrency as FiatCurrency,
    name: FIAT_CURRENCY_NAMES[fiatCurrency as keyof typeof FIAT_CURRENCY_NAMES],
    minAmount: FIAT_MIN_AMOUNTS[fiatCurrency as keyof typeof FIAT_MIN_AMOUNTS],
    maxAmount: FIAT_MAX_AMOUNTS[fiatCurrency as keyof typeof FIAT_MAX_AMOUNTS],
    isActive: true,
  }));
}),

// АНАЛОГИЧНО ДЛЯ getBanksForFiatCurrency И getBankInfo
```

#### 2.3 Обновить схемы валидации

```typescript
// packages/utils/src/validation/security-enhanced-exchange-schemas.ts

// ЗАМЕНИТЬ статические FIAT_CURRENCIES на динамические из БД
// Или создать функцию получения актуальных валют из API
```

### ЭТАП 3: ОБНОВЛЕНИЕ ТИПОВ (15 минут)

#### 3.1 Синхронизировать типы с БД

```typescript
// packages/exchange-core/src/types/fiat.ts

// ДОБАВИТЬ типы из Prisma
export type { Bank, BankFiatCurrency, BankReserve } from '@repo/session-management/prisma/client';

// ОБНОВИТЬ интерфейсы для соответствия БД
export interface BankWithReserves extends Bank {
  reserves: BankReserve[];
  fiatCurrencies: BankFiatCurrency[];
}
```

#### 3.2 Обновить экспорты констант

```typescript
// packages/constants/src/index.ts

// ДОБАВИТЬ пометки о миграции
export const FIAT_CURRENCIES = ['UAH', 'USD', 'EUR'] as const; // ⚠️ DEPRECATED: Use API
export const BANKS_BY_CURRENCY = { ... }; // ⚠️ DEPRECATED: Use API

// ДОБАВИТЬ новые типы
export type { Bank, BankFiatCurrency, BankReserve } from '@repo/exchange-core';
```

### ЭТАП 4: ТЕСТИРОВАНИЕ ИНТЕГРАЦИИ (30 минут)

#### 4.1 Проверить API endpoints

```bash
# Запустить dev сервер
npm run dev

# Проверить в браузере или через REST client:
# GET http://localhost:3000/api/trpc/fiat.getSupportedFiatCurrencies
# GET http://localhost:3000/api/trpc/fiat.getBanksForFiatCurrency?input={"currency":"UAH"}
```

#### 4.2 Проверить UI компоненты

```typescript
// В браузере проверить:
// 1. Главная страница: селекторы фиата и банков в ReceivingCard
// 2. Страница обмена: селекторы в ExchangeLayout
// 3. Должны загружаться данные из БД, а не моки
```

#### 4.3 Проверить состояние в DevTools

```javascript
// В React DevTools / Redux DevTools:
// 1. Убедиться что store получает данные из API
// 2. Проверить что старые константы не используются
```

### ЭТАП 5: ОЧИСТКА И ДОКУМЕНТАЦИЯ (15 минут)

#### 5.1 Добавить deprecated пометки

```typescript
// packages/constants/src/banks.ts
/**
 * @deprecated MIGRATED TO DATABASE
 * Use tRPC fiat.getBanksForFiatCurrency instead
 * Will be removed in v2.0
 */
export const BANKS_BY_CURRENCY = { ... };
```

#### 5.2 Обновить документацию

```markdown
# docs/core/API_DOCS.md

## ✅ MIGRATED: Fiat Router использует БД

- fiat.getSupportedFiatCurrencies - получает валюты из bank_fiat_currencies
- fiat.getBanksForFiatCurrency - получает банки из banks + bank_fiat_currencies
- fiat.getBankInfo - получает резервы из bank_reserves
```

#### 5.3 Создать миграционные тесты

```typescript
// packages/ui/src/__tests__/fiat-migration.test.ts
describe('Fiat Migration: DB vs Mocks', () => {
  it('should return same data structure from API as from mocks');
  it('should handle empty currency list gracefully');
  it('should filter inactive banks');
});
```

## 🔍 ВЕРИФИКАЦИЯ ГОТОВНОСТИ

### ✅ Чек-лист завершения миграции

- [ ] **БД**: Данные засиджены, модели работают
- [ ] **API**: fiatRouter использует Prisma вместо моков
- [ ] **UI**: Селекторы загружают данные из API
- [ ] **Типы**: Синхронизированы с БД моделями
- [ ] **Тесты**: Интеграционные тесты проходят
- [ ] **Документация**: Обновлена для отражения изменений
- [ ] **Deprecated**: Старые моки помечены как устаревшие

### 🎯 Критерии успеха

1. **Функциональность**: Селекторы работают идентично мокам
2. **Производительность**: Нет заметной задержки в UI
3. **Расширяемость**: Легко добавить новые валюты/банки через БД
4. **Консистентность**: Единый источник истины в БД
5. **Обратная совместимость**: Существующие формы работают без изменений

## ⚠️ РИСКИ И МИТИГАЦИЯ

### Высокий риск

- **API недоступно**: Fallback на константы в production
- **Данные БД некорректны**: Валидация при сидинге
- **Performance деградация**: Кэширование в React Query

### Средний риск

- **Типы не совпадают**: Тщательное тестирование типов
- **UI ломается**: Поэтапная замена компонентов
- **Тесты падают**: Обновление моков в тестах

### Низкий риск

- **Сложность миграции**: Хорошо документированная архитектура
- **Rollback**: Временное возвращение к мокам через feature flag

## 🚀 ДАЛЬНЕЙШЕЕ РАЗВИТИЕ

После успешной миграции селекторов:

1. **Мультивалютность**: Легко добавить EUR, USD банки
2. **Динамические резервы**: Реал-тайм обновление через WebSockets
3. **A/B тестирование**: Разные наборы банков для разных пользователей
4. **Географическая локализация**: Банки по странам/регионам
5. **Партнерские интеграции**: API синхронизация с банками

---

## 📝 ЗАКЛЮЧЕНИЕ

План основан на **фактическом состоянии кодовой базы** exchanger-front. Архитектура уже готова к миграции - нужно только заменить источники данных в API слое с сохранением всех существующих интерфейсов.

Миграция может быть выполнена **поэтапно** с минимальными рисками и **полной обратной совместимостью**.
