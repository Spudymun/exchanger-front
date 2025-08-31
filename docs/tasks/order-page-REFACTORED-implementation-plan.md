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

### 4. `apps/web/messages/ru/common-ui.json` и `apps/web/messages/en/common-ui.json`

- Добавить переводы в секцию "OrderPage" (как требует AC 5.2)
- Переводы для metadata: title, description
- Переводы для состояний загрузки и ошибок### 5. `tests/order-page.spec.ts`

- Создать Playwright тесты для проверки функциональности
- Тест валидного orderId и тест 404 для невалидного
- Тест автообновления статуса каждые 30 секунд
- Тест отображения технических деталей

## Конкретные изменения

### page.tsx

```typescript
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { OrderStatus } from '../../../../../src/components/OrderStatus';
import { textStyles } from '@repo/ui';
import { securityEnhancedOrderByIdSchema } from '@repo/utils';

interface OrderPageProps {
  params: Promise<{
    locale: string;
    orderId: string;
  }>;
}

export async function generateMetadata({ params }: OrderPageProps) {
  const { orderId } = await params;
  const t = await getTranslations('OrderPage');

  return {
    title: t('metadata.title', { orderId }),
    description: t('metadata.description'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { locale, orderId } = await params;

  setRequestLocale(locale);

  // Валидация с использованием security schema
  try {
    securityEnhancedOrderByIdSchema.parse({ orderId });
  } catch (error) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className={textStyles.heading.lg}>
            Заявка #{orderId}
          </h1>
        </div>
        <OrderStatus orderId={orderId} showDetails={true} />
      </div>
    </div>
  );
}
```

### ExchangeContainer.tsx изменения

Добавить импорты (после существующих):Добавить импорты (после существующих):

```typescript
import { useRouter } from '../i18n/navigation';
import { useExchangeMutation } from '../hooks/useExchangeMutation';
```

Добавить в начало компонента:

```typescript
const router = useRouter();
const { createOrder } = useExchangeMutation();
```

Заменить onSubmit (строки 79-81):

````typescript
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

    router.push(`/order/${result.orderId}`);
  } catch (error) {
    throw error;
  }
### ExchangeContainer.tsx изменения

Добавить импорты (после существующих):

```typescript
import { useRouter } from '../../i18n/navigation';
import { useExchangeMutation } from '../hooks/useExchangeMutation';
````

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

    router.push(`/order/${result.orderId}`);
  } catch (error) {
    throw error;
  }
},
```

### Переводы common-ui.json

Добавить в секцию `technicalDetails`:

**ru/common-ui.json:**

````json
### Переводы common-ui.json

Добавить в секцию `OrderPage` (как требует AC 5.2):

**ru/common-ui.json:**
```json
"OrderPage": {
  "metadata": {
    "title": "Заявка #{orderId} | Обменник",
    "description": "Статус заявки на обмен криптовалюты"
  },
  "loading": "Загрузка информации о заявке...",
  "error": "Заявка не найдена",
  "retry": "Попробовать снова"
}
````

**en/common-ui.json:**

```json
"OrderPage": {
  "metadata": {
    "title": "Order #{orderId} | Exchanger",
    "description": "Cryptocurrency exchange order status"
  },
  "loading": "Loading order information...",
  "error": "Order not found",
  "retry": "Try again"
}
```

````

**en/common-ui.json:**

```json
"technicalDetails": {
  "title": "Technical Details",
  "txHash": "Transaction Hash",
  "createdAt": "Created",
  "updatedAt": "Updated"
}
````

### Playwright тесты order-page.spec.ts

Создать comprehensive тесты:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Order Page', () => {
  test('should display order details for valid orderId', async ({ page }) => {
    // Тест отображения валидной страницы заказа
  });

  test('should show 404 for invalid orderId', async ({ page }) => {
    // Тест обработки невалидного orderId
  });

  test('should auto-refresh order status every 30 seconds', async ({ page }) => {
    // Тест автообновления статуса
  });

  test('should toggle technical details section', async ({ page }) => {
    // Тест collapsible секции с txHash
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Тест responsive design
  });
});
```

## Порядок выполнения

1. Создать `apps/web/app/[locale]/order/[orderId]/page.tsx` с security validation
2. Модифицировать `apps/web/src/components/exchange/ExchangeContainer.tsx` для создания заказа и перенаправления
3. Обновить файлы переводов для новых элементов интерфейса (секция OrderPage)
4. Создать Playwright тесты для полного покрытия функциональности
5. Проверить responsive design на всех брейкпоинтах
6. Тестировать полный flow: форма → создание заказа → страница статуса
7. ⚠️ Обсудить конфликт AC 8.1 vs AC 2.2.8 по поводу collapsible txHash

## Критерии завершения

- [ ] Route /order/[orderId] работает с security validation из @repo/utils
- [ ] ExchangeContainer создает заказ и перенаправляет на страницу статуса
- [ ] OrderStatus компонент отображает все данные заказа (используется существующий)
- [ ] Автообновление статуса каждые 30 секунд работает корректно (уже есть в OrderStatus)
- [ ] Обработка состояний loading/error/empty работает
- [ ] Все тексты локализованы в секции OrderPage (ru/en)
- [ ] Responsive design работает на всех официальных брейкпоинтах из @repo/design-tokens
- [ ] Playwright тесты покрывают основную функциональность
- [ ] SEO meta-теги с noindex настроены
- [ ] 404 обработка для невалидных orderId через securityEnhancedOrderByIdSchema
- [ ] ⚠️ Решен конфликт AC: collapsible txHash vs "без модификаций OrderStatus"
