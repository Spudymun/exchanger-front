# 📋 ПЛАН ИСПРАВЛЕНИЯ: Отображение банка и курса фиксации в ордере

**Дата анализа:** 1 октября 2025  
**Приоритет:** Высокий  
**Статус:** Готов к реализации

## 🎯 АНАЛИЗ ПРОБЛЕМЫ

### Выявленные недостатки на скриншоте:

1. **❌ Отсутствует название банка** рядом с номером карты `**** **** **** 4270`
2. **❌ Не отображается курс фиксации** ордера (только динамический курс)

## 🔍 АРХИТЕКТУРНЫЙ АНАЛИЗ

### Текущая структура страницы ордера:

```
apps/web/app/[locale]/order/[orderId]/
├── page.tsx                    # Server Component с метаданными
├── OrderPageClient.tsx         # Client Component с OrderStatus
└── useOrderStatus hook        # Получение данных ордера
```

### Компонент отображения данных:

```
packages/ui/src/components/order/
├── OrderStatus.tsx                           # Главный компонент
└── helpers/OrderStatusHelpers.tsx            # Хелперы (место изменений)
    ├── OrderFinancialInfo()                  # ⚠️ НУЖНО ОБНОВИТЬ
    └── AmountDisplayWithCopy()               # ⚠️ НУЖНО ОБНОВИТЬ
```

## 🗄️ АНАЛИЗ БАЗЫ ДАННЫХ

### Текущая схема Order (Prisma):

```sql
model Order {
  id                 String    @id
  publicId           String    @unique
  userId             String
  cryptoAmount       Decimal   @db.Decimal(36, 18)
  currency           String
  uahAmount          Decimal   @db.Decimal(12, 2)
  status             OrderStatus
  recipientData      Json?     -- ⚠️ Содержит только cardNumber
  -- ❌ ОТСУТСТВУЕТ: bankId
  -- ❌ ОТСУТСТВУЕТ: fixedExchangeRate
}
```

### Существующая схема Bank:

```sql
model Bank {
  id         String @id
  externalId String @unique
  name       String
  shortName  String
  -- ✅ ГОТОВА К ИСПОЛЬЗОВАНИЮ
}
```

## 📊 ДЕТАЛЬНЫЙ ПЛАН ИСПРАВЛЕНИЙ

### 🔧 ЭТАП 1: Расширение схемы БД

**Файл:** `packages/session-management/prisma/schema.prisma`

```prisma
model Order {
  // Существующие поля...

  // ✅ ДОБАВИТЬ:
  bankId              String?   @map("bank_id") @db.Uuid
  fixedExchangeRate   Decimal?  @map("fixed_exchange_rate") @db.Decimal(8, 4)

  // ✅ ДОБАВИТЬ RELATION:
  bank                Bank?     @relation(fields: [bankId], references: [id])
}

model Bank {
  // Существующие поля...

  // ✅ ДОБАВИТЬ ОБРАТНУЮ СВЯЗЬ:
  orders              Order[]
}
```

### 🔧 ЭТАП 2: Обновление типов TypeScript

**Файл:** `packages/exchange-core/src/types/order.ts`

```typescript
export interface Order {
  // Существующие поля...

  // ✅ ДОБАВИТЬ:
  bankId?: string; // ID банка получателя
  fixedExchangeRate?: number; // Курс на момент создания ордера
}

export interface OrderWithUIData extends Order {
  // Существующие поля...

  // ✅ ДОБАВИТЬ:
  bankName?: string; // Название банка (из relation)
  bankShortName?: string; // Короткое название банка
}
```

### 🔧 ЭТАП 3: Обновление API слоя

**Файл:** `apps/web/src/server/trpc/routers/user/orders.ts`

```typescript
// В методе getOrderDetails:
.query(async ({ input, ctx }) => {
  const order = await validateOrderAccess(input.orderId, user.email);

  return {
    // Существующие поля...

    // ✅ ДОБАВИТЬ:
    bankId: order.bankId,
    fixedExchangeRate: order.fixedExchangeRate ?
      Number(order.fixedExchangeRate) : undefined,
    bankName: order.bank?.name,
    bankShortName: order.bank?.shortName,
  };
});
```

**Файл:** `packages/session-management/src/adapters/postgres-order-adapter.ts`

```typescript
// В методе findByPublicId:
const order = await this.prisma.order.findUnique({
  where: { publicId },
  include: {
    wallet: true,
    bank: true, // ✅ ДОБАВИТЬ
  },
});

// В методе create:
const prismaOrder = await this.prisma.order.create({
  data: {
    // Существующие поля...
    bankId: orderData.bankId, // ✅ ДОБАВИТЬ
    fixedExchangeRate: orderData.fixedExchangeRate, // ✅ ДОБАВИТЬ
  },
  include: {
    wallet: true,
    bank: true, // ✅ ДОБАВИТЬ
  },
});
```

### 🔧 ЭТАП 4: Обновление интерфейса

**Файл:** `packages/ui/src/components/order/helpers/OrderStatusHelpers.tsx`

```tsx
export function OrderFinancialInfo({
  orderData,
  locale,
  t,
}: {
  orderData: Order;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4">
      {/* Существующий код... */}

      {/* ✅ ОБНОВИТЬ: Карта получателя С БАНКОМ */}
      {orderData.recipientData?.cardNumber && (
        <div>
          <p className={textStyles.heading.sm}>{t('recipientCard')}</p>
          <div className="space-y-1">
            <p className={combineStyles(textStyles.body.md, 'font-mono')}>
              {maskCardNumber(orderData.recipientData.cardNumber)}
            </p>
            {/* ✅ ДОБАВИТЬ отображение банка */}
            {(orderData as OrderWithUIData).bankName && (
              <p className={combineStyles(textStyles.body.sm, 'text-muted-foreground')}>
                {(orderData as OrderWithUIData).bankName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AmountDisplayWithCopy({
  orderData,
  locale,
  t,
}: {
  orderData: Order;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="group">
      <p className={combineStyles(textStyles.heading.sm, 'mb-3')}>{t('amount')}</p>
      <div className="rounded-lg border-2 border-primary/30 bg-primary/10 p-4 group-hover:bg-primary/15 transition-colors shadow-sm">
        <div className="flex items-center gap-4">
          {/* Существующий код обмена... */}

          {/* ✅ ДОБАВИТЬ отображение курса фиксации */}
          {orderData.fixedExchangeRate && (
            <div className="mt-2 pt-2 border-t border-primary/20">
              <p className={combineStyles(textStyles.body.sm, 'text-muted-foreground')}>
                {t('fixedRate')}: 1 {orderData.currency} ={' '}
                {orderData.fixedExchangeRate.toLocaleString(locale)} ₴
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 🔧 ЭТАП 5: Добавление переводов

**Файл:** `apps/web/messages/ru/order-page.json`

```json
{
  "OrderStatus": {
    // Существующие переводы...
    "fixedRate": "Курс фиксации",
    "recipientBank": "Банк получателя"
  }
}
```

**Файл:** `apps/web/messages/en/order-page.json`

```json
{
  "OrderStatus": {
    // Existing translations...
    "fixedRate": "Fixed Rate",
    "recipientBank": "Recipient Bank"
  }
}
```

### 🔧 ЭТАП 6: Обновление создания ордера

**Файл:** `apps/web/src/server/trpc/routers/exchange.ts`

```typescript
// В методе createOrder:
.mutation(async ({ input, ctx }) => {
  // Получаем текущий курс
  const currentRate = await getExchangeRateAsync(validCurrency);

  // Извлекаем bankId из recipientData
  const bankId = extractBankIdFromRecipientData(orderRequest.recipientData);

  const order = await createOrderInSystem(
    {
      ...orderRequest,
      bankId,                           // ✅ ДОБАВИТЬ
      fixedExchangeRate: currentRate.uahRate,  // ✅ ДОБАВИТЬ
    },
    sessionMetadata,
    userSession
  );
});

// ✅ ДОБАВИТЬ функцию извлечения bankId
function extractBankIdFromRecipientData(recipientData?: any): string | undefined {
  // Логика определения банка по номеру карты
  // Можно использовать первые 6 цифр (BIN) для определения банка
  if (recipientData?.cardNumber) {
    const bin = recipientData.cardNumber.replace(/\s/g, '').substring(0, 6);
    return mapBinToBank(bin);
  }
  return undefined;
}
```

## 📂 ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ

### База данных:

1. `packages/session-management/prisma/schema.prisma` - добавить поля
2. `packages/session-management/prisma/migrations/` - новая миграция

### TypeScript типы:

3. `packages/exchange-core/src/types/order.ts` - обновить интерфейсы

### Backend API:

4. `apps/web/src/server/trpc/routers/user/orders.ts` - getOrderDetails
5. `packages/session-management/src/adapters/postgres-order-adapter.ts` - include bank
6. `apps/web/src/server/trpc/routers/exchange.ts` - createOrder

### Frontend компоненты:

7. `packages/ui/src/components/order/helpers/OrderStatusHelpers.tsx` - UI изменения

### Переводы:

8. `apps/web/messages/ru/order-page.json` - русские переводы
9. `apps/web/messages/en/order-page.json` - английские переводы

## ⚡ ПОРЯДОК РЕАЛИЗАЦИИ

1. **База данных** (миграция + Prisma)
2. **TypeScript типы** (обновление интерфейсов)
3. **Backend API** (обновление адаптеров и роутеров)
4. **Frontend** (обновление компонентов отображения)
5. **Переводы** (добавление новых ключей)
6. **Тестирование** (проверка отображения на странице ордера)

## 🎯 РЕЗУЛЬТАТ

После реализации на странице ордера будет отображаться:

✅ **Номер карты + название банка:**

```
Карта получателя
**** **** **** 4270
Монобанк
```

✅ **Сумма обмена + курс фиксации:**

```
10 USDT → 409,66 ₴
Курс фиксации: 1 USDT = 40,97 ₴
```

## ⚠️ ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **Обратная совместимость:** Все новые поля опциональные (`?`), старые ордера продолжат работать
2. **Извлечение bankId:** Требуется логика определения банка по номеру карты (BIN коды)
3. **Курс фиксации:** Сохраняется при создании ордера, не изменяется
4. **Производительность:** Добавление `include: { bank: true }` не критично для производительности

Этот план полностью решает обе проблемы с минимальными изменениями архитектуры и максимальной обратной совместимостью.
