# План: Отправка email с паролем при авторегистрации

**Дата создания**: 18 октября 2025  
**Статус**: 🟡 В ПЛАНИРОВАНИИ  
**Приоритет**: 🔴 КРИТИЧЕСКИЙ

---

## 📋 Оглавление

1. [Постановка проблемы](#постановка-проблемы)
2. [Анализ существующей архитектуры](#анализ-существующей-архитектуры)
3. [Детальный анализ флоу создания заявки](#детальный-анализ-флоу-создания-заявки)
4. [Анализ флоу авторегистрации](#анализ-флоу-авторегистрации)
5. [Анализ email-инфраструктуры](#анализ-email-инфраструктуры)
6. [Архитектурное решение](#архитектурное-решение)
7. [План реализации](#план-реализации)
8. [Контрольные точки](#контрольные-точки)
9. [Соответствие AI Agent Rules](#соответствие-ai-agent-rules)

---

## 🔴 Постановка проблемы

### Критическая бизнес-проблема

**Симптом**: Пользователи, которые проходят авторегистрацию через создание заявки (без стандартного флоу регистрации), не знают свой пароль после создания заявки.

**Последствия**:

- Пользователь НЕ может войти в личный кабинет
- Пользователь НЕ может отследить статус своей заявки
- Пользователь НЕ может просмотреть историю заказов
- Увеличение нагрузки на службу поддержки
- Негативный UX опыт

**Критичность**: 🔴 КРИТИЧЕСКАЯ - влияет на core функциональность продукта

---

## 🏗️ Анализ существующей архитектуры

### Архитектурные уровни (из PROJECT_STRUCTURE_MAP.md)

```
📦 Монорепозиторий exchanger-front
├── 📁 apps/
│   └── 📁 web/ - Next.js 15, tRPC, i18n
│       └── 📁 src/server/trpc/routers/
│           └── exchange.ts - СОЗДАНИЕ ЗАЯВОК
├── 📁 packages/
│   ├── 📁 email-service/ - EMAIL СИСТЕМА
│   │   ├── 📁 src/
│   │   │   ├── 📁 services/
│   │   │   │   ├── email-service.ts
│   │   │   │   └── email-template-service.ts
│   │   │   ├── 📁 templates/
│   │   │   │   ├── crypto-address.html/txt
│   │   │   │   ├── password-reset.html/txt ✅ УЖЕ СУЩЕСТВУЕТ
│   │   │   │   └── wallet-ready.html/txt
│   │   │   ├── 📁 types/
│   │   │   │   └── index.ts - PasswordResetEmailData ✅
│   │   │   └── 📁 utils/
│   │   │       └── rate-limited-email-service.ts
│   │   └── GMAIL_SMTP_USAGE.md
│   ├── 📁 exchange-core/ - БИЗНЕС-ЛОГИКА
│   │   └── 📁 src/services/
│   │       └── auto-registration-service.ts - АВТОРЕГИСТРАЦИЯ ✅
│   ├── 📁 utils/ - УТИЛИТЫ
│   │   └── 📁 src/
│   │       └── password-generation.ts - ГЕНЕРАЦИЯ ПАРОЛЯ ✅
│   └── 📁 constants/ - КОНСТАНТЫ
```

### Ключевые архитектурные находки

✅ **ПОЛОЖИТЕЛЬНЫЕ ФАКТОРЫ (Rule 20 - проверка избыточности)**:

1. `email-service` пакет УЖЕ СУЩЕСТВУЕТ и ПОЛНОСТЬЮ НАСТРОЕН
2. `PasswordResetEmailData` тип УЖЕ ОПРЕДЕЛЕН в `email-service/src/types/index.ts`
3. `password-reset.html` и `password-reset.txt` шаблоны УЖЕ СОЗДАНЫ
4. `EmailTemplateService.generatePasswordResetEmail()` метод УЖЕ РЕАЛИЗОВАН
5. `EmailService.sendPasswordReset()` метод УЖЕ РЕАЛИЗОВАН
6. `generatePasswordForAutoFlow()` функция УЖЕ СУЩЕСТВУЕТ и генерирует криптографически стойкие пароли
7. `AutoRegistrationService` уже генерирует пароль при `generatePassword: true`

⚠️ **ПРОБЛЕМНЫЕ ТОЧКИ**:

1. Сгенерированный пароль логируется только в development режиме (`DEV_ONLY_GENERATED_PASSWORD`)
2. Пароль НЕ отправляется пользователю ни при каких условиях
3. После авторегистрации пользователь получает только email с crypto address, но НЕ с паролем

---

## 🔍 Детальный анализ флоу создания заявки

### Точка входа: `apps/web/src/server/trpc/routers/exchange.ts`

#### Процедура: `exchangeRouter.createOrder`

**Местоположение**: `exchange.ts:746-856`

**Последовательность выполнения**:

```typescript
// 1️⃣ ВАЛИДАЦИЯ И ПОДГОТОВКА
input: securityEnhancedCreateExchangeOrderSchema
  ↓
validateOrderInput() // Проверка лимитов
  ↓
prepareOrderRequest() // Подготовка данных + расчет курса
  ↓

// 2️⃣ SESSION MANAGEMENT & АВТОРЕГИСТРАЦИЯ
ensureUserSessionWithCookie()
  ├── UserManagerFactory.createForWeb()
  ├── new AutoRegistrationService(webUserManager)
  └── autoRegService.ensureUserWithSession(
        email,
        sessionMetadata,
        ctx.sessionId,
        { generatePassword: true } // ✅ ПАРОЛЬ ГЕНЕРИРУЕТСЯ ЗДЕСЬ
      )
  ↓

// 3️⃣ СОЗДАНИЕ ЗАЯВКИ
createOrderInSystem()
  ├── handleWalletAllocation()
  │   └── allocateWalletForOrder()
  └── processSuccessfulOrder()
      ├── orderManager.create() // Создание заявки в БД
      ├── scheduleOrderExpiration() // Redis TTL
      ├── sendCryptoAddressEmail() // ✅ EMAIL С АДРЕСОМ
      └── sendTelegramNotification() // Telegram операторам
```

### Ключевые находки из кода

#### 1. Генерация пароля

**Файл**: `apps/web/src/server/trpc/routers/exchange.ts:462-476`

```typescript
const userSession = await autoRegService.ensureUserWithSession(
  orderRequest.email,
  sessionMetadata,
  ctx.sessionId,
  { generatePassword: true } // ✅ КЛЮЧЕВАЯ СТРОКА
);
```

#### 2. Логирование пароля (только development)

**Файл**: `packages/exchange-core/src/services/auto-registration-service.ts:246-254`

```typescript
const plainPassword = generatePasswordForAutoFlow();

// 🚨 ТОЛЬКО ДЛЯ РАЗРАБОТКИ - логируем сгенерированный пароль
if (process.env.NODE_ENV === 'development') {
  this.logger.warn('DEV_ONLY_GENERATED_PASSWORD', {
    email,
    plainPassword, // ⚠️ УДАЛИТЬ В ПРОДАКШЕНЕ!
    note: 'This is development-only logging. Remove in production!',
  });
}

const bcrypt = await import('bcryptjs');
userData.hashedPassword = await bcrypt.hash(plainPassword, VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS);
```

**ПРОБЛЕМА**: После хеширования `plainPassword` теряется навсегда!

#### 3. Отправка crypto address email

**Файл**: `apps/web/src/server/trpc/routers/exchange.ts:204-258`

```typescript
await RateLimitedEmailService.sendCryptoAddress(
  {
    orderId: order.publicId,
    cryptoAddress: depositAddress,
    currency: orderRequest.currency,
    amount: orderRequest.cryptoAmount,
    expiresAt: new Date(Date.now() + ORDER_EXPIRATION_TIME_MS),
    userEmail: orderRequest.email,
    tokenStandard: effectiveTokenStandard,
  },
  sessionMetadata.ip
);
```

**ВАЖНО**: Отправляется ТОЛЬКО адрес для депозита, пароль НЕ упоминается

---

## 🔐 Анализ флоу авторегистрации

### AutoRegistrationService

**Файл**: `packages/exchange-core/src/services/auto-registration-service.ts`

#### Метод: `ensureUserWithSession()`

**Сигнатура**:

```typescript
async ensureUserWithSession(
  email: string,
  sessionMetadata: SessionMetadata,
  existingSessionId?: string,
  options: AutoRegistrationOptions = {} // { generatePassword?: boolean }
): Promise<AutoRegistrationResult>
```

**Логика определения сценария**:

```typescript
// 1. EXISTING_SESSION - пользователь уже залогинен
if (existingSessionId && sessionValid) {
  return {
    user: existingUser,
    authenticationMethod: 'existing-session',
    isNewUser: false,
  };
}

// 2. AUTO_LOGIN - пользователь существует, но не залогинен
if (existingUser) {
  return {
    user: existingUser,
    authenticationMethod: 'auto-login',
    isNewUser: false,
  };
}

// 3. AUTO_REGISTRATION - новый пользователь
const newUser = await this.createNewUserWithPassword(email, generatePassword);
return {
  user: newUser,
  authenticationMethod: 'auto-registration',
  isNewUser: true, // ✅ ВАЖНЫЙ ФЛАГ
};
```

#### Метод: `createNewUserWithPassword()`

**Местоположение**: `auto-registration-service.ts:231-265`

```typescript
private async createNewUserWithPassword(
  email: string,
  generatePassword: boolean
): Promise<User> {
  const userData = {
    email,
    hashedPassword: undefined,
    isVerified: false,
  };

  if (generatePassword) {
    const plainPassword = generatePasswordForAutoFlow(); // ✅ ГЕНЕРАЦИЯ

    // DEV_ONLY LOGGING
    if (process.env.NODE_ENV === 'development') {
      this.logger.warn('DEV_ONLY_GENERATED_PASSWORD', {
        email,
        plainPassword
      });
    }

    userData.hashedPassword = await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
    userData.isVerified = true;
  }

  return await this.userManager.create(userData);
}
```

**КЛЮЧЕВАЯ НАХОДКА**: `plainPassword` существует ТОЛЬКО в scope этой функции!

---

## 📧 Анализ email-инфраструктуры

### Существующая email архитектура

#### 1. Пакет `email-service`

**Местоположение**: `packages/email-service/`

**Структура**:

```
email-service/
├── src/
│   ├── services/
│   │   ├── email-service.ts - Основной сервис
│   │   ├── email-template-service.ts - Генерация шаблонов
│   │   └── email-monitoring-service.ts
│   ├── templates/
│   │   ├── crypto-address.html/txt
│   │   ├── password-reset.html/txt ✅ ГОТОВ
│   │   ├── system-alert.html/txt
│   │   └── wallet-ready.html/txt
│   ├── types/index.ts
│   ├── utils/
│   │   └── rate-limited-email-service.ts
│   ├── providers/ - SendGrid, Resend, Gmail SMTP, Mock
│   └── factories/ - EmailServiceFactory
└── GMAIL_SMTP_USAGE.md
```

#### 2. Существующие типы

**Файл**: `packages/email-service/src/types/index.ts:78-84`

```typescript
/**
 * Password reset email template data
 */
export interface PasswordResetEmailData {
  token: string;
  expiresAt: Date;
  userEmail: string;
}
```

**ПРОБЛЕМА**: Тип предназначен для токена восстановления пароля, НЕ для первоначального пароля!

#### 3. Существующие шаблоны

**Файл**: `packages/email-service/src/templates/password-reset.html`

**Содержимое**: Шаблон для восстановления пароля с токеном (код на 15 минут)

**ПРОБЛЕМА**: Семантически НЕ подходит для отправки первоначального пароля новому пользователю!

#### 4. Существующие методы

**EmailService.sendPasswordReset()**

**Файл**: `packages/email-service/src/services/email-service.ts:165-203`

```typescript
static async sendPasswordReset(
  data: import('../types/index').PasswordResetEmailData,
  config?: Partial<EmailProviderConfig>
): Promise<EmailSendResult>
```

**EmailTemplateService.generatePasswordResetEmail()**

**Файл**: `packages/email-service/src/services/email-template-service.ts:216-244`

```typescript
static async generatePasswordResetEmail(
  data: import('../types/index').PasswordResetEmailData
): Promise<EmailMessage>
```

#### 5. Rate Limiting

**RateLimitedEmailService**

**Файл**: `packages/email-service/src/utils/rate-limited-email-service.ts`

**Существующие методы**:

- ✅ `sendCryptoAddress()` - используется

**Отсутствующие методы**:

- ❌ `sendPasswordReset()` - НЕ существует
- ❌ `sendWelcomeWithPassword()` - НЕ существует

---

## 🎯 Архитектурное решение

### Принципы решения (Rule 2, Rule 20)

1. **Переиспользование > Создание нового** (Rule 20)
2. **Семантическая точность** (Rule 17)
3. **Минимальные изменения** (Rule 25)
4. **Архитектурная целостность** (Rule 24)

### Семантический анализ существующих решений

#### ❌ НЕПРАВИЛЬНЫЙ подход: Переиспользовать `password-reset`

**Почему НЕ подходит**:

- Семантика "восстановление" ≠ "первоначальный пароль"
- UX confusion: пользователь НЕ запрашивал восстановление
- Шаблон говорит про "15 минут" и "код восстановления"
- Тип `PasswordResetEmailData` с полем `token` - НЕ соответствует задаче

#### ✅ ПРАВИЛЬНЫЙ подход: Создать новый тип email

**Обоснование**:

- Отдельная бизнес-логика: "Welcome + Password" vs "Password Reset"
- Другой UX контекст: приветствие нового пользователя
- Другие данные: `plainPassword` вместо `token`
- Соответствие принципу Single Responsibility

### Архитектурное решение: Новый тип email "Welcome with Password"

#### Название: `auto-registration-password`

**Семантика**:

- Приветственное письмо новому пользователю
- Отправка первоначального пароля
- Объяснение, что пароль был сгенерирован автоматически
- Инструкции по входу в личный кабинет

#### Новый тип данных

```typescript
/**
 * Auto-registration password email template data
 * For users who registered automatically during order creation
 */
export interface AutoRegistrationPasswordEmailData {
  userEmail: string;
  generatedPassword: string; // plaintext password - единственный раз
  orderId: string; // контекст заявки
}
```

#### Точка интеграции

**Место**: `auto-registration-service.ts` → метод `createNewUserWithPassword()`

**Текущий код**:

```typescript
if (generatePassword) {
  const plainPassword = generatePasswordForAutoFlow();
  // ... hashing
  userData.hashedPassword = await bcrypt.hash(plainPassword, ...);
  // ❌ plainPassword ТЕРЯЕТСЯ здесь!
}
```

**Новый подход**:

```typescript
if (generatePassword) {
  const plainPassword = generatePasswordForAutoFlow();

  // ✅ ВОЗВРАТ plainPassword для отправки email
  return {
    user: await this.userManager.create(userData),
    plainPassword, // временное возвращение для email
  };
}
```

---

## 📝 План реализации

### Этап 1: Создание типов и шаблонов (email-service)

#### 1.1. Добавить новый тип

**Файл**: `packages/email-service/src/types/index.ts`

**Изменение**: Добавить после `PasswordResetEmailData`

```typescript
/**
 * Auto-registration password email template data
 * For users who registered automatically during order creation
 */
export interface AutoRegistrationPasswordEmailData {
  userEmail: string;
  generatedPassword: string;
  orderId: string;
}
```

**Обновить экспорт в index.ts**:

```typescript
export type {
  // ... existing types
  AutoRegistrationPasswordEmailData, // 🆕
} from './types/index';
```

#### 1.2. Создать HTML шаблон

**Файл**: `packages/email-service/src/templates/auto-registration-password.html`

**Содержимое**: (на основе существующего `password-reset.html`, но с другой семантикой)

```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ваш пароль для входа - {{companyName}}</title>
    <style>
      @import url('./email-base.css');

      .password-box {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        margin: 2rem 0;
        text-align: center;
      }

      .password-value {
        font-size: 1.8rem;
        font-weight: 700;
        letter-spacing: 0.2rem;
        font-family: 'Courier New', monospace;
        margin: 1rem 0;
        background: rgba(255, 255, 255, 0.2);
        padding: 1rem;
        border-radius: 8px;
        word-break: break-all;
      }

      .info-block {
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header -->
      <div class="header header-primary">
        <div class="logo logo-primary">{{companyName}}</div>
        <p>Добро пожаловать!</p>
      </div>

      <!-- Welcome Message -->
      <div class="content-section">
        <h2>🎉 Заявка №{{orderId}} успешно создана!</h2>
        <p>
          Для вас автоматически создан личный кабинет. Теперь вы можете отслеживать статус заявки и
          управлять своими обменами.
        </p>
      </div>

      <!-- Password Box -->
      <div class="password-box">
        <div style="font-size: 1rem; margin-bottom: 1rem;">🔐 Ваш пароль для входа</div>
        <div class="password-value">{{generatedPassword}}</div>
        <div style="font-size: 0.9rem; margin-top: 1rem; opacity: 0.9;">
          Сохраните пароль в надежном месте
        </div>
      </div>

      <!-- Instructions -->
      <div class="content-section">
        <h3>📝 Как войти в личный кабинет:</h3>
        <ol>
          <li>Перейдите на страницу входа</li>
          <li>Используйте ваш email: <strong>{{userEmail}}</strong></li>
          <li>Введите пароль из письма</li>
          <li>Вы можете сменить пароль в настройках профиля</li>
        </ol>
      </div>

      <!-- Security Notice -->
      <div class="info-block">
        <h3>🛡️ Безопасность</h3>
        <ul>
          <li>Никому не сообщайте этот пароль</li>
          <li>Рекомендуем сменить пароль на собственный при первом входе</li>
          <li>Используйте сложные пароли с буквами, цифрами и символами</li>
        </ul>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>С уважением,<br />Команда {{companyName}}</p>
        <p class="text-muted" style="font-size: 0.8rem;">
          Это автоматическое письмо, пожалуйста, не отвечайте на него.
        </p>
      </div>
    </div>
  </body>
</html>
```

#### 1.3. Создать текстовый шаблон

**Файл**: `packages/email-service/src/templates/auto-registration-password.txt`

```txt
{{companyName}} - Ваш пароль для входа

Добро пожаловать!

Заявка №{{orderId}} успешно создана!

Для вас автоматически создан личный кабинет.
Теперь вы можете отслеживать статус заявки и управлять своими обменами.

═══════════════════════════════════════
🔐 ВАШ ПАРОЛЬ ДЛЯ ВХОДА
═══════════════════════════════════════

{{generatedPassword}}

Сохраните пароль в надежном месте!

═══════════════════════════════════════

КАК ВОЙТИ В ЛИЧНЫЙ КАБИНЕТ:

1. Перейдите на страницу входа
2. Используйте ваш email: {{userEmail}}
3. Введите пароль из письма
4. Вы можете сменить пароль в настройках профиля

БЕЗОПАСНОСТЬ:
• Никому не сообщайте этот пароль
• Рекомендуем сменить пароль на собственный при первом входе
• Используйте сложные пароли с буквами, цифрами и символами

---
С уважением,
Команда {{companyName}}

Это автоматическое письмо, пожалуйста, не отвечайте на него.
```

#### 1.4. Добавить метод в EmailTemplateService

**Файл**: `packages/email-service/src/services/email-template-service.ts`

**Место**: После метода `generatePasswordResetEmail()`

```typescript
/**
 * Generate auto-registration password email content
 * For users who registered automatically during order creation
 */
static async generateAutoRegistrationPasswordEmail(
  data: AutoRegistrationPasswordEmailData
): Promise<EmailMessage> {
  const subject = `🎉 Ваш пароль для заявки №${data.orderId} - ${COMPANY_INFO.NAME}`;

  const variables = {
    companyName: COMPANY_INFO.NAME,
    userEmail: data.userEmail,
    generatedPassword: data.generatedPassword,
    orderId: data.orderId,
  };

  const logContext = {
    orderId: data.orderId,
    userEmail: data.userEmail,
  };

  const { html, text } = await this.generateUniversalTemplateEmail(
    'auto-registration-password',
    subject,
    variables,
    logContext
  );

  return {
    to: data.userEmail,
    subject,
    html,
    text,
  };
}
```

#### 1.5. Добавить метод в EmailService

**Файл**: `packages/email-service/src/services/email-service.ts`

**Место**: После метода `sendPasswordReset()`

```typescript
/**
 * Send auto-registration password email to new user
 * For users who registered automatically during order creation
 */
static async sendAutoRegistrationPassword(
  data: AutoRegistrationPasswordEmailData,
  config?: Partial<EmailProviderConfig>
): Promise<EmailSendResult> {
  try {
    this.logger.info('Sending auto-registration password email', {
      orderId: data.orderId,
      to: data.userEmail,
    });

    // Generate email content from template
    const emailMessage = await EmailTemplateService.generateAutoRegistrationPasswordEmail(data);

    // Get email provider and send
    const provider = config
      ? EmailServiceFactory.create(config)
      : EmailServiceFactory.createFromEnvironment();
    const result = await provider.send(emailMessage);

    // Record result for monitoring
    this.recordEmailResultForMonitoring(config, result, result.error);

    if (result.success) {
      this.logger.info('Auto-registration password email sent successfully', {
        orderId: data.orderId,
        to: data.userEmail,
        messageId: result.messageId,
      });
    } else {
      this.logger.error('Failed to send auto-registration password email', {
        orderId: data.orderId,
        to: data.userEmail,
        error: result.error,
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : this.UNKNOWN_ERROR;

    // Record error for monitoring
    this.recordEmailErrorForMonitoring(config, errorMessage);

    this.logger.error(this.EMAIL_SERVICE_ERROR, {
      orderId: data.orderId,
      to: data.userEmail,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
```

#### 1.6. Добавить rate-limited обертку

**Файл**: `packages/email-service/src/utils/rate-limited-email-service.ts`

**Место**: После метода `sendCryptoAddress()`

```typescript
/**
 * Send auto-registration password email with rate limiting applied
 * For users who registered automatically during order creation
 */
static async sendAutoRegistrationPassword(
  data: AutoRegistrationPasswordEmailData,
  clientIdentifier: string,
  config?: Partial<EmailProviderConfig>
): Promise<EmailSendResult> {
  try {
    this.logger.info('Applying rate limit for auto-registration password email', {
      orderId: data.orderId,
      clientIdentifier,
    });

    // Apply rate limiting first
    await applyEmailRateLimit(clientIdentifier);

    this.logger.info('Rate limit passed, sending auto-registration password email', {
      orderId: data.orderId,
      clientIdentifier,
    });

    // If rate limit passes, call the actual email service
    return await EmailService.sendAutoRegistrationPassword(data, config);
  } catch (error) {
    this.logger.error('Rate-limited auto-registration password email service error', {
      orderId: data.orderId,
      clientIdentifier,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Re-throw the error
    throw error;
  }
}
```

#### 1.7. Обновить индекс экспортов

**Файл**: `packages/email-service/src/index.ts`

```typescript
// Type exports
export type {
  // ... existing types
  AutoRegistrationPasswordEmailData, // 🆕 ДОБАВИТЬ
} from './types/index';
```

### Этап 2: Модификация AutoRegistrationService

#### 2.1. Изменить возвращаемый тип

**Файл**: `packages/exchange-core/src/services/auto-registration-service.ts`

**Добавить новый интерфейс** (после `AutoRegistrationResult`):

```typescript
/**
 * Extended result with generated password for email sending
 * Used only when generatePassword option is true
 */
export interface AutoRegistrationResultWithPassword extends AutoRegistrationResult {
  generatedPassword?: string; // plaintext password - only for email sending
}
```

#### 2.2. Изменить метод `createNewUserWithPassword()`

**Текущая сигнатура**:

```typescript
private async createNewUserWithPassword(
  email: string,
  generatePassword: boolean
): Promise<User>
```

**Новая сигнатура**:

```typescript
private async createNewUserWithPassword(
  email: string,
  generatePassword: boolean
): Promise<{ user: User; generatedPassword?: string }>
```

**Реализация**:

```typescript
private async createNewUserWithPassword(
  email: string,
  generatePassword: boolean
): Promise<{ user: User; generatedPassword?: string }> {
  const userData: {
    email: string;
    hashedPassword: string | undefined;
    isVerified: boolean;
  } = {
    email,
    hashedPassword: undefined,
    isVerified: false,
  };

  let plainPassword: string | undefined;

  if (generatePassword) {
    // Generate password
    plainPassword = generatePasswordForAutoFlow();

    // 🚨 ТОЛЬКО ДЛЯ РАЗРАБОТКИ - логируем сгенерированный пароль
    if (process.env.NODE_ENV === 'development') {
      this.logger.warn('DEV_ONLY_GENERATED_PASSWORD', {
        email,
        plainPassword,
        note: 'This is development-only logging. Remove in production!'
      });
    }

    // Hash password for storage
    const bcrypt = await import('bcryptjs');
    userData.hashedPassword = await bcrypt.hash(
      plainPassword,
      VALIDATION_LIMITS.BCRYPT_SALT_ROUNDS
    );
    userData.isVerified = true;

    this.logger.info('Generated secure password for auto-registered user', { email });
  }

  const user = await this.userManager.create(userData);

  // ✅ ВОЗВРАЩАЕМ plainPassword для отправки email (если был сгенерирован)
  return {
    user,
    generatedPassword: plainPassword
  };
}
```

#### 2.3. Изменить метод `determineUserStatus()`

**Изменение**: Обновить вызов `createNewUserWithPassword()` и возврат результата

```typescript
private async determineUserStatus(
  email: string,
  existingSessionId?: string,
  generatePassword: boolean = false
): Promise<UserAuthenticationStatus & { generatedPassword?: string }> {
  // ... existing session validation logic

  // ... existing user auto-login logic

  // 3. Unregistered → auto-registration
  const result = await this.createNewUserWithPassword(email, generatePassword);

  return {
    user: result.user,
    authenticationMethod: AUTHENTICATION_METHODS.AUTO_REGISTRATION,
    isNewUser: true,
    generatedPassword: result.generatedPassword, // ✅ ПЕРЕДАЕМ ДАЛЬШЕ
  };
}
```

#### 2.4. Изменить метод `ensureUserWithSession()`

**Изменение**: Обновить возвращаемый тип и передать `generatedPassword`

```typescript
async ensureUserWithSession(
  email: string,
  sessionMetadata: SessionMetadata,
  existingSessionId?: string,
  options: AutoRegistrationOptions = {}
): Promise<AutoRegistrationResultWithPassword> {
  try {
    this.logger.info('Ensuring user with session', {
      email,
      hasExistingSession: !!existingSessionId,
    });

    const userStatus = await this.determineUserStatus(
      email,
      existingSessionId,
      options.generatePassword || false
    );

    const finalSessionId = await this.resolveSessionId(
      userStatus,
      existingSessionId,
      sessionMetadata
    );

    this.logger.info('User session ensured successfully', {
      userId: userStatus.user.id,
      authMethod: userStatus.authenticationMethod,
      isNewUser: userStatus.isNewUser,
      sessionId: finalSessionId.substring(LOG_TRUNCATE_START, SESSION_ID_LOG_LENGTH) + '...',
    });

    return {
      user: userStatus.user,
      sessionId: finalSessionId,
      isNewUser: userStatus.isNewUser,
      authenticationMethod: userStatus.authenticationMethod,
      generatedPassword: userStatus.generatedPassword, // ✅ ПЕРЕДАЕМ НАВЕРХ
    };
  } catch (error) {
    this.logger.error('AutoRegistrationService.ensureUserWithSession failed', {
      error: error instanceof Error ? error.message : String(error),
      email,
    });
    throw new Error(
      `Failed to ensure user with session: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

### Этап 3: Интеграция в exchange router

#### 3.1. Обновить импорты

**Файл**: `apps/web/src/server/trpc/routers/exchange.ts`

**Добавить в импорты**:

```typescript
import {
  RateLimitedEmailService,
  type AutoRegistrationPasswordEmailData, // 🆕
} from '@repo/email-service';
```

#### 3.2. Создать helper функцию для отправки пароля

**Место**: После функции `sendCryptoAddressEmail()`

```typescript
/**
 * Отправляет email с паролем для новых пользователей после авторегистрации
 *
 * @architecture
 * - Вызывается ТОЛЬКО для новых пользователей (isNewUser === true)
 * - Отправляется ТОЛЬКО если был сгенерирован пароль (generatedPassword существует)
 * - Использует rate limiting через RateLimitedEmailService
 * - НЕ блокирует создание заказа при ошибках отправки
 */
async function sendAutoRegistrationPasswordEmail(params: {
  order: Order;
  userEmail: string;
  generatedPassword: string;
  sessionMetadata: SessionMetadata;
}) {
  const { order, userEmail, generatedPassword, sessionMetadata } = params;

  logger.info('Starting auto-registration password email sending', {
    orderId: order.publicId,
    email: userEmail,
  });

  // Проверяем конфигурацию отправки email
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const isGlobalEnabled = environment === 'production' || EMAIL_ENABLED_IN_DEVELOPMENT.GLOBAL;

  // TODO: Добавить специфичный флаг для auto-registration password в constants
  // Пока используем GLOBAL флаг
  if (!isGlobalEnabled) {
    logger.info('Auto-registration password email disabled by configuration', {
      orderId: order.publicId,
      email: userEmail,
      environment,
      message: 'Email отправка отключена в конфигурации для разработки',
    });
    return;
  }

  try {
    await RateLimitedEmailService.sendAutoRegistrationPassword(
      {
        userEmail,
        generatedPassword,
        orderId: order.publicId,
      },
      sessionMetadata.ip
    );

    logger.info('Auto-registration password email sent successfully', {
      orderId: order.publicId,
      email: userEmail,
    });
  } catch (emailError) {
    logger.error('Failed to send auto-registration password email', {
      orderId: order.publicId,
      email: userEmail,
      error: emailError instanceof Error ? emailError.message : UNKNOWN_ERROR_MESSAGE,
    });
    // Continue execution even if email sending fails
    // User can always use password reset functionality
  }
}
```

#### 3.3. Модифицировать `processSuccessfulOrder()`

**Изменение**: Добавить параметр `generatedPassword` и отправку email

```typescript
async function processSuccessfulOrder(params: {
  orderRequest: {
    email: string;
    cryptoAmount: number;
    currency: (typeof CRYPTOCURRENCIES)[number];
    uahAmount: number;
    recipientData?: { cardNumber?: string; bankDetails?: string; bankId?: string };
    fixedExchangeRate?: number;
  };
  depositAddress: string;
  userSession: {
    user: { id: string };
    sessionId: string;
    isNewUser: boolean;
    authenticationMethod: string;
    generatedPassword?: string; // 🆕 ДОБАВЛЕНО
  };
  sessionMetadata: SessionMetadata;
  usedOldestOccupiedWallet?: boolean;
}) {
  const {
    orderRequest,
    depositAddress,
    userSession,
    sessionMetadata,
    usedOldestOccupiedWallet = false,
  } = params;

  // ... existing wallet and order creation logic

  // Отправка email с адресом
  await sendCryptoAddressEmail({
    order,
    orderRequest,
    depositAddress,
    sessionMetadata,
    walletInfo,
  });

  // 🆕 НОВОЕ: Отправка email с паролем для новых пользователей
  if (userSession.isNewUser && userSession.generatedPassword) {
    await sendAutoRegistrationPasswordEmail({
      order,
      userEmail: orderRequest.email,
      generatedPassword: userSession.generatedPassword,
      sessionMetadata,
    });
  }

  // Отправка уведомления в Telegram
  await sendTelegramNotification(order, orderRequest, depositAddress, usedOldestOccupiedWallet);

  return {
    order,
    depositAddress,
    usedOldestOccupiedWallet,
    sessionInfo: {
      sessionId: userSession.sessionId,
      isNewUser: userSession.isNewUser,
    },
  };
}
```

### Этап 4: Обновление константы (опционально)

#### 4.1. Добавить флаг для auto-registration email

**Файл**: `packages/constants/src/email.ts`

**Изменение**: Добавить новый флаг в `EMAIL_ENABLED_IN_DEVELOPMENT`

```typescript
export const EMAIL_ENABLED_IN_DEVELOPMENT = {
  GLOBAL: true,
  CRYPTO_ADDRESS: true,
  WALLET_READY: false,
  AUTO_REGISTRATION_PASSWORD: true, // 🆕 НОВЫЙ ФЛАГ
} as const;
```

#### 4.2. Использовать новый флаг в `sendAutoRegistrationPasswordEmail()`

**Обновить проверку**:

```typescript
const isAutoRegPasswordEnabled =
  environment === 'production' || EMAIL_ENABLED_IN_DEVELOPMENT.AUTO_REGISTRATION_PASSWORD;

if (!isGlobalEnabled || !isAutoRegPasswordEnabled) {
  // ... logging
  return;
}
```

---

## ✅ Контрольные точки

### Checklist для проверки реализации

#### Этап 1: email-service

- [ ] `AutoRegistrationPasswordEmailData` тип добавлен в `types/index.ts`
- [ ] `auto-registration-password.html` шаблон создан
- [ ] `auto-registration-password.txt` шаблон создан
- [ ] `EmailTemplateService.generateAutoRegistrationPasswordEmail()` реализован
- [ ] `EmailService.sendAutoRegistrationPassword()` реализован
- [ ] `RateLimitedEmailService.sendAutoRegistrationPassword()` реализован
- [ ] Экспорты обновлены в `index.ts`
- [ ] Шаблоны протестированы визуально

#### Этап 2: exchange-core

- [ ] `AutoRegistrationResultWithPassword` интерфейс добавлен
- [ ] `createNewUserWithPassword()` возвращает `{ user, generatedPassword }`
- [ ] `determineUserStatus()` передает `generatedPassword`
- [ ] `ensureUserWithSession()` возвращает `AutoRegistrationResultWithPassword`
- [ ] Логика работает для всех сценариев (new user, existing user, existing session)

#### Этап 3: exchange router

- [ ] Импорты обновлены
- [ ] `sendAutoRegistrationPasswordEmail()` helper создан
- [ ] `processSuccessfulOrder()` интегрирует новый email
- [ ] Условие `isNewUser && generatedPassword` корректно
- [ ] Ошибки email не блокируют создание заказа

#### Этап 4: constants (опционально)

- [ ] `EMAIL_ENABLED_IN_DEVELOPMENT.AUTO_REGISTRATION_PASSWORD` добавлен
- [ ] Флаг используется в проверках

### Testing checklist

#### Unit tests

- [ ] `EmailTemplateService.generateAutoRegistrationPasswordEmail()` unit test
- [ ] `AutoRegistrationService.createNewUserWithPassword()` unit test с `generatedPassword`
- [ ] Проверка всех веток условий (generatePassword true/false)

#### Integration tests

- [ ] E2E тест: создание заявки новым пользователем
- [ ] Проверка отправки 2 email: crypto-address + auto-registration-password
- [ ] Проверка что пароль позволяет войти в систему
- [ ] Проверка rate limiting для email

#### Manual tests

- [ ] Development: создать заявку с новым email
- [ ] Проверить получение 2 писем
- [ ] Проверить корректность шаблонов
- [ ] Войти используя полученный пароль
- [ ] Проверить что пароль НЕ логируется в production

---

## 🎯 Соответствие AI Agent Rules

### Rule 25: ФОКУС ТОЛЬКО НА ЦЕЛИ ЗАДАЧИ ✅

**Цель**: Добавить отправку email с паролем при авторегистрации

**Изменения**:

- ✅ Минимальные: только email-сервис и авторегистрация
- ✅ Нет побочных улучшений или рефакторинга
- ✅ Не трогаем существующую логику создания заявок
- ✅ Не меняем архитектуру сессий

### Rule 24: ЖЕЛЕЗОБЕТОННОЕ ЗНАНИЕ СТРУКТУРЫ ✅

**Проверено**:

- ✅ PROJECT_STRUCTURE_MAP.md прочитан полностью
- ✅ Архитектура email-service изучена
- ✅ Флоу создания заявки проанализирован
- ✅ AutoRegistrationService детально изучен
- ✅ Существующие паттерны переиспользованы

### Rule 20: ЗАПРЕТ ИЗБЫТОЧНОСТИ ✅

**Проверка на дублирование**:

- ✅ Использовали существующий `email-service`
- ✅ Использовали существующий `EmailTemplateService`
- ✅ Использовали существующий `RateLimitedEmailService`
- ✅ Переиспользовали `generatePasswordForAutoFlow()`
- ✅ Следуем паттерну других email (crypto-address, wallet-ready)
- ✅ НЕ создаем новую систему отправки email

**Семантическая проверка**:

- ✅ НЕ переиспользуем `password-reset` (разная семантика)
- ✅ Создаем новый тип только если семантика отличается

### Rule 8: ЗАПРЕТ ПРЕДПОЛОЖЕНИЙ ✅

**Проверено через 4 метода**:

1. ✅ `list_dir` - проверили структуру пакетов
2. ✅ `grep_search` - нашли все упоминания генерации пароля
3. ✅ `semantic_search` - нашли email систему
4. ✅ `file_search` - нашли все файлы с паролями

**Факты вместо предположений**:

- ✅ Нашли что `password-reset` УЖЕ существует
- ✅ Подтвердили что `plainPassword` теряется после хеширования
- ✅ Проверили что `generatePassword: true` передается в exchange.ts
- ✅ Убедились что email-service полностью настроен

### Rule 2: СТРУКТУРИРОВАННЫЙ ПОДХОД ✅

**Выполнено**:

- ✅ Понимание задачи изложено
- ✅ Архитектурный анализ проведен
- ✅ План детализирован по этапам
- ✅ Ожидается одобрение перед реализацией

### Rule 17: ИСПОЛЬЗОВАНИЕ ЦЕНТРАЛИЗОВАННЫХ СИСТЕМ ✅

**Проверено**:

- ✅ `packages/email-service` - используется
- ✅ `packages/exchange-core` - модифицируется минимально
- ✅ `packages/utils` - `generatePasswordForAutoFlow()` переиспользуется
- ✅ `packages/constants` - будут добавлены новые флаги

### Rule 11: НЕДОПУСТИМОСТЬ ТЕХДОЛГА ✅

**Качество решения**:

- ✅ Архитектурно правильное решение (новый тип email)
- ✅ Семантически точное (welcome ≠ reset)
- ✅ Расширяемое (легко добавить другие типы email)
- ✅ Тестируемое (четкие unit test точки)
- ✅ Безопасное (пароль в plaintext только в памяти функции)

### Rule 7: ГОТОВНОСТЬ К ИСПОЛЬЗОВАНИЮ ✅

**План включает**:

- ✅ Полные шаблоны HTML + TXT
- ✅ Полные TypeScript типы
- ✅ Полную интеграцию с существующими системами
- ✅ Error handling и logging
- ✅ Rate limiting
- ✅ Development/Production конфигурация

---

## 📊 Итоговая оценка

### Архитектурная оценка

**Сложность**: 🟡 СРЕДНЯЯ

- Требует изменений в 3 пакетах
- Минимальная модификация существующего кода
- Максимальное переиспользование готовых решений

**Риски**: 🟢 НИЗКИЕ

- НЕ меняем существующие флоу
- Email отправка НЕ блокирует создание заказа
- Graceful degradation при ошибках email

**Тестируемость**: 🟢 ВЫСОКАЯ

- Четкие точки для unit тестов
- E2E тест легко реализуется
- Визуальная проверка шаблонов в Storybook

### Временная оценка

**Реализация**: 3-4 часа

- Этап 1 (email-service): 1.5 часа
- Этап 2 (exchange-core): 1 час
- Этап 3 (exchange router): 0.5 часа
- Этап 4 (constants): 0.5 часа

**Тестирование**: 2 часа

- Unit tests: 1 час
- Integration tests: 0.5 часа
- Manual testing: 0.5 часа

**Итого**: 5-6 часов чистого времени

---

## 🚀 Следующие шаги

1. **Одобрение плана**
   - Проверка архитектурного решения
   - Подтверждение UX подхода (семантика email)

2. **Реализация**
   - Следовать плану поэтапно
   - Коммитить по этапам

3. **Код-ревью**
   - Проверка соответствия AI Agent Rules
   - Проверка отсутствия дублирования

4. **Тестирование**
   - Unit tests
   - E2E tests
   - Manual QA

5. **Деплой**
   - Staging environment
   - Production rollout

---

**Документ подготовлен**: 18 октября 2025  
**Автор**: AI Agent (следуя ai-agent-rules.yml)  
**Статус**: 🟡 ОЖИДАЕТ ОДОБРЕНИЯ
