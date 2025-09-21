# Детальный план реализации задачи 7.3: Gmail SMTP Provider через Nodemailer

> **Дата создания:** 21 сентября 2025  
> **Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
> **Задача:** Добавить Gmail SMTP Provider в существующую архитектуру EmailServiceFactory  
> **Источник:** `docs/tasks/ORDER_SYSTEM_IMPLEMENTATION_TASK_LIST.md` → Task 7.3

---

## 🎯 Цель: Интеграция Gmail SMTP как Fallback Provider

### 📋 Техническое задание 7.3

```
- [ ] **7.3** Создать EmailProviderFactory для бесплатных сервисов (Resend, Gmail SMTP)
  - _Factory выбирает провайдера на основе environment variables_
  - _Интеграция с Resend API (3000 emails/month бесплатно)_
  - _Fallback на Gmail SMTP через Nodemailer_
```

### ✅ Статус проверки существующей реализации

**ЧТО УЖЕ ЕСТЬ (ФАКТИЧЕСКИ ПОДТВЕРЖДЕНО):**

- ✅ **EmailServiceFactory полностью реализован** - packages/email-service/src/factories/email-service-factory.ts
- ✅ **Resend Provider уже интегрирован** - packages/email-service/src/providers/resend-email-provider.ts
- ✅ **SendGrid Provider уже работает** - packages/email-service/src/providers/sendgrid-email-provider.ts
- ✅ **Environment-based switching реализован** - getEmailEnvironment() функция работает
- ✅ **Provider Pattern архитектура готова для расширения** - EmailProviderInterface существует

**ЧТО ОТСУТСТВУЕТ (ЗАДАЧА 7.3 - ФАКТИЧЕСКИ ПРОВЕРЕНО):**

- ❌ **Gmail SMTP Provider через Nodemailer** - отсутствует GmailSmtpEmailProvider
- ❌ **Nodemailer зависимость в package.json** - отсутствуют "nodemailer" и "@types/nodemailer"
- ❌ **'gmail' тип в EmailProviderConfig** - текущие типы: 'sendgrid' | 'resend' | 'mock'
- ❌ **SMTP_PROVIDERS константы** - отсутствуют в packages/constants/

---

## 🏗️ Архитектурный анализ

### ТРИГГЕР Rule 24: Анализ архитектуры на основе PROJECT_STRUCTURE_MAP.md

**АРХИТЕКТУРНОЕ СООТВЕТСТВИЕ:**

- ✅ **Монорепо pattern**: `packages/email-service/` уже следует структуре
- ✅ **Provider Pattern**: Существующая архитектура идеально подходит для расширения
- ✅ **Environment-based switching**: Механизм уже реализован
- ✅ **TypeScript types**: Система типов готова для расширения

### ТРИГГЕР Rule 20: Проверка отсутствия избыточности

**АНАЛИЗ СУЩЕСТВУЮЩИХ РЕШЕНИЙ:**

- ✅ **SendGridEmailProvider**: API-based сервис (платный)
- ✅ **ResendEmailProvider**: API-based сервис (3000 emails/month бесплатно)
- ✅ **MockEmailProvider**: Development/testing провайдер
- ❌ **Gmail SMTP через Nodemailer**: НЕТ - это НОВАЯ функциональность

**РЕШЕНИЕ Rule 20**: Создание GmailSmtpEmailProvider является **НЕОБХОДИМЫМ РАСШИРЕНИЕМ**, не дублированием.

### ТРИГГЕР Rule 25: Фокус только на цели задачи

**SCOPE ОГРАНИЧЕНИЯ:**

- 🎯 ТОЛЬКО добавление Gmail SMTP Provider
- 🎯 ТОЛЬКО изменения для поддержки Nodemailer
- 🎯 ТОЛЬКО расширение типов и Factory логики
- ❌ НЕ ТРОГАТЬ существующие провайдеры
- ❌ НЕ ИЗМЕНЯТЬ основную архитектуру

---

## 📦 Интеграция в существующую архитектуру

### 1. Следование паттернам из session-management

**ПАТТЕРН: Environment-based Factory**

```typescript
// Аналогично UserManagerFactory.create()
EmailServiceFactory.create(config?: Partial<EmailProviderConfig>)
```

**ПАТТЕРН: Interface + Implementation**

```typescript
// Аналогично UserManagerInterface
export interface EmailProviderInterface {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
```

**ПАТТЕРН: Graceful Fallback**

```typescript
// Аналогично fallback в session-management при недоступности Redis
if (!config.apiKey) {
  this.logger.warn('API key not provided, falling back to mock provider');
  return new MockEmailProvider(config.fromEmail, config.fromName);
}
```

### 2. Соответствие VALIDATION_ARCHITECTURE_GUIDE.md

**ПРИНЦИП: Single Source of Truth**

- ✅ EmailProviderConfig будет единственным источником типов
- ✅ GmailSmtpEmailProvider будет следовать EmailProviderInterface

**ПРИНЦИП: Security-First Consistency**

- ✅ Использование createEnvironmentLogger из @repo/utils
- ✅ Валидация конфигурации через существующие механизмы

---

## 🔧 Детальный план реализации

### ФАЗА 0: Добавление SMTP констант (НОВАЯ ФАЗА)

#### 0.1 Создать packages/constants/src/email/smtp-providers.ts

```typescript
/**
 * SMTP Provider configurations for email services
 * Централизованные константы для SMTP подключений
 */
export const SMTP_PROVIDERS = {
  GMAIL: {
    HOST: 'smtp.gmail.com',
    PORT: 587,
    SECURE: false,
    TLS_PORT: 465,
    DESCRIPTION: 'Gmail SMTP service for free email sending',
  },
  // Возможность расширения другими SMTP провайдерами
  OUTLOOK: {
    HOST: 'smtp-mail.outlook.com',
    PORT: 587,
    SECURE: false,
    TLS_PORT: 995,
    DESCRIPTION: 'Microsoft Outlook SMTP service',
  },
} as const;

export type SmtpProviderName = keyof typeof SMTP_PROVIDERS;
```

#### 0.2 Обновить packages/constants/src/index.ts

```typescript
// Добавить в существующие экспорты:
export * from './email/smtp-providers';
export type { SmtpProviderName } from './email/smtp-providers';
```

### ФАЗА 1: Добавление зависимостей

#### 1.1 Обновить package.json

```json
{
  "dependencies": {
    "@repo/constants": "*",
    "@repo/utils": "*",
    "@sendgrid/mail": "^8.1.3",
    "resend": "^4.0.0",
    "nodemailer": "^6.9.14" // ← НОВАЯ ЗАВИСИМОСТЬ
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.15" // ← НОВАЯ DEV ЗАВИСИМОСТЬ
  }
}
```

### ФАЗА 2: Обновление констант пакета

#### 2.1 Убедиться что constants пакет собран

```bash
# В корне проекта:
npm run build --workspace=@repo/constants
```

### ФАЗА 3: Расширение типов

#### 3.1 Обновить EmailProviderConfig в src/types/index.ts

```typescript
// БЫЛО (ФАКТИЧЕСКИ ПРОВЕРЕНО):
export interface EmailProviderConfig {
  provider: 'sendgrid' | 'resend' | 'mock';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
}

// СТАНЕТ:
export interface EmailProviderConfig {
  provider: 'sendgrid' | 'resend' | 'gmail' | 'mock'; // ← ДОБАВЛЯЕМ 'gmail'
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  // НОВЫЕ поля специально для Gmail SMTP:
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}
```

### ФАЗА 4: Создание GmailSmtpEmailProvider

#### 4.1 Создать src/providers/gmail-smtp-email-provider.ts

```typescript
import { SMTP_PROVIDERS } from '@repo/constants'; // ← ИСПОЛЬЗОВАНИЕ КОНСТАНТ
import { createEnvironmentLogger } from '@repo/utils';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import type { EmailMessage, EmailProviderInterface, EmailSendResult } from '../types/index';

/**
 * Gmail SMTP Email Provider using Nodemailer
 * Fallback option for free email sending with centralized constants
 */
export class GmailSmtpEmailProvider implements EmailProviderInterface {
  private logger = createEnvironmentLogger('GmailSmtpEmailProvider');
  private transporter: Transporter;

  constructor(
    private smtpConfig: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    },
    private fromEmail: string,
    private fromName: string
  ) {
    const initStartTime = Date.now();

    // Валидация SMTP config с использованием констант
    if (this.smtpConfig.host !== SMTP_PROVIDERS.GMAIL.HOST) {
      this.logger.warn('Non-standard Gmail SMTP host detected', {
        expected: SMTP_PROVIDERS.GMAIL.HOST,
        actual: this.smtpConfig.host,
        provider: 'gmail-smtp',
      });
    }

    this.transporter = nodemailer.createTransporter({
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      auth: this.smtpConfig.auth,
    });

    const initDuration = Date.now() - initStartTime;

    this.logger.info('GmailSmtpEmailProvider initialized', {
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      initDuration,
      provider: 'gmail-smtp',
      timestamp: new Date().toISOString(),
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const startTime = Date.now();

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;

      this.logger.info('Email sent via Gmail SMTP', {
        to: message.to,
        subject: message.subject,
        messageId: info.messageId,
        duration,
        provider: 'gmail-smtp',
        success: true,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Структурированное логирование ошибки с контекстом
      this.logger.error('Failed to send email via Gmail SMTP', {
        to: message.to,
        subject: message.subject,
        error: errorMessage,
        duration,
        provider: 'gmail-smtp',
        success: false,
        // SMTP-специфичная диагностика
        smtpHost: this.smtpConfig.host,
        smtpPort: this.smtpConfig.port,
        smtpSecure: this.smtpConfig.secure,
        errorType: this.categorizeSmtpError(error),
      });

      // Graceful fallback: возвращаем структурированную ошибку без throw
      return {
        success: false,
        error: this.formatUserFriendlyError(errorMessage),
      };
    }
  }

  /**
   * Категоризация SMTP ошибок для мониторинга
   * Следует паттернам из проекта для структурированного логирования
   */
  private categorizeSmtpError(error: unknown): string {
    if (!(error instanceof Error)) return 'unknown';

    const message = error.message.toLowerCase();

    if (message.includes('authentication') || message.includes('auth')) {
      return 'authentication';
    }
    if (message.includes('connection') || message.includes('connect')) {
      return 'connection';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('dns') || message.includes('host')) {
      return 'dns';
    }
    if (message.includes('ssl') || message.includes('tls')) {
      return 'ssl';
    }

    return 'smtp';
  }

  /**
   * Форматирование пользовательских ошибок
   * Следует паттернам graceful error handling из проекта
   */
  private formatUserFriendlyError(error: string): string {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('authentication') || lowerError.includes('auth')) {
      return 'Email authentication failed. Please check SMTP credentials.';
    }
    if (lowerError.includes('connection') || lowerError.includes('connect')) {
      return 'Could not connect to email server. Please check network connection.';
    }
    if (lowerError.includes('timeout')) {
      return 'Email sending timed out. Please try again.';
    }

    return 'Failed to send email. Please try again later.';
  }
}
```

### ФАЗА 5: Обновление Factory

#### 5.1 Обновить src/factories/email-service-factory.ts

```typescript
// ДОБАВИТЬ ИМПОРТ:
import { SMTP_PROVIDERS } from '@repo/constants'; // ← ИСПОЛЬЗОВАНИЕ КОНСТАНТ
import { GmailSmtpEmailProvider } from '../providers/gmail-smtp-email-provider';

// ОБНОВИТЬ МЕТОД createProvider():
private static createProvider(config: EmailProviderConfig): EmailProviderInterface {
  switch (config.provider) {
    case 'sendgrid': {
      if (!config.apiKey) {
        this.logger.warn('SendGrid API key not provided, falling back to mock provider');
        return new MockEmailProvider(config.fromEmail, config.fromName);
      }
      return new SendGridEmailProvider(config.apiKey, config.fromEmail, config.fromName);
    }
    case 'resend': {
      if (!config.apiKey) {
        this.logger.warn('Resend API key not provided, falling back to mock provider');
        return new MockEmailProvider(config.fromEmail, config.fromName);
      }
      return new ResendEmailProvider(config.apiKey, config.fromEmail, config.fromName);
    }
    case 'gmail': {  // ← НОВЫЙ CASE
      if (!config.smtpConfig) {
        this.logger.warn('Gmail SMTP config not provided, falling back to mock provider');
        return new MockEmailProvider(config.fromEmail, config.fromName);
      }
      return new GmailSmtpEmailProvider(config.smtpConfig, config.fromEmail, config.fromName);
    }
    case 'mock':
    default: {
      return new MockEmailProvider(config.fromEmail, config.fromName);
    }
  }
}

// ОБНОВИТЬ МЕТОД createDefaultConfig():
private static createDefaultConfig(): EmailProviderConfig {
  const environment = getEmailEnvironment();

  return {
    provider: environment === 'production' ? 'sendgrid' : 'mock',
    fromEmail: CONTACT_INFO.SUPPORT_EMAIL,
    fromName: COMPANY_INFO.NAME,
    apiKey: undefined,
    smtpConfig: undefined,  // ← НОВОЕ ПОЛЕ
  };
}
```

### ФАЗА 6: Обновление экспортов

#### 6.1 Обновить src/index.ts

```typescript
// ДОБАВИТЬ ЭКСПОРТ:
export { GmailSmtpEmailProvider } from './providers/gmail-smtp-email-provider';
```

#### 6.2 Обновить src/providers/index.ts (если существует)

```typescript
export { GmailSmtpEmailProvider } from './gmail-smtp-email-provider';
```

---

## 🔬 Environment Variables для Gmail SMTP

### Конфигурация через .env с использованием констант

```bash
# Gmail SMTP Configuration (использует константы из SMTP_PROVIDERS)
EMAIL_PROVIDER=gmail
# Значения берутся из SMTP_PROVIDERS.GMAIL:
GMAIL_SMTP_HOST=smtp.gmail.com  # SMTP_PROVIDERS.GMAIL.HOST
GMAIL_SMTP_PORT=587             # SMTP_PROVIDERS.GMAIL.PORT
GMAIL_SMTP_SECURE=false         # SMTP_PROVIDERS.GMAIL.SECURE
GMAIL_SMTP_USER=your-email@gmail.com
GMAIL_SMTP_PASS=your-app-password
```

### Использование в коде с константами

```typescript
import { SMTP_PROVIDERS } from '@repo/constants';

// В приложении:
const emailProvider = EmailServiceFactory.create({
  provider: 'gmail',
  fromEmail: process.env.GMAIL_SMTP_USER!,
  fromName: 'ExchangeGO Support',
  smtpConfig: {
    host: SMTP_PROVIDERS.GMAIL.HOST, // ← ИСПОЛЬЗОВАНИЕ КОНСТАНТ
    port: SMTP_PROVIDERS.GMAIL.PORT, // ← ВМЕСТО ХАРДКОДА
    secure: SMTP_PROVIDERS.GMAIL.SECURE, // ← ЦЕНТРАЛИЗОВАННО
    auth: {
      user: process.env.GMAIL_SMTP_USER!,
      pass: process.env.GMAIL_SMTP_PASS!,
    },
  },
});
```

---

## 🧪 Fallback логика (согласно ТЗ)

### Автоматический Fallback chain

```typescript
// Пример расширенной Factory логики для автоматического fallback:
static createWithFallback(): EmailProviderInterface {
  const environment = getEmailEnvironment();

  // Production: SendGrid → Resend → Gmail SMTP → Mock
  if (environment === 'production') {
    if (process.env.SENDGRID_API_KEY) {
      return this.create({ provider: 'sendgrid', apiKey: process.env.SENDGRID_API_KEY });
    }
    if (process.env.RESEND_API_KEY) {
      this.logger.info('SendGrid unavailable, falling back to Resend');
      return this.create({ provider: 'resend', apiKey: process.env.RESEND_API_KEY });
    }
    if (process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASS) {
      this.logger.info('API services unavailable, falling back to Gmail SMTP');
      return this.create({
        provider: 'gmail',
        smtpConfig: {
          host: SMTP_PROVIDERS.GMAIL.HOST,    // ← ИСПОЛЬЗОВАНИЕ КОНСТАНТ
          port: SMTP_PROVIDERS.GMAIL.PORT,    // ← ВМЕСТО ХАРДКОДА
          secure: SMTP_PROVIDERS.GMAIL.SECURE, // ← ЦЕНТРАЛИЗОВАННО
          auth: {
            user: process.env.GMAIL_SMTP_USER,
            pass: process.env.GMAIL_SMTP_PASS,
          },
        },
      });
    }
  }

  // Development/Test: Mock
  this.logger.warn('No email provider configured, using mock');
  return this.create({ provider: 'mock' });
}
```

---

## ✅ Контрольные точки (Rule 23: ОБЯЗАТЕЛЬНАЯ ПОЛНАЯ ИНТЕГРАЦИЯ)

### CHECKPOINT 0: Константы

- [ ] SMTP_PROVIDERS константы созданы в packages/constants/src/email/smtp-providers.ts
- [ ] Константы экспортированы через packages/constants/src/index.ts
- [ ] Constants пакет перекомпилирован после добавления констант

### CHECKPOINT 1: Компиляция

- [ ] TypeScript типы корректны
- [ ] Нет ошибок ESLint
- [ ] Package.json зависимости установлены

### CHECKPOINT 2: Интеграция

- [ ] GmailSmtpEmailProvider экспортируется из пакета
- [ ] EmailServiceFactory корректно создает Gmail провайдер
- [ ] Fallback логика работает при отсутствии SMTP конфига

### CHECKPOINT 3: Runtime проверка

- [ ] Реальная отправка email через Gmail SMTP работает
- [ ] Логирование через createEnvironmentLogger работает
- [ ] Error handling корректно обрабатывает ошибки SMTP

### CHECKPOINT 4: Соответствие требованиям ТЗ 7.3

- [x] ✅ Factory выбирает провайдера на основе environment variables
- [x] ✅ Интеграция с Resend API (УЖЕ ЕСТЬ)
- [ ] Fallback на Gmail SMTP через Nodemailer (РЕАЛИЗУЕТСЯ)

---

## 🎯 Результат выполнения

После завершения задачи 7.3 проект получит:

1. **Расширенный EmailServiceFactory** с поддержкой Gmail SMTP
2. **Бесплатную альтернативу** платным email сервисам
3. **Fallback систему** для надежности доставки email
4. **Минимальные изменения** в существующей архитектуре
5. **Полное соответствие** проектным паттернам и принципам

## 📊 Enhanced Monitoring & Error Handling (УЛУЧШЕНИЯ)

### 🚨 Улучшенный Error Handling

#### SMTP-специфичная обработка ошибок

```typescript
// Категоризация ошибок для мониторинга (следует паттернам проекта)
private categorizeSmtpError(error: unknown): string {
  // authentication | connection | timeout | dns | ssl | smtp
}

// Пользовательские сообщения (graceful fallback)
private formatUserFriendlyError(error: string): string {
  // Преобразование технических ошибок в понятные пользователю
}
```

#### Структурированное логирование

```typescript
this.logger.error('Failed to send email via Gmail SMTP', {
  to: message.to,
  subject: message.subject,
  error: errorMessage,
  duration,
  provider: 'gmail-smtp',
  success: false,
  smtpHost: this.smtpConfig.host,
  smtpPort: this.smtpConfig.port,
  errorType: this.categorizeSmtpError(error), // ← НОВОЕ
});
```

### 📈 Performance Monitoring

#### Измерение времени (Date.now() паттерн)

```typescript
// В конструкторе:
const initStartTime = Date.now();
// ... инициализация ...
const initDuration = Date.now() - initStartTime;

// В методе send():
const startTime = Date.now();
// ... отправка email ...
const duration = Date.now() - startTime;
```

#### Метрики производительности

```typescript
this.logger.info('Email sent via Gmail SMTP', {
  to: message.to,
  messageId: info.messageId,
  duration, // ← НОВОЕ: время отправки
  provider: 'gmail-smtp', // ← НОВОЕ: идентификатор провайдера
  success: true, // ← НОВОЕ: статус операции
  timestamp: new Date().toISOString(), // ← НОВОЕ: ISO timestamp
});
```

### 🎯 Преимущества улучшений

1. **SMTP Error Categorization**: Возможность анализа типов ошибок для оптимизации
2. **Performance Metrics**: Измерение времени инициализации и отправки email
3. **Structured Logging**: Единообразное логирование следуя паттернам проекта
4. **Graceful Error Handling**: Пользовательские сообщения вместо технических
5. **Monitoring Ready**: Готовность для интеграции с системами мониторинга

---

**АРХИТЕКТУРНАЯ ЦЕЛОСТНОСТЬ:** ✅ Сохранена  
**BACKWARD COMPATIBILITY:** ✅ Обеспечена  
**RULE 25 COMPLIANCE:** ✅ Только изменения для цели задачи

---

_Документ создан согласно ai-agent-rules.yml с соблюдением Rule 24 (структурный анализ), Rule 20 (отсутствие избыточности), Rule 25 (фокус на цели задачи)_
