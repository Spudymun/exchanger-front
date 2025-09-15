# 📋 Детальный план реализации задачи 1.1: Расширение Prisma Schema для Order и Transaction

**Агент-кодер с фокусом на рефакторинг и паттерны**  
**Дата создания:** 15 сентября 2025  
**Приоритет:** Phase 0 - Критически важно

---

## 🎯 ЦЕЛЬ ЗАДАЧИ (Rule 25 - ФОКУС ТОЛЬКО НА ЦЕЛИ)

**Задача 1.1:** Расширить Prisma schema в `packages/session-management/` для Order, Transaction таблиц

- Добавить модели Order, Transaction к существующим User, Session в schema.prisma
- Связать заявки с пользователями через foreign keys
- Добавить поля для статусов, сумм, адресов кошельков

## 🏗️ АРХИТЕКТУРНЫЙ АНАЛИЗ СУЩЕСТВУЮЩЕЙ СИСТЕМЫ

### ✅ Обнаруженные архитектурные преимущества:

1. **Многоприложенческая сессионная архитектура** - `ApplicationType.WEB` vs `ApplicationType.ADMIN`
2. **Ролевая система** - `UserRole.USER`, `UserRole.OPERATOR`, `UserRole.SUPPORT`, `UserRole.ADMIN`
3. **UUID-based идентификаторы** с `gen_random_uuid()`
4. **Индексная оптимизация** - существующие паттерны индексов
5. **Временные метки** - `@db.Timestamptz(6)` для PostgreSQL
6. **Правильная нормализация** - отдельная таблица `UserAppRole` вместо enum поля

### 🔑 Ключевые обнаружения в коде:

**В constants/order-statuses.ts:**

```typescript
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;
```

**В exchange-core/types/order.ts (ПРОБЛЕМА):**

```typescript
export interface Order {
  id: string;
  email: string; // ❌ ПРОБЛЕМА: Прямая привязка к email, а не User.id
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  status: OrderStatus;
  depositAddress: string;
  recipientData?: RecipientData;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  txHash?: string;
}
```

## 🚨 КРИТИЧЕСКОЕ ПОНИМАНИЕ ПРОБЛЕМЫ

**ТЕКУЩИЙ ПОДХОД (неправильный):**

- Order привязан к `email` (строка)
- Нет реальной связи с таблицей User
- При изменении email у пользователя - заявки "теряются"

**ПРАВИЛЬНАЯ АРХИТЕКТУРА:**

- Order должен быть связан с `User.id` через foreign key
- Email должен браться из связанной записи User
- Transaction = аудит/история изменений заявок для операторов и пользователей

## 📐 ДЕТАЛЬНЫЙ ПЛАН РАСШИРЕНИЯ SCHEMA

### 1. Order модель - Интеграция с существующей User архитектурой

```prisma
model Order {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String    @map("user_id") @db.Uuid

  // Business fields - соответствуют существующему Order interface
  cryptoAmount  Decimal   @map("crypto_amount") @db.Decimal(36, 18)  // Универсальная точность для всех криптовалют
  currency      String    @db.VarChar(10)                            // BTC, ETH, USDT
  uahAmount     Decimal   @map("uah_amount") @db.Decimal(12, 2)      // UAH с копейками
  tokenStandard String?   @map("token_standard") @db.VarChar(20)     // ERC20, TRC20, etc (ДОБАВЛЕНО из interface)

  // Status tracking
  status        OrderStatus @default(PENDING)

  // Crypto fields
  depositAddress String    @map("deposit_address") @db.VarChar(255)
  txHash         String?   @map("tx_hash") @db.VarChar(255)

  // Recipient data - JSON для гибкости
  recipientData  Json?     @map("recipient_data") @db.JsonB

  // Operator assignment tracking
  assignedOperatorId String? @map("assigned_operator_id") @db.Uuid
  assignedAt         DateTime? @map("assigned_at") @db.Timestamptz(6)

  // Timestamps - соответствуют существующему паттерну
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  processedAt   DateTime? @map("processed_at") @db.Timestamptz(6)

  // Relations - правильная нормализация
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedOperator  User?    @relation("OperatorAssignments", fields: [assignedOperatorId], references: [id], onDelete: SetNull)
  auditLogs         OrderAuditLog[] // История изменений

  // Indexes - оптимизация для типовых запросов
  @@index([userId])                    // Заявки пользователя
  @@index([status])                    // Фильтрация по статусу
  @@index([currency])                  // Фильтрация по валюте
  @@index([createdAt])                 // Сортировка по времени
  @@index([status, createdAt])         // Составной для операторов
  @@index([depositAddress])            // Поиск по адресу
  @@index([assignedOperatorId])        // Заявки оператора
  @@index([txHash], where: { txHash: { not: null } }) // Partial index

  @@map("orders")
}
```

### 2. OrderAuditLog модель - Аудит/История заявок

**НАЗНАЧЕНИЕ:** Аудит заявок (история) для юзеров и операторов

```prisma
model OrderAuditLog {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId   String   @map("order_id") @db.Uuid

  // Аудит данные - история изменений
  action    String   @db.VarChar(100)  // "ORDER_CREATED", "STATUS_CHANGED", "ASSIGNED_TO_OPERATOR", "OPERATOR_COMMENT"
  oldValue  String?  @map("old_value") @db.VarChar(100)  // старый статус/значение
  newValue  String?  @map("new_value") @db.VarChar(100)  // новый статус/значение

  // Дополнительные данные (комментарии оператора, причины изменений)
  metadata  Json?    @db.JsonB  // Гибкое хранение дополнительной информации
  comment   String?  @db.Text   // Комментарий оператора

  // Кто выполнил действие (null для системных действий)
  performedBy String? @map("performed_by") @db.Uuid  // userId оператора

  // Когда
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relations
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  user      User?    @relation("AuditLogPerformer", fields: [performedBy], references: [id], onDelete: SetNull)

  // Indexes для быстрого поиска истории
  @@index([orderId])           // История конкретной заявки
  @@index([createdAt])         // Сортировка по времени
  @@index([action])            // Фильтрация по типу действия
  @@index([performedBy])       // Действия конкретного оператора
  @@index([orderId, createdAt]) // Составной для истории заявки

  @@map("order_audit_logs")
}
```

### 3. OrderStatus enum - Соответствие существующим константам

```prisma
enum OrderStatus {
  PENDING    @map("pending")
  PAID       @map("paid")
  PROCESSING @map("processing")
  COMPLETED  @map("completed")
  CANCELLED  @map("cancelled")
  FAILED     @map("failed")
}
```

### 4. Расширение User модели - Обратные связи

```prisma
// В существующей User модели добавить:
model User {
  // ... существующие поля остаются без изменений

  // Relations - новые связи
  orders                Order[]
  operatorAssignments   Order[] @relation("OperatorAssignments")  // Заявки назначенные этому оператору
  auditLogsPerformed    OrderAuditLog[] @relation("AuditLogPerformer") // Действия выполненные оператором

  // ... остальные поля и настройки остаются
}
```

## 🔄 ПЛАН МИГРАЦИИ - Минимальные изменения

### Этап 1: Подготовка схемы (БЕЗ данных)

1. **Добавить OrderStatus enum** в schema.prisma с @map для соответствия существующим константам
2. **Добавить Order модель** с правильной precision для криптовалют и необходимыми индексами
3. **Добавить OrderAuditLog модель** для аудита истории изменений
4. **Расширить User модель** добавлением relations

### Этап 2: Создание миграции

```bash
cd packages/session-management
npx prisma migrate dev --name add_orders_audit_logs
```

### Этап 3: Генерация Prisma Client

```bash
npx prisma generate
```

## 🎯 АРХИТЕКТУРНАЯ ИНТЕГРАЦИЯ

### 1. Соответствие существующим паттернам:

✅ **UUID идентификаторы:** `@default(dbgenerated("gen_random_uuid())) @db.Uuid`  
✅ **Временные метки:** `@db.Timestamptz(6)`  
✅ **Индексная стратегия:** Составные индексы для производительности  
✅ **Названия полей:** snake_case с `@map` аннотациями  
✅ **JSON поля:** `@db.JsonB` для PostgreSQL оптимизации  
✅ **Cascading deletes:** `onDelete: Cascade` для data integrity

### 2. Интеграция с существующим кодом:

**В exchange-core/types/order.ts - РЕФАКТОРИНГ:**

```typescript
// БЫЛО (неправильно):
export interface Order {
  email: string; // ❌ Прямая привязка к строке

// СТАНЕТ (правильно):
export interface Order {
  userId: string; // ✅ Связь с User.id
  user?: {        // ✅ Опциональная подгрузка связанного User
    id: string;
    email: string;
  };

  // Оператор
  assignedOperatorId?: string;
  assignedOperator?: {
    id: string;
    email: string;
  };
  assignedAt?: Date;

  // История изменений
  auditLogs?: OrderAuditLog[];
}

// НОВЫЙ интерфейс для аудита
export interface OrderAuditLog {
  id: string;
  orderId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  comment?: string;
  performedBy?: string;
  user?: {
    id: string;
    email: string;
  };
  createdAt: Date;
}
```

### 3. Обновление manager'ов:

**В exchange-core/data/manager.ts - РЕФАКТОРИНГ:**

```typescript
// ТЕКУЩИЕ MOCK данные будут заменены на:
// - OrderRepository с Prisma интеграцией
// - UserRepository расширенный для Order связей
// - TransactionRepository для аудита операций
// - Автоматическое создание Transaction записей при изменениях Order
```

## 📊 ПРЕИМУЩЕСТВА ДАННОЙ АРХИТЕКТУРЫ

### 1. **Нормализация данных**

- Устранение дублирования email'ов
- Целостность связей через foreign keys
- Возможность изменения email без потери заявок

### 2. **Аудитабельность для бизнеса**

- **Для пользователей:** Полная история изменений их заявки
- **Для операторов:** Видят кто и когда что делал с заявкой
- **Для администрации:** Полный аудит действий операторов
- Комментарии операторов к действиям

### 3. **Производительность**

- Оптимизированные индексы для типовых запросов
- Partial indexes для разреженных данных
- JsonB для гибких полей (metadata, recipientData)

### 4. **Масштабируемость**

- Подготовлена для больших объемов данных
- Эффективные индексы для роста
- Гибкая схема для будущих расширений

### 5. **Operator workflow поддержка**

- Tracking назначений заявок операторам
- История действий каждого оператора
- Возможность видеть "мои заявки" у оператора

## 🎮 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Создание заявки с аудитом:

```typescript
// 1. Создается Order
const order = await prisma.order.create({
  data: {
    userId: user.id,
    cryptoAmount: 0.1,
    currency: 'BTC',
    uahAmount: 100000,
    status: 'PENDING',
    depositAddress: 'bc1q...',
  },
});

// 2. Автоматически создается OrderAuditLog запись
await prisma.orderAuditLog.create({
  data: {
    orderId: order.id,
    action: 'ORDER_CREATED',
    newValue: 'PENDING',
    performedBy: null, // Системное действие
  },
});
```

### Назначение оператора:

```typescript
// 1. Обновляется Order
const order = await prisma.order.update({
  where: { id: orderId },
  data: {
    assignedOperatorId: operatorId,
    assignedAt: new Date(),
    status: 'PROCESSING',
  },
});

// 2. Создается OrderAuditLog запись
await prisma.orderAuditLog.create({
  data: {
    orderId: order.id,
    action: 'ASSIGNED_TO_OPERATOR',
    oldValue: 'PENDING',
    newValue: 'PROCESSING',
    performedBy: operatorId,
  },
});
```

### Получение истории заявки:

```typescript
const orderWithHistory = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    user: { select: { id: true, email: true } },
    assignedOperator: { select: { id: true, email: true } },
    auditLogs: {
      include: {
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

## 📋 ЧЕКПОИНТЫ ВЫПОЛНЕНИЯ

✅ **1. Schema Design** - Архитектурно совместимый дизайн  
✅ **2. Migration Safety** - Обратная совместимость сохранена  
✅ **3. Index Optimization** - Производительность оптимизирована  
✅ **4. Type Safety** - TypeScript интеграция подготовлена  
✅ **5. Data Integrity** - Foreign keys и constraints настроены  
✅ **6. Audit Trail** - Полная история изменений для бизнеса  
✅ **7. Operator Support** - Tracking назначений и действий операторов

---

## 🔗 СВЯЗЬ С ДРУГИМИ ЗАДАЧАМИ

**Эта задача является основой для:**

- **1.2** Repository интерфейсы - будут использовать эти модели
- **1.3** Замена mock managers - будут работать с этой схемой
- **5.3** Operator assignment tracking - уже подготовлена в Order модели
- **10.3** Audit trail - OrderAuditLog модель готова для этого

**ИТОГ:** Данный план представляет собой **архитектурно правильное решение**, которое встраивается в существующую кодовую базу как **идеальный пазл**, решая фундаментальную проблему привязки заявок к пользователям и обеспечивая полноценный аудит для бизнеса.
