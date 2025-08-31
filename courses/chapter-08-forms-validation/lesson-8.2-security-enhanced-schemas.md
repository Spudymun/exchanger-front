# Урок 8.2: Security-Enhanced схемы валидации

> **Цель урока**: Изучить уникальную систему безопасности проекта - Security-Enhanced схемы для защиты от XSS атак и обеспечения финансовой безопасности

## 📖 Теория

### Проблемы безопасности в веб-приложениях

Обычная валидация проверяет **формат** данных, но не защищает от **атак**. В финансовых приложениях этого недостаточно.

**Типичные угрозы:**

1. **XSS (Cross-Site Scripting)** - вредоносный код в пользовательском вводе
2. **Injection атаки** - попытки выполнить команды через формы
3. **Подделка данных** - манипуляции с финансовыми суммами
4. **Социальная инженерия** - обман через интерфейс

**Пример уязвимости:**

```typescript
// ❌ Обычная валидация - уязвима к XSS
const nameSchema = z.string().min(1).max(50);

const userInput = "<script>alert('XSS')</script>";
const result = nameSchema.parse(userInput); // ✅ Пройдет валидацию!
// Но если это отобразится в HTML без экранирования - XSS атака!
```

### Принципы Security-Enhanced валидации

В проекте ExchangeGO разработана система многоуровневой защиты:

1. **XSS Protection** - проверка и очистка вредоносного контента
2. **Content Sanitization** - безопасное преобразование данных
3. **Business Rules Validation** - проверка финансовых лимитов
4. **Test Data Prevention** - блокировка тестовых карт в production

## 🔍 Анализ кода проекта

### Система XSS защиты

Рассмотрим `packages/utils/src/validation/security-utils.ts`:

```typescript
/**
 * XSS PATTERNS - опасные символы и конструкции
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Обработчики событий (onclick, onload, etc.)
  /<\/?\w+[^>]*>/g, // HTML теги
] as const;

/**
 * Проверяет строку на потенциальные XSS уязвимости
 */
export function containsPotentialXSS(input: string): boolean {
  if (typeof input !== 'string') return false;

  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Очищает строку от потенциально опасного контента
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(XSS_PATTERNS[0], '') // Удаляем script теги
    .replace(XSS_PATTERNS[1], '') // Удаляем iframe теги
    .replace(XSS_PATTERNS[2], '') // Удаляем javascript: ссылки
    .replace(XSS_PATTERNS[3], '') // Удаляем обработчики событий
    .replace(XSS_PATTERNS[4], '') // Удаляем HTML теги
    .trim();
}
```

**Многоуровневая защита:**

1. **Детекция** - `containsPotentialXSS()` находит опасные паттерны
2. **Санитизация** - `sanitizeInput()` очищает контент
3. **Валидация** - проверка после очистки

### Enhanced Building Blocks

Файл `packages/utils/src/validation/enhanced-building-blocks.ts` содержит защищенные компоненты:

```typescript
/**
 * XSS-PROTECTED STRING SCHEMA
 * Базовый блок для всех строковых полей с защитой
 */
export function createXSSProtectedString(): z.ZodEffects<z.ZodString, string, string> {
  return z.string().transform((val, ctx) => {
    // Проверка на XSS ПЕРЕД очисткой
    if (containsPotentialXSS(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'INVALID_CHARACTERS_DETECTED',
      });
      return z.NEVER; // Прерываем валидацию
    }

    // Санитизация для дополнительной безопасности
    return sanitizeInput(val);
  });
}

/**
 * XSS-PROTECTED STRING WITH LENGTH LIMITS
 */
export function createXSSProtectedStringWithLength(
  minLength: number,
  maxLength: number
): z.ZodEffects<z.ZodString, string, string> {
  return createXSSProtectedString()
    .refine(val => val.length >= minLength, `Минимум ${minLength} символов`)
    .refine(val => val.length <= maxLength, `Максимум ${maxLength} символов`);
}

/**
 * XSS-PROTECTED EMAIL SCHEMA
 */
export const xssProtectedEmailSchema = createXSSProtectedString()
  .email('EMAIL_INVALID_FORMAT')
  .max(SECURITY_VALIDATION_LIMITS.EMAIL_MAX_LENGTH, 'EMAIL_TOO_LONG');
```

**Архитектурное решение:**

- **Композиция защиты** - каждый уровень добавляет безопасность
- **Переиспользование** - базовые блоки для всех полей
- **Fail-fast подход** - немедленная остановка при обнаружении угрозы

### Security-Enhanced схемы для финансовых операций

Рассмотрим `packages/utils/src/validation/security-enhanced-exchange-schemas.ts`:

```typescript
/**
 * SECURITY-ENHANCED CARD NUMBER SCHEMA
 */
export const securityEnhancedCardNumberSchema = cardNumberSchema
  .transform(val => {
    // 1. XSS проверка ПЕРЕД обработкой
    if (containsPotentialXSS(val)) {
      throw new z.ZodError([
        {
          code: 'custom',
          message: 'INVALID_CHARACTERS_DETECTED',
          path: [],
        },
      ]);
    }
    // 2. Санитизация номера карты
    return sanitizeCardNumber(val);
  })
  .refine(sanitized => validateCardLength(sanitized)) // 3. Длина карты
  .refine(sanitized => luhnCheck(sanitized)) // 4. Алгоритм Луна
  .refine(sanitized => isNotTestCard(sanitized), 'Тестовые номера карт не допускаются'); // 5. BIN валидация

/**
 * CREATE EXCHANGE ORDER SCHEMA
 */
export const securityEnhancedCreateExchangeOrderSchema = z.object({
  email: xssProtectedEmailSchema, // XSS защищенный email
  cryptoAmount: z
    .number()
    .positive('AMOUNT_POSITIVE_REQUIRED')
    .min(VALIDATION_LIMITS.MIN_ORDER_AMOUNT, 'AMOUNT_MIN_VALUE')
    .max(VALIDATION_LIMITS.MAX_ORDER_AMOUNT, 'AMOUNT_MAX_VALUE')
    .finite('AMOUNT_MUST_BE_FINITE'), // Защита от Infinity/NaN
  uahAmount: z.number().positive('AMOUNT_POSITIVE_REQUIRED').finite('UAH_AMOUNT_MUST_BE_FINITE'),
  currency: currencySchema, // Только разрешенные валюты
  paymentDetails: z
    .object({
      cardNumber: securityEnhancedCardNumberSchema.optional(),
      bankDetails: createXSSProtectedStringWithLength(
        0,
        SECURITY_VALIDATION_LIMITS.MESSAGE_MAX_LENGTH
      ).optional(),
    })
    .optional(),
});
```

**Уровни защиты финансовых данных:**

1. **XSS Detection** - обнаружение вредоносного кода
2. **Data Sanitization** - очистка и нормализация
3. **Format Validation** - проверка формата (Luhn, email, etc.)
4. **Business Rules** - финансовые лимиты и ограничения
5. **Test Data Prevention** - блокировка тестовых данных в production

## 💻 Практическое задание

### Задание 1: Анализ XSS защиты

Протестируйте систему XSS защиты:

```typescript
import { containsPotentialXSS, sanitizeInput } from '@repo/utils';

// TODO: Проверьте эти входные данные на XSS
const testInputs = [
  'Обычное имя',
  "<script>alert('XSS')</script>",
  'javascript:void(0)',
  "<iframe src='evil.com'></iframe>",
  "onclick=alert('hack')",
  '<b>Жирный текст</b>',
  'Email: test@example.com',
];

testInputs.forEach(input => {
  const isXSS = containsPotentialXSS(input);
  const sanitized = sanitizeInput(input);

  console.log(`Input: "${input}"`);
  console.log(`XSS detected: ${isXSS}`);
  console.log(`Sanitized: "${sanitized}"`);
  console.log('---');
});
```

**Вопросы для анализа:**

1. Какие паттерны определяются как XSS?
2. Как работает санитизация?
3. Что остается после очистки?

### Задание 2: Создание Security-Enhanced схемы

Создайте защищенную схему для комментария пользователя:

```typescript
import { z } from 'zod';
import { createXSSProtectedStringWithLength } from '@repo/utils';

// TODO: Создайте схему для комментария с требованиями:
// - Защита от XSS
// - Минимум 10 символов, максимум 500
// - Нецензурная лексика запрещена
// - Ссылки запрещены

const FORBIDDEN_WORDS = ['spam', 'scam', 'hack'];
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

export const securityEnhancedCommentSchema = // Ваш код здесь

// TODO: Функция валидации комментария
export function validateComment(comment: string) {
  // Ваш код здесь
}
```

### Задание 3: Изучение валидации номера карты

Проанализируйте файл `packages/utils/src/validation/card-validation.ts`:

```typescript
// Найдите и объясните:
// 1. Как работает sanitizeCardNumber()?
// 2. Что проверяет luhnCheck()?
// 3. Зачем нужен isNotTestCard()?
// 4. Какие длины карт поддерживаются?
```

## ✅ Проверка знаний

### Теоретические вопросы

1. **Что такое XSS атака?**
   - a) Ошибка в CSS стилях
   - b) Внедрение вредоносного JavaScript кода
   - c) Неправильная типизация в TypeScript

2. **Почему финансовые приложения требуют особой валидации?**
   - a) Для лучшей производительности
   - b) Для защиты денежных средств пользователей
   - c) Для соответствия дизайн-системе

3. **В каком порядке применяется Security-Enhanced валидация?**
   - a) Санитизация → XSS проверка → Бизнес-правила
   - b) XSS проверка → Санитизация → Бизнес-правила
   - c) Бизнес-правила → XSS проверка → Санитизация

### Практические задания

1. **Найдите уязвимость:**

   ```typescript
   const userSchema = z.object({
     name: z.string().min(1),
     bio: z.string().max(1000),
   });
   ```

2. **Объясните код:**

   ```typescript
   .refine(sanitized => isNotTestCard(sanitized), 'Тестовые номера карт не допускаются')
   ```

3. **Создайте схему** для защищенного поля "Адрес доставки" с XSS защитой.

## 🔧 Отладка Security-Enhanced схем

### Проблема 1: Ложные срабатывания XSS

```typescript
// ❌ Проблема: обычный текст определяется как XSS
const text = 'Меньше чем 100 грн'; // Содержит '<'

// ✅ Решение: улучшенные паттерны
const improvedXSSPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
// Более точные регулярные выражения
```

### Проблема 2: Потеря данных при санитизации

```typescript
// ❌ Проблема: важная информация удаляется
const comment = 'Посетите <официальный сайт> компании';
// Санитизация уберет скобки

// ✅ Решение: контекстуальная обработка
const safeComment = comment.replace(/<([^<>]+)>/g, '[$1]');
// "Посетите [официальный сайт] компании"
```

### Проблема 3: Производительность регулярных выражений

```typescript
// ❌ Медленно: сложные вложенные регулярки
const slowPattern = /(<[^>]+>.*?<\/[^>]+>)|(<[^>]+\/>)/gi;

// ✅ Быстрее: простые паттерны + последовательная проверка
const fastPatterns = [/<script/gi, /<iframe/gi, /javascript:/gi];
```

## 🛡️ Лучшие практики безопасности

### 1. Принцип "Defense in Depth"

```typescript
// Многоуровневая защита
const secureSchema = z
  .string()
  .transform(sanitizeInput) // Уровень 1: Санитизация
  .refine(val => !containsPotentialXSS(val)) // Уровень 2: XSS проверка
  .refine(val => !containsForbiddenWords(val)) // Уровень 3: Контент-фильтр
  .refine(val => isWithinLimits(val)); // Уровень 4: Бизнес-правила
```

### 2. Fail-Safe по умолчанию

```typescript
// ❌ Небезопасно: разрешаем по умолчанию
function isAllowed(input: string): boolean {
  try {
    return !containsVirus(input);
  } catch {
    return true; // ❌ Опасно!
  }
}

// ✅ Безопасно: запрещаем по умолчанию
function isAllowed(input: string): boolean {
  try {
    return !containsVirus(input);
  } catch {
    return false; // ✅ Безопасно!
  }
}
```

### 3. Логирование и мониторинг

```typescript
export function createSecurityAuditedSchema<T>(schema: z.ZodSchema<T>) {
  return schema
    .transform((data, ctx) => {
      // Логируем все попытки валидации
      securityLogger.info('Validation attempt', {
        timestamp: new Date(),
        schema: schema.description,
        success: true,
      });

      return data;
    })
    .catch((error, ctx) => {
      // Логируем все ошибки безопасности
      securityLogger.warn('Security validation failed', {
        timestamp: new Date(),
        error: error.message,
        input: ctx.data,
      });

      throw error;
    });
}
```

## 📚 Дополнительные материалы

### Ресурсы по веб-безопасности

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - топ уязвимостей веб-приложений
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Инструменты тестирования безопасности

- [XSS Hunter](https://xsshunter.com/) - тестирование XSS уязвимостей
- [Zed Attack Proxy (ZAP)](https://www.zaproxy.org/) - сканер безопасности
- [ESLint Security Plugin](https://github.com/nodesecurity/eslint-plugin-security)

### Дополнительные паттерны Zod

```typescript
// Кастомные валидаторы безопасности
const secureIdSchema = z.string().uuid('Invalid ID format');
const secureTokenSchema = z.string().regex(/^[A-Za-z0-9+/]{40,}={0,2}$/, 'Invalid token');
const secureAmountSchema = z.number().positive().finite().safe(); // Защита от больших чисел
```

## 🎯 Резюме урока

В этом уроке вы изучили:

1. **Уникальную систему Security-Enhanced валидации** проекта ExchangeGO
2. **Многоуровневую защиту от XSS атак** и других угроз безопасности
3. **Архитектуру защищенных building blocks** для создания безопасных схем
4. **Специализированные валидаторы** для финансовых операций
5. **Лучшие практики** безопасности в валидации данных

**Ключевые принципы:**

- **Defense in Depth** - многоуровневая защита
- **Fail-Safe по умолчанию** - безопасность важнее удобства
- **Контекстуальная валидация** - разные правила для разных типов данных

**Следующий урок**: [Урок 8.3: Интеграция валидации с формами](./lesson-8.3-form-validation-integration.md) - изучим как Security-Enhanced схемы интегрируются с React Hook Form и next-intl в живых формах приложения.

---

[← Урок 8.1](./lesson-8.1-zod-runtime-validation.md) | [Урок 8.3 →](./lesson-8.3-form-validation-integration.md)
