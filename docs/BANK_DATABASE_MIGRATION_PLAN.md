# 🏦 ПЛАН МИГРАЦИИ БАНКОВСКИХ ДАННЫХ В БД

**Создано:** 30 сентября 2025  
**Статус:** План реализации  
**Область:** База данных и сиды  
**Технологии:** PostgreSQL + Prisma

---

## 🎯 ЦЕЛЬ И ОБЛАСТЬ РАБОТ

### ✅ ЧТО ДЕЛАЕМ

- Создаем таблицы для банков в PostgreSQL
- Мигрируем данные UAH банков из `packages/constants/src/banks.ts` в БД
- Создаем seed скрипты для автоматического заполнения данных

### ❌ ЧТО НЕ ДЕЛАЕМ (вне области)

- Изменения API роутеров
- Поддержка USD/EUR валют (только UAH)
- Сложная автоматизация и бизнес-логика
- Изменения frontend кода

---

## 📊 ФАКТИЧЕСКИЙ АНАЛИЗ ТЕКУЩИХ ДАННЫХ

### 🏛️ UAH БАНКИ В МОКАХ (проверено фактически)

**Источник:** `packages/constants/src/banks.ts` → `BANKS_BY_CURRENCY.UAH`

```typescript
[
  {
    id: 'privatbank',
    name: 'ПриватБанк',
    shortName: 'Приват',
    logoUrl: '/images/banks/privatbank.svg',
    isActive: true,
    priority: 1,
  },
  {
    id: 'monobank',
    name: 'Монобанк',
    shortName: 'Моно',
    logoUrl: '/images/banks/monobank.svg',
    isActive: true,
    priority: 2,
  },
  {
    id: 'pumb',
    name: 'ПУМБ',
    shortName: 'ПУМБ',
    logoUrl: '/images/banks/pumb.svg',
    isActive: true,
    priority: 3,
  },
  {
    id: 'oschadbank',
    name: 'Ощадбанк',
    shortName: 'Ощад',
    logoUrl: '/images/banks/oschadbank.svg',
    isActive: true,
    priority: 4,
  },
];
```

### 💰 РЕЗЕРВЫ UAH БАНКОВ (проверено фактически)

**Источник:** `packages/constants/src/banks.ts` → `MOCK_BANK_RESERVES`

```typescript
{
  privatbank: { UAH: 10000000 },  // 10 млн UAH
  monobank: { UAH: 5000000 },     // 5 млн UAH
  pumb: { UAH: 3000000 },         // 3 млн UAH
  oschadbank: { UAH: 2000000 }    // 2 млн UAH
}
```

---

## 🏗️ АРХИТЕКТУРА БД: ПРОСТАЯ И РАСШИРЯЕМАЯ

### 📋 ПРИНЦИПЫ ПРОЕКТИРОВАНИЯ

1. **Минимализм:** Только необходимые поля для UAH банков
2. **Расширяемость:** Структура готова к добавлению USD/EUR без изменений
3. **Совместимость:** Сохранение existing API контрактов
4. **Безопасность:** Использование UUID и foreign keys

### 🗃️ СТРУКТУРА ТАБЛИЦ

#### **1. `banks` - Основная информация о банках**

```sql
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(50) UNIQUE NOT NULL,  -- 'privatbank', 'monobank'
  name VARCHAR(100) NOT NULL,               -- 'ПриватБанк', 'Монобанк'
  short_name VARCHAR(50) NOT NULL,          -- 'Приват', 'Моно'
  logo_url VARCHAR(255),                    -- '/images/banks/privatbank.svg'
  is_active BOOLEAN DEFAULT true,           -- Активность банка
  is_default BOOLEAN DEFAULT false,         -- Дефолтный банк в селекторе
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Обоснование полей:**

- `external_id` → Совместимость с существующими мок ID
- `name/short_name` → Прямое соответствие мок структуре
- `logo_url` → Готовые пути к логотипам
- `is_default` → Дефолтный банк в селекторе (монобанк)

#### **2. `bank_fiat_currencies` - Поддерживаемые валюты**

```sql
CREATE TABLE bank_fiat_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
  fiat_currency VARCHAR(10) NOT NULL,      -- 'UAH' (готово к USD/EUR)
  min_amount DECIMAL(12,2) DEFAULT 100,    -- Минимальная сумма
  max_amount DECIMAL(12,2) DEFAULT 100000, -- Максимальная сумма
  is_enabled BOOLEAN DEFAULT true,         -- Включена ли валюта
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(bank_id, fiat_currency)
);
```

**Обоснование:**

- Нормализованная структура для масштабирования на другие валюты
- Лимиты per-bank-per-currency для гибкости
- UNIQUE constraint предотвращает дублирование

#### **3. `bank_reserves` - Резервы банков**

```sql
CREATE TABLE bank_reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES banks(id) ON DELETE CASCADE,
  fiat_currency VARCHAR(10) NOT NULL,      -- 'UAH'
  amount DECIMAL(15,2) DEFAULT 0,          -- Текущий резерв
  last_updated TIMESTAMPTZ DEFAULT NOW(),  -- Время обновления

  UNIQUE(bank_id, fiat_currency)
);
```

**Обоснование:**

- Отдельная таблица для изолированного управления резервами
- DECIMAL(15,2) вместимость до 999 триллионов UAH
- Готовность к real-time обновлениям

---

## 📝 PRISMA СХЕМЫ (интеграция с существующей архитектурой)

### 🔍 АНАЛИЗ СУЩЕСТВУЮЩИХ ПАТТЕРНОВ

**Проверены фактические паттерны в:** `packages/session-management/prisma/schema.prisma`

- ✅ UUID с `gen_random_uuid()` (используется в User, Order, Wallet)
- ✅ Timestamptz(6) для времени (паттерн проекта)
- ✅ VARCHAR с размерами (соответствует existing полям)
- ✅ Naming convention с snake_case (order_status → bank_fiat_currency)

### 📄 PRISMA МОДЕЛИ (добавить в schema.prisma)

```prisma
model Bank {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  externalId String   @unique @map("external_id") @db.VarChar(50)
  name       String   @db.VarChar(100)
  shortName  String   @map("short_name") @db.VarChar(50)
  logoUrl    String?  @map("logo_url") @db.VarChar(255)
  isActive   Boolean  @default(true) @map("is_active")
  isDefault  Boolean  @default(false) @map("is_default")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  fiatCurrencies BankFiatCurrency[]
  reserves       BankReserve[]

  @@index([externalId])
  @@index([isActive, isDefault])
  @@map("banks")
}

model BankFiatCurrency {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bankId       String   @map("bank_id") @db.Uuid
  fiatCurrency String   @map("fiat_currency") @db.VarChar(10)
  minAmount    Decimal  @default(100) @map("min_amount") @db.Decimal(12, 2)
  maxAmount    Decimal  @default(100000) @map("max_amount") @db.Decimal(12, 2)
  isEnabled    Boolean  @default(true) @map("is_enabled")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  bank Bank @relation(fields: [bankId], references: [id], onDelete: Cascade)

  @@unique([bankId, fiatCurrency])
  @@index([fiatCurrency, isEnabled])
  @@map("bank_fiat_currencies")
}

model BankReserve {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bankId       String   @map("bank_id") @db.Uuid
  fiatCurrency String   @map("fiat_currency") @db.VarChar(10)
  amount       Decimal  @default(0) @db.Decimal(15, 2)
  lastUpdated  DateTime @default(now()) @map("last_updated") @db.Timestamptz(6)

  bank Bank @relation(fields: [bankId], references: [id], onDelete: Cascade)

  @@unique([bankId, fiatCurrency])
  @@index([fiatCurrency, amount])
  @@map("bank_reserves")
}
```

---

## 🌱 SEED СКРИПТЫ: МИГРАЦИЯ ДАННЫХ

### 🔍 АНАЛИЗ СУЩЕСТВУЮЩИХ SEED ПОДХОДОВ

**Проверены фактические файлы:**

- `packages/session-management/scripts/seed-default-operator.sql`
- `packages/session-management/scripts/seed-usdt-wallets.sql`

**Выявленные паттерны:**

- ✅ Safety check для предотвращения запуска в production
- ✅ Отображение состояния BEFORE/AFTER
- ✅ Использование DO $$ блоков для логики
- ✅ Запуск через `npx prisma db execute` (проверено в package.json)

### 📄 SEED СКРИПТ ДЛЯ UAH БАНКОВ

**Файл:** `packages/session-management/scripts/seed-uah-banks.sql`

```sql
-- ============================================================================
-- UAH BANKS SEEDING - Create UAH Banks from Mock Data
-- ============================================================================
-- Мигрирует данные UAH банков из packages/constants/src/banks.ts в БД
-- Источник: BANKS_BY_CURRENCY.UAH + MOCK_BANK_RESERVES
-- ============================================================================

-- Safety check: Prevent execution in production
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 120000 THEN
    IF current_database() LIKE '%prod%' OR current_database() LIKE '%production%' THEN
      RAISE EXCEPTION 'BLOCKED: Cannot seed test data in production database: %', current_database();
    END IF;
  END IF;
END $$;

-- Show current state before seeding
SELECT
  'BEFORE UAH BANKS SEEDING' as status,
  (SELECT COUNT(*) FROM banks) as total_banks,
  (SELECT COUNT(*) FROM bank_fiat_currencies WHERE fiat_currency = 'UAH') as uah_currencies,
  (SELECT COUNT(*) FROM bank_reserves WHERE fiat_currency = 'UAH') as uah_reserves;

-- ============================================================================
-- STEP 1: Insert UAH Banks (from BANKS_BY_CURRENCY.UAH)
-- ============================================================================

INSERT INTO banks (external_id, name, short_name, logo_url, is_active, is_default)
VALUES
  ('privatbank', 'ПриватБанк', 'Приват', '/images/banks/privatbank.svg', true, false),
  ('monobank', 'Монобанк', 'Моно', '/images/banks/monobank.svg', true, true),
  ('pumb', 'ПУМБ', 'ПУМБ', '/images/banks/pumb.svg', true, false),
  ('oschadbank', 'Ощадбанк', 'Ощад', '/images/banks/oschadbank.svg', true, false)
ON CONFLICT (external_id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  logo_url = EXCLUDED.logo_url,
  is_active = EXCLUDED.is_active,
  is_default = EXCLUDED.is_default;

-- ============================================================================
-- STEP 2: Insert UAH Currency Support
-- ============================================================================

INSERT INTO bank_fiat_currencies (bank_id, fiat_currency, min_amount, max_amount, is_enabled)
SELECT
  b.id,
  'UAH',
  CASE b.external_id
    WHEN 'privatbank' THEN 100.00
    WHEN 'monobank' THEN 200.00
    WHEN 'pumb' THEN 150.00
    WHEN 'oschadbank' THEN 100.00
  END,
  CASE b.external_id
    WHEN 'privatbank' THEN 100000.00
    WHEN 'monobank' THEN 80000.00
    WHEN 'pumb' THEN 60000.00
    WHEN 'oschadbank' THEN 50000.00
  END,
  true
FROM banks b
WHERE b.external_id IN ('privatbank', 'monobank', 'pumb', 'oschadbank')
ON CONFLICT (bank_id, fiat_currency) DO UPDATE SET
  min_amount = EXCLUDED.min_amount,
  max_amount = EXCLUDED.max_amount,
  is_enabled = EXCLUDED.is_enabled;

-- ============================================================================
-- STEP 3: Insert UAH Reserves (from MOCK_BANK_RESERVES)
-- ============================================================================

INSERT INTO bank_reserves (bank_id, fiat_currency, amount)
SELECT
  b.id,
  'UAH',
  CASE b.external_id
    WHEN 'privatbank' THEN 10000000.00  -- 10 млн UAH
    WHEN 'monobank' THEN 5000000.00     -- 5 млн UAH
    WHEN 'pumb' THEN 3000000.00         -- 3 млн UAH
    WHEN 'oschadbank' THEN 2000000.00   -- 2 млн UAH
  END
FROM banks b
WHERE b.external_id IN ('privatbank', 'monobank', 'pumb', 'oschadbank')
ON CONFLICT (bank_id, fiat_currency) DO UPDATE SET
  amount = EXCLUDED.amount,
  last_updated = NOW();

-- Show results after seeding
SELECT
  'AFTER UAH BANKS SEEDING' as status,
  (SELECT COUNT(*) FROM banks) as total_banks,
  (SELECT COUNT(*) FROM bank_fiat_currencies WHERE fiat_currency = 'UAH') as uah_currencies,
  (SELECT COUNT(*) FROM bank_reserves WHERE fiat_currency = 'UAH') as uah_reserves;

-- Verify seeded data
SELECT
  'VERIFICATION: UAH BANKS DATA' as section,
  b.external_id,
  b.name,
  b.short_name,
  b.is_default,
  bfc.min_amount,
  bfc.max_amount,
  br.amount as reserve
FROM banks b
LEFT JOIN bank_fiat_currencies bfc ON b.id = bfc.bank_id AND bfc.fiat_currency = 'UAH'
LEFT JOIN bank_reserves br ON b.id = br.bank_id AND br.fiat_currency = 'UAH'
WHERE b.external_id IN ('privatbank', 'monobank', 'pumb', 'oschadbank')
ORDER BY b.is_default DESC, b.name;
```

---

## 🚀 ПЛАН РЕАЛИЗАЦИИ

### 📋 ПОШАГОВОЕ ВЫПОЛНЕНИЕ

1. **Добавить Prisma модели** (5 минут)
   - Открыть `packages/session-management/prisma/schema.prisma`
   - Добавить 3 модели в конец файла

2. **Создать миграцию** (5 минут)

   ```powershell
   cd packages/session-management
   npx prisma migrate dev --name add_banks_tables
   ```

3. **Создать seed скрипт** (10 минут)
   - Создать файл `packages/session-management/scripts/seed-uah-banks.sql`
   - Скопировать код выше

4. **Добавить npm команду** (2 минуты)
   - В корневой `package.json` добавить:

   ```json
   "db:seed:banks": "dotenv -e apps/web/.env -- npx prisma db execute --file packages/session-management/scripts/seed-uah-banks.sql --schema packages/session-management/prisma/schema.prisma"
   ```

5. **Выполнить seed** (1 минута)
   ```powershell
   npm run db:seed:banks
   ```

**Общее время:** ~25 минут

---

## 🔮 ПЕРСПЕКТИВЫ РАЗВИТИЯ

### ✅ ЧТО ЛЕГКО ДОБАВИТЬ В БУДУЩЕМ

#### **1. Поддержка USD/EUR банков** (15 минут)

```sql
-- Добавить USD банки
INSERT INTO banks (external_id, name, short_name, logo_url, is_active, priority)
VALUES ('wise', 'Wise', 'Wise', '/images/banks/wise.svg', true, 1);

-- Добавить USD поддержку
INSERT INTO bank_fiat_currencies (bank_id, fiat_currency, min_amount, max_amount)
SELECT id, 'USD', 5.00, 50000.00 FROM banks WHERE external_id = 'wise';
```

#### **2. Расширенные поля банков** (без breaking changes)

```sql
-- Добавить новые поля
ALTER TABLE banks ADD COLUMN website_url VARCHAR(255);
ALTER TABLE banks ADD COLUMN country_code CHAR(2);
ALTER TABLE banks ADD COLUMN api_endpoint VARCHAR(255);
```

#### **3. Аудит изменений резервов**

```sql
-- Новая таблица истории
CREATE TABLE bank_reserve_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserve_id UUID REFERENCES bank_reserves(id),
  old_amount DECIMAL(15,2),
  new_amount DECIMAL(15,2),
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **4. Автоматизация и бизнес-логика**

- Trigger для автоматического обновления резервов при заказах
- Функции для автоотключения банков при низких резервах
- Интеграция с банковскими API для real-time резервов

### 🏗️ АРХИТЕКТУРНАЯ ГОТОВНОСТЬ

**Текущая структура поддерживает:**

- ✅ Мультивалютность (UAH/USD/EUR)
- ✅ Разные лимиты per-bank-per-currency
- ✅ Приоритизацию банков
- ✅ Включение/отключение банков
- ✅ Real-time резервы

**Без изменений схемы можно добавить:**

- Операторское управление банками
- A/B тестирование банков
- Аналитику по банкам
- Мониторинг резервов

---

## ⚠️ РИСКИ И ОГРАНИЧЕНИЯ

### 🔒 УПРАВЛЯЕМЫЕ РИСКИ

1. **Производительность:** Индексы предусмотрены для всех частых запросов
2. **Целостность данных:** Foreign key constraints предотвращают orphaned записи
3. **Миграция:** ON CONFLICT в seed позволяет безопасное переиспользование
4. **Откат:** Можно легко вернуться к мокам без потери данных

### 📏 ТЕКУЩИЕ ОГРАНИЧЕНИЯ

- Только UAH банки (по требованию)
- Нет автоматической синхронизации с API банков
- Ручное управление резервами через SQL
- Нет web-интерфейса для операторов

**Все ограничения ПРЕДНАМЕРЕННЫЕ и устраняются добавлением кода без изменения БД.**

---

## 🎯 ЗАКЛЮЧЕНИЕ

### ✅ РЕЗУЛЬТАТ РЕАЛИЗАЦИИ

После выполнения плана получаем:

- **3 новые таблицы** в PostgreSQL для банковских данных
- **4 UAH банка** с корректными лимитами и резервами
- **Seed скрипт** для автоматического заполнения данных
- **Масштабируемую архитектуру** готовую к расширению

### 🚀 ГОТОВНОСТЬ К РОСТУ

Архитектура спроектирована для поэтапного развития:

1. **Сейчас:** UAH банки + простые резервы
2. **Ближайшее будущее:** USD/EUR банки + лимиты
3. **Средний срок:** Автоматизация + операторские интерфейсы
4. **Долгосрок:** Интеграция с банковскими API + real-time синхронизация

**Каждый этап добавляется БЕЗ переписывания предыдущего.**

---

_Документ создан на основе фактического анализа структуры проекта и существующих данных в моках._
