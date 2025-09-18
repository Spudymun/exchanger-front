# EMAIL LOCALIZATION TASK - Будущая задача

> **Создано:** 18 сентября 2025  
> **Приоритет:** Средний  
> **Тип:** Enhancement  
> **Статус:** Отложено

---

## 🎯 ОПИСАНИЕ ЗАДАЧИ

Добавить интернационализацию (i18n) для email сообщений в системе. В настоящее время все email приходят только на русском языке, независимо от локали пользователя.

## 🔍 ОБНАРУЖЕННАЯ ПРОБЛЕМА

**МЕСТОПОЛОЖЕНИЕ:** `packages/email-service/src/services/email-template-service.ts:105`

```typescript
subject: `💱 Заявка №${data.orderId} создана - отправьте ${data.amount} ${data.currency}`,
```

**ПРОБЛЕМЫ:**

1. ❌ Email subject жестко на русском языке
2. ❌ HTML/TXT templates содержат только русский текст
3. ❌ Нет учета локали пользователя при отправке email

**ВЛИЯНИЕ:**

- Пользователи с английской локалью получают русские email
- Нарушается UX для международных пользователей
- Несогласованность с i18n архитектурой проекта

## 📋 ТЕХНИЧЕСКОЕ РЕШЕНИЕ

### Архитектурный анализ

**СУЩЕСТВУЮЩАЯ ИНФРАСТРУКТУРА:**

- ✅ Проект поддерживает i18n через next-intl
- ✅ Есть `apps/web/messages/en/` и `apps/web/messages/ru/`
- ✅ Серверная локализация через `getServerErrorMessage()` уже работает
- ✅ tRPC context имеет `ctx.getErrorMessage()` для локализации

### Предлагаемое решение

#### 1. Создать email локализацию

**Создать файлы:**

```
apps/web/messages/en/email.json
apps/web/messages/ru/email.json
```

**Структура сообщений:**

```json
{
  "email": {
    "subjects": {
      "cryptoAddress": "💱 Order #{orderId} created - send {amount} {currency}",
      "orderConfirmation": "Order #{orderId} confirmed",
      "orderCompleted": "Order #{orderId} completed"
    },
    "templates": {
      "cryptoAddress": {
        "greeting": "Hello!",
        "orderCreated": "Your order #{orderId} has been created",
        "paymentInstructions": "To complete the exchange, send {amount} {currency} to:",
        "expiresAt": "Order valid until: {expiresAt}",
        "support": "Contact support if you have questions",
        "signature": "Sincerely, {companyName} Team"
      }
    }
  }
}
```

#### 2. Обновить EmailTemplateService

**Добавить локализацию:**

```typescript
import { getServerErrorMessage } from '@/server/utils/i18n-errors';

interface EmailLocalizationData extends CryptoAddressEmailData {
  locale: SupportedLocale; // Добавить локаль
}

static async generateCryptoAddressEmail(data: EmailLocalizationData): Promise<EmailMessage> {
  // Получить локализованные сообщения
  const getEmailMessage = createEmailMessageFunction(data.locale);

  const subject = await getEmailMessage('subjects.cryptoAddress', {
    orderId: data.orderId,
    amount: data.amount.toString(),
    currency: data.currency,
  });

  // ... остальная логика
}
```

#### 3. Передавать локаль из tRPC

**В exchange.ts router:**

```typescript
await EmailService.sendCryptoAddress({
  orderId: order.id,
  cryptoAddress: depositAddress,
  currency: orderRequest.currency,
  amount: orderRequest.cryptoAmount,
  expiresAt: new Date(Date.now() + ORDER_CREATION_DELAY_MS),
  userEmail: orderRequest.email,
  locale: ctx.locale, // Добавить локаль из контекста
});
```

#### 4. Создать многоязычные templates

**Структура:**

```
packages/email-service/src/templates/
├── en/
│   ├── crypto-address.html
│   └── crypto-address.txt
└── ru/
    ├── crypto-address.html
    └── crypto-address.txt
```

## 📊 ОЦЕНКА СЛОЖНОСТИ

**ВРЕМЯ ВЫПОЛНЕНИЯ:** 6-8 часов

**РАЗБИВКА:**

- Создание локализационных файлов: 2 часа
- Обновление EmailTemplateService: 2 часа
- Создание многоязычных templates: 2 часа
- Интеграция с tRPC context: 1 час
- Тестирование: 1-2 часа

**РИСКИ:**

- Низкий - архитектура уже поддерживает i18n
- Нужно учесть fallback на русский для неподдерживаемых локалей

## 🔗 СВЯЗАННЫЕ ЗАДАЧИ

- **Task 3.4**: Email service уже создан, нужно только добавить локализацию
- **Future**: Возможно потребуется локализация для других типов email (order completion, etc.)

## 📝 КРИТЕРИИ ГОТОВНОСТИ

- [ ] Email subjects локализованы на en/ru
- [ ] HTML/TXT templates существуют для обеих локалей
- [ ] Локаль передается из tRPC context
- [ ] Есть fallback на русский язык
- [ ] Протестировано для обеих локалей
- [ ] Документация обновлена

---

**СТАТУС:** Задача готова к реализации когда потребуется поддержка английских email
