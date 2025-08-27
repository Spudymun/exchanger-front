# 🧹 ПЛАН ПОЛНОЙ ОЧИСТКИ ИЗБЫТОЧНОСТИ CAPTCHA ПОЛЕЙ

> **Дата создания:** 27 августа 2025  
> **Статус:** 🔴 К выполнению  
> **Цель:** Устранение ВСЕХ дублирований и избыточности в captcha функционале  
> **Основано на:** Детальном анализе всего проекта без предположений

---

## 📊 ОБНАРУЖЕННАЯ ИЗБЫТОЧНОСТЬ

### 🔍 КРИТИЧЕСКИЕ ДУБЛИРОВАНИЯ

#### 1. **ДУБЛИРОВАНИЕ ИНТЕРФЕЙСОВ CaptchaFormFields**

**ПРОБЛЕМА:** Одинаковый интерфейс определен в 3 местах

```typescript
// ❌ ДУБЛИРОВАНИЕ #1: packages/ui/src/components/auth/AuthCaptchaField.tsx
interface CaptchaFormFields {
  captcha: string;
}

// ❌ ДУБЛИРОВАНИЕ #2: packages/ui/src/components/form-fields/FormCaptchaField.tsx
interface CaptchaFormFields {
  captcha: string;
}

// ✅ ИСТОЧНИК ИСТИНЫ: packages/ui/src/types/auth-fields.ts
export interface CaptchaFormFields extends Record<string, unknown> {
  captcha: string;
}
```

**РЕШЕНИЕ:** Удалить локальные определения, использовать импорт из типов.

---

#### 2. **ДУБЛИРОВАНИЕ ХУКОВ useMathCaptcha**

**ПРОБЛЕМА:** Практически идентичные хуки в 2 пакетах

```typescript
// ❌ ДУБЛИРОВАНИЕ: packages/ui/src/lib/useMathCaptchaLocal.ts
export function useMathCaptchaLocal(config: MathCaptchaConfig);

// ✅ ОРИГИНАЛ: packages/hooks/src/business/useMathCaptcha.ts
export function useMathCaptcha(config: MathCaptchaConfig);
```

**АНАЛИЗ ДУБЛИРОВАНИЯ:**

- Идентичные интерфейсы: `MathChallenge`, `MathCaptchaConfig`
- Идентичная логика: `generateMathChallenge`, `useState`, `useCallback`
- Идентичные константы: `MULTIPLY_MAX_NUMBER`, `ID_BASE`, etc.
- Идентичные конфигурации: `CAPTCHA_CONFIGS` vs `CAPTCHA_CONFIGS_LOCAL`

**РЕШЕНИЕ:** Удалить `useMathCaptchaLocal`, использовать `useMathCaptcha` из @repo/hooks.

---

#### 3. **ДУБЛИРОВАНИЕ КОНФИГУРАЦИЙ**

**ПРОБЛЕМА:** Две идентичные конфигурации сложности

```typescript
// ❌ ДУБЛИРОВАНИЕ: packages/ui/src/lib/useMathCaptchaLocal.ts
export const CAPTCHA_CONFIGS_LOCAL: Record<string, MathCaptchaConfig> = {
  easy: { minNumber: 1, maxNumber: 10, operations: ['add'] },
  medium: { minNumber: 1, maxNumber: 20, operations: ['add', 'subtract'] },
  hard: { minNumber: 1, maxNumber: 50, operations: ['add', 'subtract', 'multiply'] },
};

// ✅ ОРИГИНАЛ: packages/hooks/src/business/useMathCaptcha.ts
export const CAPTCHA_CONFIGS: Record<string, MathCaptchaConfig> = {
  easy: { minNumber: 1, maxNumber: 10, operations: ['add'] },
  medium: { minNumber: 1, maxNumber: 20, operations: ['add', 'subtract'] },
  hard: { minNumber: 1, maxNumber: 50, operations: ['add', 'subtract', 'multiply'] },
};
```

**РЕШЕНИЕ:** Удалить `CAPTCHA_CONFIGS_LOCAL`, использовать `CAPTCHA_CONFIGS`.

---

#### 4. **НЕСОГЛАСОВАННОСТЬ ИМЕНОВАНИЯ ПОЛЕЙ**

**ПРОБЛЕМА:** Разные названия для одного поля

```typescript
// ✅ AUTH ФОРМЫ: используют "captcha"
LoginFormData.captcha: string
RegisterFormData.captcha: string
CaptchaFormFields.captcha: string

// ❌ EXCHANGE ФОРМЫ: используют "captchaAnswer"
ExchangeFormData.captchaAnswer: string
```

**РЕШЕНИЕ:** Унифицировать все на `captcha: string`.

---

#### 5. **DEPRECATED КОМПОНЕНТ AuthCaptchaField**

**ПРОБЛЕМА:** Wrapper компонент больше не нужен

```typescript
// ❌ ИЗБЫТОЧНЫЙ WRAPPER: packages/ui/src/components/auth/AuthCaptchaField.tsx
export const AuthCaptchaField = <T extends CaptchaFormFields>(props) => {
  return <FormCaptchaField {...props} />;
};
```

**РЕШЕНИЕ:** Удалить после завершения миграции.

---

## 🛠️ ДЕТАЛЬНЫЙ ПЛАН ОЧИСТКИ

### ФАЗА 1: Унификация интерфейсов (15 минут)

#### Шаг 1.1: Удалить локальные CaptchaFormFields

**Файл:** `packages/ui/src/components/form-fields/FormCaptchaField.tsx`

```diff
- interface CaptchaFormFields {
-   captcha: string;
-   // Убрано: captchaVerified - избыточность устранена
- }

+ import { CaptchaFormFields } from '../../types/auth-fields';
```

**Файл:** `packages/ui/src/components/auth/AuthCaptchaField.tsx`

```diff
- interface CaptchaFormFields {
-   captcha: string;
-   // Убрано: captchaVerified - избыточность устранена
- }

+ import { CaptchaFormFields } from '../../types/auth-fields';
```

#### Шаг 1.2: Проверить экспорты

**Проверить:** `packages/ui/src/components/form-fields/index.ts`

```typescript
// Убедиться что CaptchaFormFields экспортируется
export type { EmailFormFields, CaptchaFormFields } from '../../types/auth-fields';
```

---

### ФАЗА 2: Унификация именования полей (30 минут)

#### Шаг 2.1: Переименовать captchaAnswer → captcha в ExchangeFormData

**Файл:** `packages/hooks/src/state/exchange-store.ts`

```diff
export interface ExchangeFormData {
  fromCurrency: CryptoCurrency;
  tokenStandard: string;
  toCurrency: 'UAH';
  cryptoAmount: number;
  uahAmount: number;
  selectedBankId: string;
  cardNumber: string;
  email: string;
- captchaAnswer: string;
+ captcha: string;
  agreeToTerms: boolean;
  rememberData?: boolean;
}
```

#### Шаг 2.2: Обновить константы по умолчанию

**Файл:** `packages/hooks/src/state/exchange-constants.ts`

```diff
export const DEFAULT_EXCHANGE_FORM_DATA: ExchangeFormData = {
  // ... другие поля
- captchaAnswer: '',
+ captcha: '',
  // ... остальные поля
};
```

#### Шаг 2.3: Найти и обновить ВСЕ использования captchaAnswer

**Команда поиска:**

```bash
grep -r "captchaAnswer" packages/ apps/ --include="*.ts" --include="*.tsx"
```

**Обновить в:**

- Схемы валидации
- Компоненты форм
- Документация
- Тесты

---

### ФАЗА 3: Устранение дублирования хуков (45 минут)

#### Шаг 3.1: Анализ зависимостей useMathCaptchaLocal

**Проверить где используется:**

```bash
grep -r "useMathCaptchaLocal" packages/ apps/
```

#### Шаг 3.2: Замена useMathCaptchaLocal на useMathCaptcha

**Файл:** `packages/ui/src/components/form-fields/FormCaptchaField.tsx`

```diff
- import { useMathCaptchaLocal, CAPTCHA_CONFIGS_LOCAL } from '../../lib/useMathCaptchaLocal';
+ import { useMathCaptcha, CAPTCHA_CONFIGS } from '@repo/hooks';

function useCaptchaLogic<T extends CaptchaFormFields>(
  form: UseFormReturn<T>,
  t: (key: string) => string
) {
- const config = CAPTCHA_CONFIGS_LOCAL[AUTH_CAPTCHA_CONFIG.DIFFICULTY] || CAPTCHA_CONFIGS_LOCAL.medium;
+ const config = CAPTCHA_CONFIGS[AUTH_CAPTCHA_CONFIG.DIFFICULTY] || CAPTCHA_CONFIGS.medium;
- const captcha = useMathCaptchaLocal(config);
+ const captcha = useMathCaptcha(config);

  // остальная логика без изменений
}
```

#### Шаг 3.3: Удалить дублированный файл

**Удалить:** `packages/ui/src/lib/useMathCaptchaLocal.ts`

#### Шаг 3.4: Обновить экспорты

**Файл:** `packages/ui/src/lib/index.ts` (если существует)

```diff
- export { useMathCaptchaLocal, CAPTCHA_CONFIGS_LOCAL } from './useMathCaptchaLocal';
```

---

### ФАЗА 4: Унификация схем валидации (20 минут)

#### Шаг 4.1: Проверить все схемы captcha

**Найти все схемы:**

```bash
grep -r "captcha.*schema\|schema.*captcha" packages/utils/src/validation/
```

#### Шаг 4.2: Убедиться в использовании единой схемы

**Проверить что везде используется:**

```typescript
import { securityEnhancedCaptchaSchema } from '@repo/utils';
```

---

### ФАЗА 5: Финальная очистка (15 минут)

#### Шаг 5.1: Удалить AuthCaptchaField после полной миграции

**После подтверждения что нигде не используется:**

```bash
# Проверить использования
grep -r "AuthCaptchaField" packages/ apps/ --exclude-dir=node_modules

# Если не найдено - удалить
rm packages/ui/src/components/auth/AuthCaptchaField.tsx
```

#### Шаг 5.2: Обновить экспорты auth компонентов

**Файл:** `packages/ui/src/components/auth/index.ts`

```diff
- export { AuthCaptchaField } from './AuthCaptchaField';
```

**Файл:** `packages/ui/src/components/index.ts`

```diff
export {
  AuthPasswordField,
  AuthConfirmPasswordField,
- AuthCaptchaField,
  AuthSubmitButton,
  AuthSwitchButton,
  AuthFormLayout,
} from './auth';
```

---

## 🧪 ПЛАН ТЕСТИРОВАНИЯ ОЧИСТКИ

### Автоматические проверки

```bash
# 1. TypeScript проверки
npm run check-types

# 2. Сборка проекта
npm run build

# 3. Unit тесты
npm test

# 4. Проверка отсутствия дублирований
grep -r "interface CaptchaFormFields" packages/ | wc -l  # Должно быть 1
grep -r "useMathCaptchaLocal" packages/ | wc -l        # Должно быть 0
grep -r "CAPTCHA_CONFIGS_LOCAL" packages/ | wc -l      # Должно быть 0
grep -r "captchaAnswer" packages/ | wc -l              # Должно быть 0
```

### Ручное тестирование

- [ ] Login форма: captcha работает
- [ ] Register форма: captcha работает
- [ ] Exchange форма: captcha работает
- [ ] Валидация: ошибки отображаются корректно
- [ ] Локализация: все тексты переведены

---

## 📈 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### Количественные улучшения

- **-1 дублированный хук** (useMathCaptchaLocal удален)
- **-2 дублированных интерфейса** (локальные CaptchaFormFields удалены)
- **-1 дублированная конфигурация** (CAPTCHA_CONFIGS_LOCAL удалена)
- **-1 deprecated компонент** (AuthCaptchaField удален)
- **Унифицировано именование** (captcha везде)

### Качественные улучшения

- ✅ **Единый источник истины** для всех captcha типов
- ✅ **Отсутствие дублирования** в бизнес-логике
- ✅ **Консистентное именование** полей
- ✅ **Упрощенная архитектура** без wrapper компонентов
- ✅ **Легкость поддержки** - изменения в одном месте

---

## ⚠️ РИСКИ И МИТИГАЦИЯ

### Потенциальные риски

1. **Циклические зависимости** при замене useMathCaptchaLocal
   - **Митигация:** Проверить dependency graph перед изменениями

2. **Breaking changes** при переименовании captchaAnswer
   - **Митигация:** Поэтапная замена с проверкой на каждом шаге

3. **Потеря данных** при удалении старых полей
   - **Митигация:** Создать migration script для данных

### План отката

```bash
# В случае проблем - откатить к предыдущему коммиту
git revert <commit-hash>

# Или восстановить конкретные файлы
git checkout HEAD~1 -- packages/ui/src/lib/useMathCaptchaLocal.ts
```

---

## ✅ КРИТЕРИИ ГОТОВНОСТИ

### Технические требования

- [ ] ✅ Только один интерфейс `CaptchaFormFields` в проекте
- [ ] ✅ Только один хук `useMathCaptcha` для captcha логики
- [ ] ✅ Только одна конфигурация `CAPTCHA_CONFIGS`
- [ ] ✅ Везде используется поле `captcha: string`
- [ ] ✅ Нет deprecated компонентов в production коде
- [ ] ✅ Все тесты проходят
- [ ] ✅ TypeScript компилируется без ошибок

### Архитектурные требования

- [ ] ✅ Соответствие принципу DRY (Don't Repeat Yourself)
- [ ] ✅ Единый источник истины для всех captcha сущностей
- [ ] ✅ Правильная структура зависимостей пакетов
- [ ] ✅ Отсутствие циклических зависимостей

---

**СТАТУС:** 🔴 К выполнению  
**ПРИОРИТЕТ:** Высокий (архитектурная очистка)  
**ВРЕМЯ ВЫПОЛНЕНИЯ:** 2 часа  
**СЛЕДУЮЩИЙ ЭТАП:** Начать с Фазы 1 - Унификация интерфейсов
