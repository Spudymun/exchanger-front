# 🏗️ Architectural Integration Guide - Агент-архитектор

**Дата создания:** 27 августа 2025  
**Версия:** 1.0  
**Назначение:** Руководство по сохранению архитектурной целостности при добавлении новой функциональности

---

## 🎯 Принципы архитектурной интеграции

### 1. **Оценка соответствия принципам проекта**

**ExchangeGO использует:**

- ✅ **Centralized CSS Architecture v3.0** - единый источник истины в `packages/tailwind-preset/globals.css`
- ✅ **Compound Components Pattern v2.0** - контекстно-зависимые компоненты с shared state
- ✅ **Package-based Monorepo** - четкое разделение по архитектурным уровням (6 уровней)
- ✅ **TypeScript-first** - строгая типизация без any/@ts-ignore
- ✅ **Security-Enhanced Validation** - санитизация всех пользовательских данных
- ✅ **tRPC v11 Namespace Composition** - роле-основанная архитектура API

**КРИТИЧЕСКОЕ ПРАВИЛО:** Новая функциональность ДОЛЖНА следовать установленным принципам

### 2. **Шаблоны проектирования**

#### A. Variant Pattern для UI компонентов

```typescript
// ✅ ПРАВИЛЬНО - используем cva (class-variance-authority)
const submitButtonVariants = cva(
  'base-submit-button-styles', // базовые стили
  {
    variants: {
      context: {
        auth: 'auth-specific-styles',
        exchange: 'exchange-specific-styles',
        hero: 'hero-specific-styles',
      },
      size: {
        default: 'h-11 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      context: 'auth',
      size: 'default',
    },
  }
);
```

#### B. Compound Component Pattern для сложных UI

```typescript
// ✅ ПРАВИЛЬНО - следуем существующему паттерну ExchangeForm
function UnifiedSubmitButton({ children, variant, ...props }: UnifiedSubmitButtonProps) {
  return (
    <SubmitButtonContext.Provider value={{ variant, ...contextValue }}>
      {children}
    </SubmitButtonContext.Provider>
  );
}

UnifiedSubmitButton.Auth = AuthVariant;
UnifiedSubmitButton.Exchange = ExchangeVariant;
UnifiedSubmitButton.Hero = HeroVariant;
```

#### C. Package-based Centralization

```typescript
// ✅ ПРАВИЛЬНО - централизация в packages/ui
// packages/ui/src/components/forms/UnifiedSubmitButton.tsx
export { UnifiedSubmitButton } from './UnifiedSubmitButton';

// ❌ НЕПРАВИЛЬНО - дублирование в apps
// apps/web/src/components/CustomSubmitButton.tsx
```

### 3. **Запрет изобретения велосипедов**

#### A. Обязательная проверка существующих решений

**АЛГОРИТМ ПРОВЕРКИ ПЕРЕД СОЗДАНИЕМ:**

1. **Уровень 1 (Константы):** `packages/constants/` - все статические значения
2. **Уровень 2 (Утилиты):** `packages/utils/`, `packages/exchange-core/` - бизнес-логика
3. **Уровень 3 (API):** `apps/web/src/server/trpc/` - серверная логика
4. **Уровень 4 (Состояние):** `packages/hooks/` - клиентское состояние
5. **Уровень 5 (UI):** `packages/ui/` - компоненты интерфейса
6. **Уровень 6 (Приложения):** `apps/` - специфичная логика приложений

#### B. Примеры существующих решений

```yaml
# packages/constants/src/index.ts - константы UI
BUTTON_SIZES: { default: 'h-11 px-4', lg: 'h-12 px-6' }

# packages/ui/src/components/forms/ - формы
AuthForm: Compound component с валидацией
ExchangeForm: Compound component для обменов

# packages/hooks/src/client-hooks/ - хуки
useFormWithNextIntl: Унифицированная работа с формами
```

### 4. **Определение контракты и интерфейсов**

#### A. Интерфейс унифицированной кнопки submit

```typescript
// ✅ АРХИТЕКТУРНО ПРАВИЛЬНЫЙ интерфейс
interface UnifiedSubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>> {
  // Совместимость с AuthSubmitButton
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;

  // Новые возможности для Exchange
  variant?: 'auth' | 'exchange' | 'hero';
  size?: 'default' | 'lg';

  // Стандартные HTML атрибуты
  className?: string;
  children?: React.ReactNode;

  // Обратная совместимость с ExchangeFormAction
  isValid?: boolean; // fallback если form не передан
}
```

#### B. Контракт интеграции

```typescript
// ✅ Обратная совместимость
// Существующий код должен работать без изменений
<AuthSubmitButton form={form} t={t} /> // ✅ Продолжает работать

// ✅ Новые возможности
<UnifiedSubmitButton form={form} t={t} variant="exchange" size="lg" />

// ✅ Legacy поддержка
<UnifiedSubmitButton isValid={isValid} t={t} variant="hero">
  {t('exchange')}
</UnifiedSubmitButton>
```

---

## 🔧 Архитектурные уровни и их ответственность

### Уровень 1: Constants & Types

**Расположение:** `packages/constants/`, `packages/exchange-core/types/`
**Ответственность:** Единственный источник истины для всех статических значений

```typescript
// ✅ ПРАВИЛЬНО - централизация UI констант
export const SUBMIT_BUTTON_VARIANTS = {
  AUTH: 'auth',
  EXCHANGE: 'exchange',
  HERO: 'hero',
} as const;

export const BUTTON_ANIMATIONS = {
  HERO_HOVER: 'hover:scale-[1.02] active:scale-[0.98]',
  DEFAULT: 'transition-all duration-200',
} as const;
```

### Уровень 2: Utils & Core Logic

**Расположение:** `packages/utils/`, `packages/exchange-core/`
**Ответственность:** Чистые функции и бизнес-логика

```typescript
// ✅ ПРАВИЛЬНО - утилиты валидации
export function validateFormSubmission<T>(
  form: UseFormReturn<T>,
  fallbackValid?: boolean
): boolean {
  // Унифицированная логика проверки
  return (form?.isValid && Object.keys(form?.errors || {}).length === 0) || fallbackValid || false;
}
```

### Уровень 5: UI Components

**Расположение:** `packages/ui/src/components/`
**Ответственность:** Переиспользуемые компоненты интерфейса

```typescript
// ✅ ПРАВИЛЬНО - расширение существующего компонента
export const UnifiedSubmitButton = React.forwardRef<
  HTMLButtonElement,
  UnifiedSubmitButtonProps
>(({ variant = 'auth', form, isValid, isLoading, t, children, className, ...props }, ref) => {

  // Унифицированная валидация
  const finalIsValid = validateFormSubmission(form, isValid);

  // Variant-based стили
  const variantStyles = submitButtonVariants({ variant, className });

  return (
    <Button
      ref={ref}
      type="submit"
      disabled={isLoading || !finalIsValid}
      className={variantStyles}
      {...props}
    >
      {isLoading ? t?.('submitting') : (children || t?.('submit'))}
    </Button>
  );
});
```

---

## 🚫 Антипаттерны и запрещенные практики

### 1. **Дублирование функциональности**

```typescript
// ❌ ЗАПРЕЩЕНО - создание нового компонента вместо расширения
function ExchangeSubmitButton() {
  // Дублирует логику AuthSubmitButton
}

// ✅ ПРАВИЛЬНО - расширение существующего
const UnifiedSubmitButton = enhanceComponent(AuthSubmitButton, exchangeVariants);
```

### 2. **Нарушение архитектурных границ**

```typescript
// ❌ ЗАПРЕЩЕНО - бизнес-логика в UI компоненте
function SubmitButton({ form }) {
  const result = calculateExchangeAmount(form.values.amount); // Должно быть в core
  return <Button>Submit {result}</Button>;
}

// ✅ ПРАВИЛЬНО - разделение ответственности
function SubmitButton({ form, calculatedAmount }) {
  return <Button>Submit {calculatedAmount}</Button>;
}
```

### 3. **Игнорирование централизованных систем**

```typescript
// ❌ ЗАПРЕЩЕНО - прямые стили вместо семантических классов
className = 'bg-blue-500 text-white hover:bg-blue-600';

// ✅ ПРАВИЛЬНО - семантические классы из centralized CSS
className = 'bg-primary text-primary-foreground hover:bg-primary/90';
```

---

## 📋 Чек-лист архитектурной интеграции

### ✅ Pre-implementation Checklist

- [ ] **Изучена документация** `PROJECT_STRUCTURE_MAP.md`
- [ ] **Проанализированы существующие решения** на всех 6 уровнях
- [ ] **Определен оптимальный архитектурный уровень** для новой функциональности
- [ ] **Выбран правильный паттерн проектирования** (Variant, Compound, etc.)
- [ ] **Спроектированы контракты интерфейсов** с обратной совместимостью
- [ ] **Запланирована централизация** констант и утилит

### ✅ Implementation Checklist

- [ ] **Используются централизованные системы** (constants, utils, ui)
- [ ] **Соблюдается TypeScript-first подход** без any/@ts-ignore
- [ ] **Применяются семантические CSS классы** из tailwind-preset
- [ ] **Следуется установленным patterns** (Compound Components v2.0)
- [ ] **Обеспечивается обратная совместимость** с существующим кодом
- [ ] **Документируются архитектурные решения**

### ✅ Post-implementation Checklist

- [ ] **Протестирована интеграция** с существующими компонентами
- [ ] **Проверена производительность** и размер бундла
- [ ] **Обновлена документация** и примеры использования
- [ ] **Созданы Storybook stories** для новых вариантов
- [ ] **Запланирован рефакторинг** устаревших решений
- [ ] **Проведен architectural review** по протоколам из `CODE_REVIEW_PROTOCOLS.md`

---

## 🎯 Примеры правильной интеграции

### Пример 1: Унификация Submit Button

**Проблема:** Дублирование функциональности между `AuthSubmitButton` и `ExchangeFormAction`

**Архитектурное решение:**

1. **Анализ существующих решений:** AuthSubmitButton (уровень 5) + ExchangeFormAction (уровень 6)
2. **Выбор паттерна:** Variant Pattern для поддержки разных контекстов
3. **Определение контракта:** Унифицированный интерфейс с обратной совместимостью
4. **Централизация:** Перенос в `packages/ui` с variant-based конфигурацией

**Результат:** Один компонент вместо трех, единообразное поведение, сохранение совместимости

### Пример 2: Добавление новой валидации

**Проблема:** Нужна дополнительная валидация для amount полей

**Архитектурное решение:**

1. **Анализ существующих решений:** `packages/utils/src/validation/`
2. **Расширение существующих схем:** Модификация `securityEnhancedHeroExchangeFormSchema`
3. **Централизация логики:** Добавление в `validateCryptoAmountLimits`
4. **Интеграция:** Автоматическое применение через `useFormWithNextIntl`

**Результат:** Расширение существующей системы без дублирования

---

## 🚀 Будущее развитие архитектуры

### Планируемые улучшения

- **Enhanced Variant System:** Более гибкая система вариантов компонентов
- **Automated Architecture Linting:** ESLint правила для проверки архитектурных принципов
- **Component Composition Graph:** Визуализация зависимостей между компонентами
- **Performance Monitoring:** Отслеживание влияния архитектурных решений на производительность

### Метрики качества архитектуры

- **DRY Compliance:** 0% дублирования кода
- **Package Boundaries:** Соблюдение архитектурных уровней
- **Type Safety:** 100% покрытие TypeScript
- **CSS Centralization:** Использование семантических классов

---

## 📋 План реализации унификации Submit Button - Агент-кодер (ИСПРАВЛЕН)

**Роль:** Агент-кодер с фокусом на рефакторинг и паттерны  
**Задача:** Грамотно встроить новую функциональность в существующую кодовую базу

### 🔍 **КРИТИЧЕСКИЕ ОШИБКИ ОБНАРУЖЕНЫ И ИСПРАВЛЕНЫ**

**Анализ выявил серьезные расхождения между планом и реальной архитектурой:**

❌ **ОШИБКА 1: Неправильные константы**

- План предлагал PRIMARY vs реальность использует default
- BUTTON_SIZES не соответствуют размерам в button.tsx

❌ **ОШИБКА 2: Неправильный подход к вариантам**

- План предлагал создать новый context prop
- Но проект использует существующие button variants

❌ **ОШИБКА 3: Неправильное понимание buttonStyles**

- shared-styles.ts содержит стили для page компонентов, не UI
- Основная система - buttonVariants в button.tsx

### 🔍 **Реальная архитектура (100% изучена)**

**1. Существующая константная система:**

```typescript
// packages/constants/src/ui.ts - РЕАЛЬНЫЕ константы
export const BUTTON_VARIANTS = {
  PRIMARY: 'primary', // ❌ НЕ СООТВЕТСТВУЕТ button.tsx
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  LINK: 'link',
} as const;

export const BUTTON_SIZES = {
  SM: 'sm',
  MD: 'md', // ❌ НЕ СООТВЕТСТВУЕТ button.tsx
  LG: 'lg',
  ICON: 'icon',
} as const;
```

**2. Реальная реализация button.tsx:**

```typescript
// packages/ui/src/components/ui/button.tsx - РЕАЛЬНАЯ система
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap...",
  {
    variants: {
      variant: {
        default,           // ≠ PRIMARY
        destructive,
        outline,
        secondary,
        ghost,
        link
      },
      size: {
        default,           // ≠ MD
        sm,
        lg,
        icon,
        compact,           // ❌ ОТСУТСТВУЕТ в константах
        xs                 // ❌ ОТСУТСТВУЕТ в константах
      }
    }
  }
);
```

**3. AuthSubmitButton реализация:**

```typescript
// packages/ui/src/components/auth/AuthSubmitButton.tsx
interface AuthSubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
}

// Validation: form.isValid && Object.keys(form.errors).length === 0
```

**4. ExchangeFormAction реализация:**

```typescript
// apps/web/src/components/HeroExchangeForm.tsx
function ExchangeFormAction({ isValid, t }: ExchangeFormActionProps) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={!isValid}
      className="w-full sm:w-auto sm:min-w-[200px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
    >
      {t('exchange')}
    </Button>
  );
}
```

### 🛠️ **ИСПРАВЛЕННЫЙ план реализации**

#### **Этап 1: Исправление константных несоответствий**

```typescript
// packages/constants/src/ui.ts - ИСПРАВЛЕНИЕ существующих констант
export const BUTTON_VARIANTS = {
  PRIMARY: 'default', // ✅ ИСПРАВЛЕНО: primary → default
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  LINK: 'link',
} as const;

export const BUTTON_SIZES = {
  SM: 'sm',
  DEFAULT: 'default', // ✅ ИСПРАВЛЕНО: MD → DEFAULT
  LG: 'lg',
  ICON: 'icon',
  COMPACT: 'compact', // ✅ ДОБАВЛЕНО: отсутствующий размер
  XS: 'xs', // ✅ ДОБАВЛЕНО: отсутствующий размер
} as const;

// НОВЫЕ константы для submit button styling
export const SUBMIT_BUTTON_STYLES = {
  HERO_ANIMATION: 'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
  EXCHANGE_RESPONSIVE: 'w-full sm:w-auto sm:min-w-[200px]',
  AUTH_STANDARD: 'submit-button',
} as const;
```

#### **Этап 2: Расширение AuthSubmitButton (НЕ создание нового)**

```typescript
// packages/ui/src/components/auth/AuthSubmitButton.tsx - РАСШИРЕНИЕ
import { UseFormReturn } from '@repo/hooks';
import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { SUBMIT_BUTTON_STYLES } from '@repo/constants';

interface AuthSubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>> {
  // СУЩЕСТВУЮЩИЕ props (backward compatibility)
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;

  // НОВЫЕ props для унификации
  variant?: 'default' | 'secondary' | 'outline';           // Используем РЕАЛЬНЫЕ варианты
  size?: 'default' | 'sm' | 'lg';                          // Используем РЕАЛЬНЫЕ размеры

  // Legacy compatibility для ExchangeFormAction
  isValid?: boolean;                                       // fallback если form не передан
  submitStyle?: 'auth' | 'hero' | 'exchange';             // Стиль submit button
  children?: React.ReactNode;
  className?: string;
}

export const AuthSubmitButton = <T extends Record<string, unknown> = Record<string, unknown>>({
  form,
  isLoading = false,
  t,
  variant = 'default',
  size = 'default',
  isValid,
  submitStyle = 'auth',
  children,
  className,
  ...props
}: AuthSubmitButtonProps<T>) => {

  // СУЩЕСТВУЮЩАЯ валидация logic (сохранена)
  const getFormValidation = (): boolean => {
    if (form) {
      return form.isValid && Object.keys(form.errors).length === 0;
    }
    return isValid ?? false;
  };

  const finalIsValid = getFormValidation();
  const finalDisabled = isLoading || !finalIsValid;

  // КОНТЕКСТНО-зависимые стили
  const getSubmitStyles = () => {
    switch (submitStyle) {
      case 'hero':
        return cn(
          SUBMIT_BUTTON_STYLES.EXCHANGE_RESPONSIVE,
          SUBMIT_BUTTON_STYLES.HERO_ANIMATION
        );
      case 'exchange':
        return SUBMIT_BUTTON_STYLES.EXCHANGE_RESPONSIVE;
      case 'auth':
      default:
        return SUBMIT_BUTTON_STYLES.AUTH_STANDARD;
    }
  };

  // КОНТЕКСТНО-зависимый текст
  const getButtonText = (): React.ReactNode => {
    if (children) return children;

    if (!t) {
      console.warn('AuthSubmitButton: t function required for automatic text');
      return 'Submit';
    }

    switch (submitStyle) {
      case 'hero':
      case 'exchange':
        return isLoading ? t('submitting') : t('exchange');
      case 'auth':
      default:
        return isLoading ? t('submitting') : t('submit');
    }
  };

  // AUTO-SIZE для hero/exchange
  const getFinalSize = () => {
    if ((submitStyle === 'hero' || submitStyle === 'exchange') && size === 'default') {
      return 'lg';
    }
    return size;
  };

  return (
    <Button
      type="submit"
      variant={variant}
      size={getFinalSize()}
      disabled={finalDisabled}
      className={cn(
        getSubmitStyles(),
        className
      )}
      {...props}
    >
      {getButtonText()}
    </Button>
  );
};
```

#### **Этап 3: Рефакторинг ExchangeFormAction (используем расширенный AuthSubmitButton)**

```tsx
// apps/web/src/components/HeroExchangeForm.tsx - РЕФАКТОРИНГ
import { AuthSubmitButton } from '@repo/ui'; // Используем РАСШИРЕННЫЙ AuthSubmitButton

function ExchangeFormAction({ isValid, t }: ExchangeFormActionProps) {
  return (
    <ExchangeForm.ActionArea variant="simple">
      <AuthSubmitButton
        submitStyle="hero" // ✅ Используем новый prop
        size="lg"
        isValid={isValid} // ✅ Legacy compatibility
        t={t}
        variant="default"
      >
        {t('exchange')}
      </AuthSubmitButton>
    </ExchangeForm.ActionArea>
  );
}
```

#### **Этап 4: Обновление Compound Pattern Integration**

```typescript
// packages/ui/src/lib/auth-helpers.tsx - БЕЗ ИЗМЕНЕНИЙ
// Существующая enhancement система остается неизменной
// AuthSubmitButton автоматически получает form, isLoading, t через context

function enhanceChildWithContext(
  child: React.ReactElement,
  context: AuthFormContextValue | undefined
) {
  // Существующая логика остается той же
  // AuthSubmitButton теперь поддерживает дополнительные props
}
```

#### **Этап 5: Миграционная стратегия (Обратная совместимость)**

```typescript
// packages/ui/src/components/index.ts - МИНИМАЛЬНЫЕ изменения
export { AuthSubmitButton } from './auth/AuthSubmitButton'; // ✅ Тот же экспорт

// НОВЫЕ aliases для удобства
export { AuthSubmitButton as SubmitButton } from './auth/AuthSubmitButton';
export { AuthSubmitButton as ExchangeSubmitButton } from './auth/AuthSubmitButton';

// Type exports
export type { AuthSubmitButtonProps } from './auth/AuthSubmitButton';
```

### 🔧 **Validation & Testing Strategy**

```typescript
// packages/ui/src/__tests__/AuthSubmitButton.test.tsx - ОБНОВЛЕННЫЕ тесты

describe('AuthSubmitButton Enhanced', () => {
  it('maintains backward compatibility', () => {
    const form = createMockForm();
    render(<AuthSubmitButton form={form} t={mockT} />);
    // ✅ Существующий API работает без изменений
  });

  it('supports new hero style', () => {
    render(
      <AuthSubmitButton
        submitStyle="hero"
        isValid={true}
        t={mockT}
        size="lg"
      />
    );
    expect(screen.getByRole('button')).toHaveClass('hover:scale-[1.02]');
  });

  it('supports new exchange style', () => {
    render(
      <AuthSubmitButton
        submitStyle="exchange"
        form={form}
        t={mockT}
      />
    );
    expect(screen.getByRole('button')).toHaveClass('sm:min-w-[200px]');
  });

  it('maintains variant and size support', () => {
    render(
      <AuthSubmitButton
        variant="outline"
        size="sm"
        form={form}
        t={mockT}
      />
    );
    // ✅ Тестируем реальные button variants
  });
});
```

### 🎯 **ИСПРАВЛЕННЫЙ результат**

**Архитектурные преимущества:**

- ✅ **Реальная интеграция**: Использует СУЩЕСТВУЮЩУЮ архитектуру button.tsx
- ✅ **Исправленные константы**: Соответствуют реальной реализации
- ✅ **DRY Compliance**: Устранение дублирования через расширение AuthSubmitButton
- ✅ **100% Backward Compatibility**: Существующий код работает без изменений
- ✅ **Правильное понимание**: shared-styles vs buttonVariants

**Технические исправления:**

- ✅ **Правильные Variants**: default, не primary
- ✅ **Правильные Sizes**: default, не md; добавлены compact, xs
- ✅ **Расширение вместо создания**: AuthSubmitButton enhancement vs новый компонент
- ✅ **Legacy Support**: isValid prop для ExchangeFormAction compatibility

**Этот план соответствует РЕАЛЬНОЙ архитектуре проекта, а не выдуманной.**
};

````

3. **UI Components (packages/ui/src/components/ui/button.tsx):**
```typescript
// ✅ ОБНАРУЖЕН cva pattern с полным набором вариантов
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap...",
  {
    variants: {
      variant: { default, destructive, outline, secondary, ghost, link },
      size: { default, sm, lg, icon, compact, xs }
    }
  }
);
````

### 🛠️ **План реализации (с полным рефакторингом)**

#### **Этап 1: Расширение константов (packages/constants/src/ui.ts)**

```typescript
// РАСШИРЕНИЕ существующих констант
export const BUTTON_VARIANTS = {
  // Существующие варианты
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  LINK: 'link',

  // НОВЫЕ варианты для submit contexts
  AUTH: 'auth', // Синоним для primary в auth контексте
  EXCHANGE: 'exchange', // Специальный стиль для exchange
  HERO: 'hero', // Специальный стиль для hero формы
} as const;

// НОВЫЕ константы для submit button contexts
export const SUBMIT_BUTTON_CONTEXTS = {
  AUTH: 'auth',
  EXCHANGE: 'exchange',
  HERO: 'hero',
  GENERIC: 'generic',
} as const;

// НОВЫЕ константы для animation variants
export const BUTTON_ANIMATIONS = {
  DEFAULT: 'transition-all duration-200',
  HERO_SCALE: 'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
  EXCHANGE_GLOW: 'transition-all duration-200 hover:shadow-lg',
} as const;
```

#### **Этап 2: Создание Enhanced Variant System (packages/ui/src/components/forms/)**

```typescript
// packages/ui/src/components/forms/UnifiedSubmitButton.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from '../ui/button';
import { SUBMIT_BUTTON_CONTEXTS, BUTTON_ANIMATIONS } from '@repo/constants';

// РАСШИРЕНИЕ cva pattern для submit contexts
const submitButtonVariants = cva(
  // Базовые стили наследуются от Button
  '',
  {
    variants: {
      context: {
        auth: 'submit-button', // Стандартный стиль AuthSubmitButton
        exchange: cn('w-full sm:w-auto sm:min-w-[200px]', BUTTON_ANIMATIONS.EXCHANGE_GLOW),
        hero: cn(
          'w-full sm:w-auto sm:min-w-[200px]',
          BUTTON_ANIMATIONS.HERO_SCALE // Сохраняем специфическую анимацию
        ),
        generic: '', // Fallback для других случаев
      },
      // Интеграция с существующими размерами Button
      size: {
        default: '',
        lg: '',
        sm: '',
      },
    },
    defaultVariants: {
      context: 'auth',
      size: 'default',
    },
  }
);

interface UnifiedSubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>>
  extends React.ComponentProps<typeof Button>,
    VariantProps<typeof submitButtonVariants> {
  // BACKWARD COMPATIBILITY с AuthSubmitButton
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;

  // НОВЫЕ возможности
  context?: 'auth' | 'exchange' | 'hero' | 'generic';

  // LEGACY SUPPORT для ExchangeFormAction
  isValid?: boolean; // fallback если form не передан
  children?: React.ReactNode;
}
```

#### **Этап 3: Реализация унифицированной логики**

```typescript
// Продолжение UnifiedSubmitButton.tsx

export const UnifiedSubmitButton = <T extends Record<string, unknown> = Record<string, unknown>>({
  // Props destructuring с сохранением всех существующих API
  form,
  isLoading = false,
  t,
  context = 'auth',
  size = 'default',
  isValid, // legacy fallback
  children,
  className,
  disabled,
  variant = 'default',
  ...buttonProps
}: UnifiedSubmitButtonProps<T>) => {

  // УНИФИЦИРОВАННАЯ валидация (из AuthSubmitButton)
  const getFormValidation = (): boolean => {
    if (form) {
      // Используем проверенную логику из AuthSubmitButton
      return form.isValid && Object.keys(form.errors).length === 0;
    }
    // Fallback для legacy использования (ExchangeFormAction)
    return isValid ?? false;
  };

  const finalIsValid = getFormValidation();
  const finalDisabled = disabled || isLoading || !finalIsValid;

  // КОНТЕКСТНО-ЗАВИСИМЫЙ текст
  const getButtonText = (): React.ReactNode => {
    if (children) return children;

    if (!t) {
      console.warn('UnifiedSubmitButton: t function required for automatic text');
      return 'Submit';
    }

    // Контекстно-зависимые тексты
    switch (context) {
      case 'auth':
        return isLoading ? t('submitting') : t('submit');
      case 'exchange':
      case 'hero':
        return isLoading ? t('submitting') : t('exchange');
      default:
        return isLoading ? t('submitting') : t('submit');
    }
  };

  // РАЗМЕР адаптация для контекста
  const getFinalSize = () => {
    // Hero и Exchange формы предпочитают lg размер
    if ((context === 'hero' || context === 'exchange') && size === 'default') {
      return 'lg';
    }
    return size;
  };

  return (
    <Button
      type="submit"
      variant={variant}
      size={getFinalSize()}
      disabled={finalDisabled}
      className={cn(
        submitButtonVariants({ context, size }),
        className
      )}
      {...buttonProps}
    >
      {getButtonText()}
    </Button>
  );
};

// BACKWARD COMPATIBILITY exports
export { UnifiedSubmitButton as AuthSubmitButton };
export { UnifiedSubmitButton as ExchangeSubmitButton };
export { UnifiedSubmitButton as HeroSubmitButton };
```

#### **Этап 4: Рефакторинг существующих компонентов**

```typescript
// packages/ui/src/components/auth/AuthSubmitButton.tsx
// ЗАМЕНА ПОЛНОЙ РЕАЛИЗАЦИИ на алиас

export { UnifiedSubmitButton as AuthSubmitButton } from '../forms/UnifiedSubmitButton';

// Сохранение типов для backward compatibility
export type { UnifiedSubmitButtonProps as AuthSubmitButtonProps } from '../forms/UnifiedSubmitButton';
```

```tsx
// apps/web/src/components/HeroExchangeForm.tsx
// РЕФАКТОРИНГ ExchangeFormAction

import { UnifiedSubmitButton } from '@repo/ui';

function ExchangeFormAction({ isValid, t }: ExchangeFormActionProps) {
  return (
    <ExchangeForm.ActionArea variant="simple">
      <UnifiedSubmitButton
        context="hero"
        size="lg"
        isValid={isValid}
        t={t}
        className="w-full sm:w-auto sm:min-w-[200px]"
      >
        {t('exchange')}
      </UnifiedSubmitButton>
    </ExchangeForm.ActionArea>
  );
}
```

#### **Этап 5: Интеграция с Compound Patterns**

```typescript
// Обновление AuthForm compound component
// packages/ui/src/lib/auth-helpers.tsx

function addSubmitButtonEnhancement(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  // Автоматическое определение context для UnifiedSubmitButton
  if (!childProps.context && context?.formType) {
    enhancedProps.context = 'auth';
  }

  // Остальная логика enhancement остается той же
  if (shouldEnhanceProp(context?.form, childProps.form)) {
    enhancedProps.form = context?.form;
  }
  // ... existing logic
}
```

#### **Этап 6: Миграционная стратегия**

```typescript
// packages/ui/src/components/index.ts
// ОБНОВЛЕНИЕ экспортов с deprecated warnings

// Новый основной экспорт
export { UnifiedSubmitButton } from './forms/UnifiedSubmitButton';

// Backward compatibility aliases
export {
  UnifiedSubmitButton as AuthSubmitButton,
  UnifiedSubmitButton as ExchangeSubmitButton,
} from './forms/UnifiedSubmitButton';

// Type exports для полной совместимости
export type {
  UnifiedSubmitButtonProps,
  UnifiedSubmitButtonProps as AuthSubmitButtonProps,
  UnifiedSubmitButtonProps as ExchangeSubmitButtonProps,
} from './forms/UnifiedSubmitButton';
```

### 🔧 **Validation & Testing Strategy**

#### **Тестирование backward compatibility:**

```typescript
// packages/ui/src/__tests__/UnifiedSubmitButton.test.tsx

describe('UnifiedSubmitButton Backward Compatibility', () => {
  it('works as AuthSubmitButton replacement', () => {
    const form = createMockForm();
    render(<AuthSubmitButton form={form} t={mockT} />);
    // Тест существующего поведения
  });

  it('works as ExchangeFormAction replacement', () => {
    render(<UnifiedSubmitButton context="hero" isValid={true} t={mockT} />);
    // Тест legacy поведения
  });

  it('supports new unified API', () => {
    const form = createMockForm();
    render(
      <UnifiedSubmitButton
        form={form}
        context="exchange"
        size="lg"
        t={mockT}
      />
    );
    // Тест новых возможностей
  });
});
```

### 🎯 **Результат рефакторинга**

**Архитектурные улучшения:**

- ✅ **DRY Compliance**: Устранение 3 дублирующих реализаций
- ✅ **Enhanced Variant System**: cva-based подход для type-safe вариантов
- ✅ **Backward Compatibility**: 100% совместимость с существующим кодом
- ✅ **Centralized Logic**: Единая точка для всей submit button логики
- ✅ **Context-Aware Behavior**: Автоматическая адаптация к разным формам

**Технические преимущества:**

- ✅ **Type Safety**: Полная типизация с generic constraints
- ✅ **Performance**: Оптимизированный variant system с cva
- ✅ **Maintainability**: Централизованная кодовая база
- ✅ **Extensibility**: Легкое добавление новых контекстов

**Этот план обеспечивает грамотную интеграцию без нарушения существующей архитектуры.**

---

**Помните:** Архитектурная целостность важнее скорости разработки. Правильные архитектурные решения экономят время в долгосрочной перспективе.
