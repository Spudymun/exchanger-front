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

- ⚠️ **КОНФЛИКТ AC**:
  - **AC 8.1** требует использовать OrderStatus "без модификаций"
  - **AC 2.2.8** требует отображение txHash в "свернутом блоке 'Технические детали'"
  - **Проблема**: В существующем компоненте txHash уже отображается, но не в collapsible формате
  - **Варианты решения**:
    1. Нарушить AC 8.1 - модифицировать OrderStatus для добавления collapsible
    2. Нарушить AC 2.2.8 - оставить txHash в текущем формате
    3. Добавить новый пропс для управления отображением (минимальная модификация)
    4. Пересмотреть AC - уточнить приоритет требований
  - **Решение команды**: [ТРЕБУЕТСЯ РЕШЕНИЕ]

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
    <main role="main" className="order-page min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <h1 className="text-2xl font-bold mb-8">
          {t('exchange.orderCreated', { orderId })}
        </h1>
        <OrderStatus orderId={orderId} showDetails={true} />
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
3. Использовать существующие переводы из notifications.json (дополнительные НЕ нужны)
4. Проверить responsive design на всех брейкпоинтах
5. ⚠️ Обсудить конфликт AC 8.1 vs AC 2.2.8 по поводу collapsible txHash

## Критерии завершения

- [ ] Route /order/[orderId] работает с security validation из @repo/utils
- [ ] ExchangeContainer создает заказ и перенаправляет на страницу статуса
- [ ] OrderStatus компонент отображает все данные заказа (используется существующий)
- [ ] Автообновление статуса каждые 30 секунд работает корректно (уже есть в OrderStatus)
- [ ] Обработка состояний loading/error/empty работает
- [ ] Используются существующие переводы из notifications.json
- [ ] Используются стили согласно существующим паттернам проекта (как в exchange/page.tsx)
- [ ] Responsive design работает на всех официальных брейкпоинтах из @repo/design-tokens
- [ ] SEO meta-теги с noindex настроены
- [ ] 404 обработка для невалидных orderId через securityEnhancedOrderByIdSchema
- [ ] ⚠️ Решен конфликт AC: collapsible txHash vs "без модификаций OrderStatus"
