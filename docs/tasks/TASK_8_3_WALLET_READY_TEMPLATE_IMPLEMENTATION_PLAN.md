# План реализации задачи 8.3: Дополнение Email Templates для WALLET_READY уведомлений

> **Дата создания:** 22 сентября 2025  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Задача:** Добавить недостающий WALLET_READY_TEMPLATE в существующую архитектуру email service  
> **Источник анализа:** Фактическое состояние vs AC требования

---

## 🚨 КРИТИЧЕСКИЙ АНАЛИЗ НЕОБХОДИМОСТИ

### ✅ ПОДТВЕРЖДЕННЫЕ ФАКТЫ:

**1. Email Service УЖЕ РЕАЛИЗОВАН** в `packages/email-service/` с:

- ✅ Templates: `crypto-address.html/txt`, `system-alert.html/txt`
- ✅ `EmailTemplateService` с variable replacement
- ✅ XSS protection через `sanitizeHtmlContent`
- ✅ Централизованное использование `@repo/constants`
- ✅ Provider Pattern с Mock/SendGrid/Resend/Gmail поддержкой

**2. Задача 8.3 ЧАСТИЧНО НЕАКТУАЛЬНА:**

- ❌ Предлагает создание в `packages/constants/` - архитектурно неправильно
- ✅ Templates УЖЕ в правильном месте: `packages/email-service/src/templates/`

**3. ОБНАРУЖЕН КРИТИЧЕСКИЙ ПРОБЕЛ:**

- ✅ Есть `crypto-address` template для ORDER_CREATED (AC6.2)
- ❌ ОТСУТСТВУЕТ `wallet-ready` template для AC6.3 ("заявки из очереди")

---

## 🎯 МИНИМАЛЬНЫЕ ИЗМЕНЕНИЯ ДЛЯ ИНТЕГРАЦИИ

### **ЦЕЛЬ:** Добавить WALLET_READY_TEMPLATE в существующую архитектуру

**Принципы интеграции:**

- ✅ **Переиспользование** существующих паттернов
- ✅ **Минимальные изменения** в 4 файлах
- ✅ **Соответствие** проектным соглашениям
- ✅ **Обратная совместимость** всех API

---

## 📦 ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ

### **🔧 ЭТАП 1: Расширение типов (1 файл)**

**ФАЙЛ:** `packages/email-service/src/types/index.ts`

```typescript
// Добавить новый interface для WALLET_READY template data
export interface WalletReadyEmailData {
  orderId: string;
  cryptoAddress: string;
  currency: CryptoCurrency;
  amount: number;
  expiresAt: Date;
  userEmail: string;
  queuePosition?: number; // Позиция в очереди (опционально)
  waitTime?: string; // Время ожидания (опционально)
}

// Расширить EmailTemplateType union
export type EmailTemplateType =
  | 'crypto-address' // ✅ Существующий
  | 'system-alert' // ✅ Существующий
  | 'wallet-ready' // 🆕 НОВЫЙ для заявок из очереди
  | 'order-confirmation' // Для будущих задач
  | 'order-status-update'; // Для будущих задач
```

**Обоснование:**

- Переиспользует паттерн существующих `*EmailData` interfaces
- `WalletReadyEmailData` похож на `CryptoAddressEmailData` с дополнительными полями для очереди
- Расширение union type сохраняет type safety

---

### **🔧 ЭТАП 2: HTML Template (1 файл)**

**ФАЙЛ:** `packages/email-service/src/templates/wallet-ready.html`

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Адрес готов для заявки №{{orderId}} - {{companyName}}</title>
    <style>
      /* Переиспользуем стили из crypto-address.html */
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9f9f9;
      }
      .email-container {
        background: white;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #28a745; /* Зеленый для готовности */
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #28a745;
        margin-bottom: 10px;
      }
      .ready-notification {
        background: #d4edda;
        border: 2px solid #28a745;
        border-radius: 6px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
      }
      .crypto-address {
        background: #e8f4fd;
        border: 2px solid #0066cc;
        border-radius: 6px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
      }
      .address-label {
        font-weight: bold;
        color: #0066cc;
        margin-bottom: 10px;
      }
      .crypto-address-value {
        font-size: 16px;
        font-family: 'Courier New', monospace;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        border: 1px solid #dee2e6;
        word-break: break-all;
        margin: 10px 0;
      }
      .instructions {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 6px;
        padding: 20px;
        margin: 20px 0;
      }
      .warning {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 6px;
        padding: 15px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        color: #666;
        border-top: 1px solid #eee;
        padding-top: 20px;
        margin-top: 30px;
        font-size: 14px;
      }
      .button {
        display: inline-block;
        background: #0066cc;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin: 10px 0;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <div class="logo">{{companyName}}</div>
        <h2>🎉 Ваш адрес готов!</h2>
      </div>

      <div class="ready-notification">
        <h3>✅ Адрес для заявки №{{orderId}} готов к использованию</h3>
        <p>Ваша заявка дождалась свободного кошелька и теперь готова к отправке!</p>
      </div>

      <div class="order-info">
        <h3>📋 Детали заявки</h3>
        <p><strong>Номер заявки:</strong> {{orderId}}</p>
        <p><strong>Сумма к отправке:</strong> {{amount}} {{currency}}</p>
        <p><strong>Валюта:</strong> {{currencyFullName}}</p>
        <p><strong>Сеть:</strong> {{networkName}}</p>
        <p><strong>Действительно до:</strong> {{expiresAt}}</p>
      </div>

      <div class="crypto-address">
        <div class="address-label">📍 АДРЕС ДЛЯ ОТПРАВКИ {{currency}}:</div>
        <div class="crypto-address-value">{{cryptoAddress}}</div>
        <p><small>⚠️ Тщательно проверьте адрес и сеть перед отправкой</small></p>
      </div>

      <div class="instructions">
        <h4>📝 ИНСТРУКЦИИ:</h4>
        <ul>
          <li>Отправляйте точно <strong>{{amount}} {{currency}}</strong> на указанный адрес</li>
          <li>Убедитесь что используете сеть <strong>{{networkName}}</strong></li>
          <li>Средства поступят после подтверждения транзакции в блокчейне</li>
          <li>Сохраните это письмо до завершения операции</li>
        </ul>
      </div>

      <div class="warning">
        <h4>⚠️ ВАЖНО:</h4>
        <p>
          Заявка действительна до <strong>{{expiresAt}}</strong>. После истечения срока адрес будет
          недоступен.
        </p>
      </div>

      <div class="footer">
        <p>С уважением,<br />Команда {{companyName}}</p>
        <p><small>Это автоматическое сообщение. Не отвечайте на него.</small></p>
      </div>
    </div>
  </body>
</html>
```

**Обоснование дизайна:**

- Переиспользует CSS стили из существующего `crypto-address.html`
- Зеленая цветовая схема подчеркивает "готовность" vs синяя для "создания"
- Дополнительная секция "Ваш адрес готов!" для контекста очереди
- Тот же набор переменных что и `crypto-address` для consistency

---

### **🔧 ЭТАП 3: Text Template (1 файл)**

**ФАЙЛ:** `packages/email-service/src/templates/wallet-ready.txt`

```plaintext
==================================================
🎉 {{companyName}} - Ваш адрес готов!
==================================================

✅ АДРЕС ДЛЯ ЗАЯВКИ №{{orderId}} ГОТОВ К ИСПОЛЬЗОВАНИЮ

Ваша заявка дождалась свободного кошелька и теперь
готова к отправке!

--------------------------------------------------

📋 ДЕТАЛИ ЗАЯВКИ №{{orderId}}

Сумма к отправке: {{amount}} {{currency}}
Валюта: {{currencyFullName}}
Сеть: {{networkName}}
Действительно до: {{expiresAt}}

--------------------------------------------------

📍 АДРЕС ДЛЯ ОТПРАВКИ {{currency}}:

{{cryptoAddress}}

--------------------------------------------------

📝 ИНСТРУКЦИИ:

• Отправляйте точно {{amount}} {{currency}} на указанный адрес
• Убедитесь что используете сеть {{networkName}}
• Средства поступят после подтверждения транзакции в блокчейне
• Сохраните это письмо до завершения операции

⚠️ ВАЖНО: Заявка действительна до {{expiresAt}}
После истечения срока адрес будет недоступен.

--------------------------------------------------

С уважением,
Команда {{companyName}}

Это автоматическое сообщение. Не отвечайте на него.

==================================================
```

**Обоснование:**

- Тот же формат что и `crypto-address.txt` для consistency
- Акцент на "готовности" адреса vs "создании" заявки
- Те же переменные для простоты integration

---

### **🔧 ЭТАП 4: Расширение EmailTemplateService (1 файл)**

**ФАЙЛ:** `packages/email-service/src/services/email-template-service.ts`

**Добавить новый метод:**

```typescript
/**
 * Generate wallet ready email content (for orders from queue)
 */
static async generateWalletReadyEmail(data: WalletReadyEmailData): Promise<EmailMessage> {
  const variables = {
    orderId: data.orderId,
    cryptoAddress: data.cryptoAddress,
    currency: data.currency,
    currencyFullName: CURRENCY_FULL_NAMES[data.currency],
    networkName: NETWORK_NAMES[data.currency],
    amount: data.amount.toString(),
    expiresAt: this.formatDate(data.expiresAt),
    userEmail: data.userEmail,
    companyName: COMPANY_INFO.NAME,
  };

  const htmlTemplate = await this.loadTemplate('wallet-ready', 'html');
  const textTemplate = await this.loadTemplate('wallet-ready', 'txt');

  const html = this.replaceVariables(htmlTemplate, variables);
  const text = this.replaceVariables(textTemplate, variables);

  this.logger.info('Generated wallet ready email', {
    orderId: data.orderId,
    currency: data.currency,
    to: data.userEmail,
  });

  return {
    to: data.userEmail,
    subject: `🎉 Адрес готов для заявки №${data.orderId} - отправьте ${data.amount} ${data.currency}`,
    html,
    text,
  };
}
```

**Обоснование:**

- Полностью переиспользует паттерн существующего `generateCryptoAddressEmail`
- Тот же набор переменных для consistency
- Отличается только template name и subject line

---

### **🔧 ЭТАП 5: Обновление exports**

**ФАЙЛ:** `packages/email-service/src/index.ts` (обновить export)

```typescript
// Type exports (добавить WalletReadyEmailData)
export type {
  EmailMessage,
  EmailProviderInterface,
  EmailSendResult,
  EmailProviderConfig,
  CryptoAddressEmailData,
  WalletReadyEmailData, // 🆕 НОВЫЙ export
  SystemAlertEmailData,
  EmailEnvironment,
  EmailTemplateType,
} from './types/index';
```

---

## 🔧 ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМИ РОУТЕРАМИ

### **Использование в `exchange.createOrderWithQueueing` (будущая задача):**

```typescript
// В будущей задаче 2.3 (AC2.3):
import { EmailService, type WalletReadyEmailData } from '@repo/email-service';

// При выделении адреса заявке из очереди:
const walletReadyData: WalletReadyEmailData = {
  orderId: order.id,
  cryptoAddress: allocatedWallet.address,
  currency: order.cryptoCurrency,
  amount: order.cryptoAmount,
  expiresAt: order.expiresAt,
  userEmail: order.userEmail,
};

await EmailService.sendWalletReady(walletReadyData);
```

### **Расширение EmailService (будущая задача):**

```typescript
// В packages/email-service/src/services/email-service.ts добавить:
static async sendWalletReady(
  data: WalletReadyEmailData,
  config?: Partial<EmailProviderConfig>
): Promise<EmailSendResult> {
  // Аналогично sendCryptoAddress, но с generateWalletReadyEmail
}
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ

### **Функциональные требования:**

- ✅ `wallet-ready.html/txt` templates созданы
- ✅ `WalletReadyEmailData` interface добавлен
- ✅ `generateWalletReadyEmail()` метод реализован
- ✅ Type exports обновлены

### **Качественные требования:**

- ✅ Переиспользование существующих паттернов
- ✅ Обратная совместимость API
- ✅ XSS protection через existing `sanitizeHtmlContent`
- ✅ Consistency с проектными соглашениями

### **Архитектурные требования:**

- ✅ НЕ создавать ничего в `packages/constants/`
- ✅ Следовать существующей структуре email service
- ✅ Минимальные изменения (4 файла)
- ✅ Соответствие DRY принципу

---

## 🚀 ПЛАН ВЫПОЛНЕНИЯ

### **Порядок реализации:**

1. **ЭТАП 1:** Расширить types в `types/index.ts`
2. **ЭТАП 2:** Создать `wallet-ready.html` template
3. **ЭТАП 3:** Создать `wallet-ready.txt` template
4. **ЭТАП 4:** Добавить `generateWalletReadyEmail()` в service
5. **ЭТАП 5:** Обновить exports в `index.ts`

### **Время выполнения:** ~2-3 часа

### **Файлов изменено:** 4 файла + 2 новых template файла

---

## 📊 СООТВЕТСТВИЕ AC ТРЕБОВАНИЯМ

### **AC6.3: ✅ ПОЛНОСТЬЮ ПОКРЫТО**

- ✅ "Отдельный email template с уведомлением о готовности адреса"
- ✅ Templates в правильном архитектурном месте
- ✅ Поддержка всех необходимых переменных
- ✅ Integration с существующей email service architecture

### **Задача 8.3: ✅ ПЕРЕФОРМУЛИРОВАНА**

- ❌ НЕ создавать в `packages/constants/` (архитектурно неправильно)
- ✅ Дополнить существующий `packages/email-service/` правильными компонентами
- ✅ Минимальные изменения для максимального результата

---

**ЗАКЛЮЧЕНИЕ:** Задача 8.3 требует НЕ создания с нуля, а **рефакторинга и дополнения** существующей архитектуры email service недостающим WALLET_READY_TEMPLATE компонентом.
