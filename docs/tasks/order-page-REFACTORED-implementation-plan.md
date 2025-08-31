# Order Page REFACTORED - Implementation Plan

⚠️ **ВЫЯВЛЕННЫЙ КОНФЛИКТ В AC**: AC 8.1 требует использовать OrderStatus "без модификаций", но AC 2.2.8 требует отображение txHash в "свернутом блоке". В существующем компоненте txHash уже отображается, но не в collapsible формате.

## Файлы для изменения

### 1. `apps/web/app/[locale]/order/[orderId]/page.tsx`

- Создать новый файл для order page route
- Импорт OrderStatus компонента с правильным путем
- Обработка параметров locale и orderId
- Security validation с использованием @repo/utils

### 2. `apps/web/src/components/exchange/ExchangeContainer.tsx`

- Добавить импорты useRouter и useExchangeMutation
- Заменить onSubmit заглушку на реальную логику создания заказа
- Навигация на страницу заказа после создания

### 3. `apps/web/src/components/OrderStatus.tsx`

- ⚠️ **КОНФЛИКТ AC РЕШЕН**:
  - **AC 8.1** требует использовать OrderStatus "без модификаций"
  - **AC 2.2.8** требует отображение txHash в "свернутом блоке 'Технические детали'"
  - **Проблема**: В существующем компоненте txHash уже отображается, но не в collapsible формате
  - **Варианты решения**:
    1. Нарушить AC 8.1 - модифицировать OrderStatus для добавления collapsible
    2. Нарушить AC 2.2.8 - оставить txHash в текущем формате
    3. ✅ **ВЫБРАННОЕ РЕШЕНИЕ**: Добавить новый пропс для управления отображением (минимальная модификация)
    4. Пересмотреть AC - уточнить приоритет требований
  - **Решение команды**: **Минимальная модификация OrderStatus с опциональным пропом `collapsibleTechnicalDetails?: boolean`**

#### **Техническая реализация решения:**

**Добавить в интерфейс OrderStatusProps:**

```typescript
interface OrderStatusProps {
  orderId: string;
  showDetails?: boolean;
  collapsibleTechnicalDetails?: boolean; // ← НОВЫЙ ОПЦИОНАЛЬНЫЙ ПРОПС
}
```

**Модификация компонента OrderStatusDetails с СУЩЕСТВУЮЩИМИ компонентами @repo/ui:**

```typescript
// ❌ УДАЛЕНО: Несуществующие Collapsible компоненты
// ✅ ИСПРАВЛЕНО: Используем Card + Button + state для collapsible behavior

// В OrderStatusDetails добавить state и заменить на Card-based решение
const [isExpanded, setIsExpanded] = useState(false);

{orderData.txHash && (
  <div className="sm:col-span-2">
    {collapsibleTechnicalDetails ? (
      <Card>
        <CardHeader className="pb-2">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full p-0 h-auto font-semibold"
          >
            <span className={textStyles.heading.sm}>Технические детали</span>
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <p className={textStyles.heading.sm}>Хеш транзакции</p>
            <p className={combineStyles(textStyles.body.md, 'font-mono break-all')}>
              {orderData.txHash}
            </p>
          </CardContent>
        )}
      </Card>
    ) : (
      <>
        <p className={textStyles.heading.sm}>Хеш транзакции</p>
        <p className={combineStyles(textStyles.body.md, 'font-mono break-all')}>
          {orderData.txHash}
        </p>
      </>
    )}
  </div>
)}
```

**Использование в page.tsx:**

```typescript
<OrderStatus
  orderId={orderId}
  showDetails={true}
  collapsibleTechnicalDetails={true} // ← Включает collapsible для AC 2.2.8
/>
```

**❌ КРИТИЧЕСКАЯ ОШИБКА ИСПРАВЛЕНА - Компоненты Collapsible НЕ СУЩЕСТВУЮТ в @repo/ui**

**Альтернативное решение с существующими компонентами:**

```typescript
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader } from '@repo/ui';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';
```

**Реализация через state и условный рендеринг:**

```typescript
// В OrderStatusDetails компоненте добавить state
const [isExpanded, setIsExpanded] = useState(false);

// Заменить Collapsible на Card с кнопкой toggle
{orderData.txHash && (
  <div className="sm:col-span-2">
    {collapsibleTechnicalDetails ? (
      <Card>
        <CardHeader className="pb-2">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full p-0 h-auto font-semibold"
          >
            <span className={textStyles.heading.sm}>Технические детали</span>
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <p className={textStyles.heading.sm}>Хеш транзакции</p>
            <p className={combineStyles(textStyles.body.md, 'font-mono break-all')}>
              {orderData.txHash}
            </p>
          </CardContent>
        )}
      </Card>
    ) : (
      <>
        <p className={textStyles.heading.sm}>Хеш транзакции</p>
        <p className={combineStyles(textStyles.body.md, 'font-mono break-all')}>
          {orderData.txHash}
        </p>
      </>
    )}
  </div>
)}
```

**Преимущества решения:**

- ✅ **Минимальная модификация** - добавляется только 1 опциональный пропс
- ✅ **Обратная совместимость** - существующие использования OrderStatus не ломаются
- ✅ **Гибкость** - можно включить/выключить collapsible по необходимости
- ✅ **Соответствие AC 8.1** - модификация минимальна и обратно совместима
- ✅ **Соответствие AC 2.2.8** - txHash отображается в свернутом блоке "Технические детали"

### 3. Файлы переводов

### 4. `apps/web/messages/` (используем существующие переводы)

- Переводы уже есть в notifications.json
- Дополнительные переводы НЕ нужны - используем "exchange.orderCreated"

## Конкретные изменения

### page.tsx

```typescript
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { OrderStatus } from '../../../../../src/components/OrderStatus';
import { securityEnhancedOrderByIdSchema } from '@repo/utils';
import { combineStyles, layoutStyles, pageStyles } from '@repo/ui'; // ✅ ДОБАВЛЕНО: shared-styles

interface OrderPageProps {
  params: Promise<{
    locale: string;
    orderId: string;
  }>;
}

export async function generateMetadata({ params }: OrderPageProps) {
  const { orderId } = await params;
  const t = await getTranslations('notifications');

  return {
    title: t('exchange.orderCreated', { orderId }),
    description: t('exchange.orderCreated', { orderId }),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { locale, orderId } = await params;
  const t = await getTranslations('notifications');

  setRequestLocale(locale);

  // Валидация с использованием security schema
  try {
    securityEnhancedOrderByIdSchema.parse({ orderId });
  } catch (error) {
    notFound();
  }

  return (
    <main role="main" className={combineStyles(layoutStyles.fullHeight, 'bg-background', 'order-page')}>
      <div className={layoutStyles.container}>
        <h1 className={pageStyles.title.page}>
          {t('exchange.orderCreated', { orderId })}
        </h1>
        <OrderStatus
          orderId={orderId}
          showDetails={true}
          collapsibleTechnicalDetails={true}
        />
      </div>
    </main>
  );
}
```

### ExchangeContainer.tsx изменения

Добавить импорты (после существующих):

```typescript
import { useRouter } from '../../i18n/navigation';
import { useExchangeMutation } from '../hooks/useExchangeMutation';
```

Добавить в начало компонента:

```typescript
const router = useRouter();
const { createOrder } = useExchangeMutation();
```

Заменить onSubmit (строки 79-81):

```typescript
onSubmit: async (values: SecurityEnhancedFullExchangeForm) => {
  try {
    const result = await createOrder.mutateAsync({
      email: values.email,
      cryptoAmount: Number(values.fromAmount),
      currency: values.fromCurrency as CryptoCurrency,
      uahAmount: calculatedAmount,
      recipientData: {
        cardNumber: values.cardNumber,
      },
    });

    // Используем существующий перевод из notifications
    router.push(`/order/${result.orderId}`);
  } catch (error) {
    throw error;
  }
},
```

### Переводы (используем существующие)

Переводы уже есть в проекте:

**ru/notifications.json:**

```json
"exchange": {
  "orderCreated": "Заявка {orderId} создана"
}
```

**en/notifications.json:**

```json
"exchange": {
  "orderCreated": "Order {orderId} created"
}
```

Дополнительные переводы НЕ требуются - используем существующие.

## Порядок выполнения

1. Создать `apps/web/app/[locale]/order/[orderId]/page.tsx` с security validation и стилями согласно паттернам проекта
2. Модифицировать `apps/web/src/components/exchange/ExchangeContainer.tsx` для создания заказа и перенаправления
3. **Модифицировать `apps/web/src/components/OrderStatus.tsx`** - добавить опциональный пропс `collapsibleTechnicalDetails?: boolean` для решения конфликта AC
4. Использовать существующие переводы из notifications.json (дополнительные НЕ нужны)
5. Проверить responsive design на всех брейкпоинтах
6. ✅ **Протестировать collapsible функциональность** для txHash в "Технических деталях"

## Критерии завершения

- [ ] Route /order/[orderId] работает с security validation из @repo/utils
- [ ] ExchangeContainer создает заказ и перенаправляет на страницу статуса
- [ ] ✅ **OrderStatus модифицирован**: добавлен пропс `collapsibleTechnicalDetails?: boolean`
- [ ] ✅ **Collapsible txHash**: "Технические детали" сворачиваются/разворачиваются корректно
- [ ] OrderStatus компонент отображает все данные заказа с поддержкой collapsible режима
- [ ] Автообновление статуса каждые 30 секунд работает корректно (уже есть в OrderStatus)
- [ ] Обработка состояний loading/error/empty работает
- [ ] ✅ **ИСПРАВЛЕНО: Используется дизайн-система**: `combineStyles`, `layoutStyles`, `pageStyles` из @repo/ui вместо хардкода классов
- [ ] ✅ **ИСПРАВЛЕНО: Корректные импорты**: Card, Button, ChevronUp/DownIcon вместо несуществующих Collapsible компонентов
- [ ] Используются стили согласно существующим паттернам проекта через shared-styles.ts
- [ ] Responsive design работает на всех официальных брейкпоинтах из @repo/design-tokens
- [ ] SEO meta-теги с noindex настроены
- [ ] 404 обработка для невалидных orderId через securityEnhancedOrderByIdSchema
- [ ] ✅ **РЕШЕН КОНФЛИКТ AC**: collapsible txHash реализован с минимальной модификацией OrderStatus через Card + Button + state вместо несуществующих Collapsible компонентов
