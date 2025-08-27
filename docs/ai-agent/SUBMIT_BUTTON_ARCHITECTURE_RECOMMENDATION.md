# 🏗️ Архитектурное решение: Рефакторинг Submit Button Architecture

**Дата создания:** 27 августа 2025  
**Роль:** Агент-архитектор (фокус на целостность архитектуры)  
**Задача:** Оценить архитектурную целостность submit button системы и предложить чистый путь интеграции

---

## 🚨 **КРИТИЧЕСКАЯ АРХИТЕКТУРНАЯ ПРОБЛЕМА**

### **Выявленная проблема:**

```typescript
// ❌ ПРОБЛЕМА: Компонент перерос свое название
AuthSubmitButton({
  submitStyle: 'hero'     // Не auth!
  submitStyle: 'exchange' // Не auth!
  submitStyle: 'auth'     // Только этот auth
})
```

**Нарушение принципа:** Single Responsibility Principle - компонент имеет название от одного домена, но служит нескольким.

---

## 🎯 **Оценка соответствия принципам проекта**

### **Принципы ExchangeGO Architecture:**

✅ **Package-based Monorepo** - централизованные компоненты в packages/ui  
✅ **Compound Components Pattern v2.0** - контекстно-зависимые компоненты  
✅ **TypeScript-first** - строгая типизация  
❌ **Semantic Naming** - **НАРУШЕН!** AuthSubmitButton != универсальный submit button

### **Архитектурная диагностика:**

```typescript
// ТЕКУЩЕЕ СОСТОЯНИЕ (нарушает семантику)
AuthSubmitButton({ submitStyle: 'exchange' }); // Семантическое противоречие

// ЖЕЛАЕМОЕ СОСТОЯНИЕ (семантически корректно)
SubmitButton({ context: 'exchange' });
```

---

## 🏗️ **Предложенный шаблон проектирования**

### **Стратегия: Progressive Enhancement Pattern**

Вместо breaking changes применим **прогрессивную миграцию**:

```typescript
// ЭТАП 1: Создание семантически корректного имени (Aliasing)
export const SubmitButton = AuthSubmitButton;

// ЭТАП 2: Deprecation Warning для AuthSubmitButton
/**
 * @deprecated Используйте SubmitButton. AuthSubmitButton будет удален в v3.0
 */
export const AuthSubmitButton = SubmitButton;

// ЭТАП 3: Миграция пропа submitStyle → context (Breaking Change v3.0)
interface SubmitButtonProps {
  context: 'auth' | 'exchange' | 'hero'; // Более семантично чем submitStyle
}
```

---

## 🚫 **Запрет изобретения велосипедов**

### **✅ ИСПОЛЬЗУЕМ СУЩЕСТВУЮЩЕЕ:**

**Компонент уже универсален:**

- ✅ Поддерживает все нужные контексты через `submitStyle`
- ✅ Интегрирован с `UseFormReturn`
- ✅ Локализация через `t` функцию
- ✅ Type-safe с generics

**НЕ создаем новый компонент!** Исправляем архитектурную семантику существующего.

---

## 🔧 **Определение контрактов и интерфейсов**

### **Новый архитектурный контракт:**

```typescript
// packages/ui/src/components/forms/SubmitButton.tsx
/**
 * Универсальная кнопка отправки форм
 * Поддерживает все типы форм в приложении
 */
export interface SubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>> {
  // Form integration
  form?: UseFormReturn<T>;
  isLoading?: boolean;

  // Localization
  t?: (key: string) => string;

  // Appearance (из button.tsx)
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';

  // Context-specific behavior
  context?: 'auth' | 'exchange' | 'hero'; // ✅ Семантично правильно

  // Legacy compatibility
  isValid?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// Backward compatibility
export interface AuthSubmitButtonProps<T = Record<string, unknown>> extends SubmitButtonProps<T> {
  /** @deprecated Используйте context. submitStyle будет удален в v3.0 */
  submitStyle?: 'auth' | 'exchange' | 'hero';
}
```

### **Миграционная стратегия:**

```typescript
// ЭТАП 1: Создание SubmitButton (v2.1)
export const SubmitButton = <T extends Record<string, unknown>>({
  context = 'auth',
  submitStyle, // legacy support
  ...props
}: SubmitButtonProps<T> & { submitStyle?: string }) => {
  // Поддержка старого API
  const finalContext = context || (submitStyle as any) || 'auth';

  return <InternalSubmitButton context={finalContext} {...props} />;
};

// ЭТАП 2: Deprecation Warning (v2.2)
export const AuthSubmitButton = <T extends Record<string, unknown>>(props: AuthSubmitButtonProps<T>) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'AuthSubmitButton is deprecated. Use SubmitButton with context prop instead. ' +
      'AuthSubmitButton will be removed in v3.0'
    );
  }
  return <SubmitButton {...props} />;
};

// ЭТАП 3: Breaking Change (v3.0)
// Удаление AuthSubmitButton и submitStyle prop
```

---

## 🎯 **Конкретный путь интеграции для Exchange Submit Button**

### **Рекомендуемое решение для Exchange страницы:**

```typescript
// apps/web/src/components/exchange/ExchangeLayout.tsx

import { SubmitButton } from '@repo/ui'; // ✅ Семантически правильное имя

function ExchangeSubmitSection({
  form,
  t
}: {
  form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
  t: (key: string) => string;
}) {
  return (
    <section className="submit-section">
      <ExchangeForm.ActionArea variant="exchange">
        <SubmitButton
          form={form}
          context="exchange"  // ✅ Семантически правильно
          t={t}
          variant="default"
          size="lg"
        />
      </ExchangeForm.ActionArea>
    </section>
  );
}
```

### **Схема взаимодействия:**

```
ExchangeContainer
  └── ExchangeLayout
      └── ExchangeSubmitSection
          └── SubmitButton (context="exchange")
              ├── context → styling
              ├── form → validation
              ├── t → localization
              └── handleSubmit → form submission
```

---

## 📋 **Поэтапный план рефакторинга**

### **Фаза 1: Создание архитектурно корректного API (немедленно)**

1. **Создать SubmitButton.tsx** как семантически правильный компонент
2. **Добавить context prop** вместо submitStyle
3. **Экспортировать SubmitButton** в packages/ui/index.ts
4. **Сохранить полную backward compatibility**

### **Фаза 2: Миграция кода (следующий sprint)**

1. **Заменить AuthSubmitButton → SubmitButton** в новом коде
2. **Добавить deprecation warnings** для AuthSubmitButton
3. **Обновить документацию** и примеры

### **Фаза 3: Breaking changes (major version)**

1. **Удалить AuthSubmitButton**
2. **Удалить submitStyle prop**
3. **Оставить только context prop**

---

## 🔧 **Loading State Management - архитектурное решение**

### **Анализ существующих паттернов:**

```typescript
// packages/hooks/src/client-hooks/useFormWithNextIntl.ts
export interface UseFormReturn<T> {
  isSubmitting: boolean; // ✅ УЖЕ ЕСТЬ!
  // ...другие поля
}
```

**Обнаружено:** `form.isSubmitting` уже доступен в `UseFormReturn`.

### **Интеграция с SubmitButton:**

```typescript
export const SubmitButton = ({ form, isLoading, ...props }) => {
  // Автоматическое определение loading состояния
  const finalIsLoading = isLoading ?? form?.isSubmitting ?? false;

  return (
    <Button
      disabled={finalIsLoading || !isFormValid}
      {...props}
    >
      {finalIsLoading ? t('submitting') : getContextText()}
    </Button>
  );
};
```

**Преимущество:** Компонент автоматически отображает loading состояние из form state.

---

## ✅ **Итоговые рекомендации**

### **Архитектурное решение:**

1. **✅ Создать SubmitButton** - семантически корректное имя
2. **✅ Поддержать context prop** - заменить submitStyle
3. **✅ Сохранить AuthSubmitButton** - backward compatibility
4. **✅ Использовать form.isSubmitting** - для loading state
5. **✅ Интегрировать в ExchangeLayout** - минимальные изменения

### **Преимущества решения:**

- ✅ **Архитектурная целостность**: Правильная семантика компонента
- ✅ **Zero Breaking Changes**: Полная обратная совместимость
- ✅ **DRY Compliance**: Переиспользование существующей логики
- ✅ **Future-Proof**: Готовность к росту системы
- ✅ **Developer Experience**: Интуитивно понятное API

### **Файлы для изменения:**

1. `packages/ui/src/components/forms/SubmitButton.tsx` - новый файл
2. `packages/ui/src/components/index.ts` - добавить экспорт
3. `apps/web/src/components/exchange/ExchangeLayout.tsx` - интегрировать

**Результат:** Архитектурно чистое решение без технического долга и нарушений принципов проекта.

---

# 💻 **ПЛАН РЕАЛИЗАЦИИ - Агент-кодер**

**Дата:** 27 августа 2025  
**Роль:** Агент-кодер (фокус на рефакторинг и паттерны)  
**Задача:** Грамотно встроить SubmitButton в существующую кодовую базу через рефакторинг

---

## 📋 **АНАЛИЗ ТЕКУЩЕГО СОСТОЯНИЯ ПРОЕКТА**

### **✅ Исследованная архитектура проекта:**

**Монорепозиторий на Turborepo:**

- `packages/ui/` - shadcn/ui компоненты с Compound Components Pattern v2.0
- `packages/constants/` - единый источник истины для всех констант
- `packages/hooks/` - Zustand stores + custom hooks с next-intl интеграцией
- `apps/web/` - Next.js 15 App Router с i18n routing

**TypeScript-first подход:**

- Строгая типизация без any/@ts-ignore
- CVA (class-variance-authority) для типизированных стилей
- Zod схемы для runtime validation

**Centralized CSS Architecture v3.0:**

- Все CSS переменные в `packages/tailwind-preset/globals.css`
- Semantic classes: `bg-card`, `text-foreground`, `border-border`
- Zero duplication принцип

### **✅ Существующая submit button инфраструктура:**

**AuthSubmitButton (packages/ui/src/components/auth/AuthSubmitButton.tsx):**

```typescript
interface AuthSubmitButtonProps<T extends Record<string, unknown>> {
  form?: UseFormReturn<T>;
  isLoading?: boolean;
  t?: (key: string) => string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  isValid?: boolean;
  submitStyle?: 'auth' | 'hero' | 'exchange'; // ✅ УЖЕ ПОДДЕРЖИВАЕТ exchange!
  children?: React.ReactNode;
  className?: string;
}
```

**SUBMIT_BUTTON_STYLES константы (packages/constants/src/ui.ts):**

```typescript
export const SUBMIT_BUTTON_STYLES = {
  HERO_ANIMATION: 'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
  EXCHANGE_RESPONSIVE: 'w-full sm:w-auto sm:min-w-[200px]',
  AUTH_STANDARD: 'submit-button',
} as const;
```

**Button компонент (packages/ui/src/components/ui/button.tsx):**

```typescript
// РЕАЛЬНЫЕ варианты из buttonVariants
variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
size: 'default' | 'sm' | 'lg' | 'icon' | 'compact' | 'xs';
```

### **✅ Исследованная целевая среда:**

**ExchangeLayout.tsx (apps/web/src/components/exchange/ExchangeLayout.tsx):**

- Строка 213: `<span className="text-sm text-primary">Submit Button & Actions (Task 2.4)</span>`
- Функция `AdditionalSections` с placeholder для submit button
- Контекст: `form: UseFormReturn<SecurityEnhancedFullExchangeForm>`, `t: (key: string) => string`

**ExchangeContainer.tsx (apps/web/src/components/exchange/ExchangeContainer.tsx):**

- `useFormWithNextIntl<SecurityEnhancedFullExchangeForm>` с `securityEnhancedFullExchangeFormSchema`
- `isValid` calculation: `form.isValid && amount >= limits.minCrypto && calculatedAmount >= 100 && Boolean(selectedBankId)`
- `form.isSubmitting` - автоматически доступен из `UseFormReturn`

**ExchangeForm compound компонент (packages/ui/src/components/exchange-form.tsx):**

- `ExchangeForm.ActionArea` с `variant?: 'simple' | 'separated' | 'prominent'`
- Используется в HeroExchangeForm с `variant="simple"`

---

## 🔧 **ДЕТАЛЬНЫЙ ПЛАН РЕАЛИЗАЦИИ**

### **ЭТАП 1: Создание SubmitButton (Semantic Naming Fix)**

**Цель:** Устранить семантическое противоречие `AuthSubmitButton` для универсального использования.

**1.1 Создать SubmitButton.tsx**

```bash
# Файл: packages/ui/src/components/forms/SubmitButton.tsx
```

**Архитектурный подход:**

- **НЕ дублируем код** - используем AuthSubmitButton как основу
- **Progressive Enhancement Pattern** - сохраняем полную обратную совместимость
- **Context prop** - заменяем `submitStyle` на семантически правильный `context`

**Код компонента:**

```typescript
import React from 'react';
import { UseFormReturn } from '@repo/hooks';
import { AuthSubmitButton, type AuthSubmitButtonProps } from '../auth/AuthSubmitButton';

/**
 * Универсальная кнопка отправки форм - семантически правильное имя
 * Поддерживает все типы форм: auth, exchange, hero
 */
export interface SubmitButtonProps<T extends Record<string, unknown> = Record<string, unknown>> {
  // Form integration
  form?: UseFormReturn<T>;
  isLoading?: boolean;

  // Localization
  t?: (key: string) => string;

  // Appearance (соответствует button.tsx)
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';

  // Context-specific behavior - СЕМАНТИЧЕСКИ ПРАВИЛЬНО
  context?: 'auth' | 'exchange' | 'hero';

  // Legacy compatibility
  isValid?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * SubmitButton - универсальная кнопка отправки форм
 * Внутренне использует AuthSubmitButton для максимальной совместимости
 */
export const SubmitButton = <T extends Record<string, unknown> = Record<string, unknown>>({
  context = 'auth',
  ...props
}: SubmitButtonProps<T>) => {
  // Маппинг context → submitStyle для внутренней совместимости
  const submitStyle = context;

  return (
    <AuthSubmitButton<T>
      submitStyle={submitStyle}
      {...props}
    />
  );
};

// Экспорт типов для TypeScript compatibility
export type { SubmitButtonProps };
```

**1.2 Добавить экспорт в index.ts**

```typescript
// Файл: packages/ui/src/components/index.ts
// Добавить в существующие экспорты:

// ===== SUBMIT BUTTON (SEMANTIC NAMING) =====
export { SubmitButton, type SubmitButtonProps } from './forms/SubmitButton';

// ===== AUTH COMPONENTS (LEGACY COMPATIBILITY) =====
export { AuthSubmitButton, type AuthSubmitButtonProps } from './auth/AuthSubmitButton';
```

### **ЭТАП 2: Интеграция в ExchangeLayout**

**Цель:** Заменить placeholder на рабочий SubmitButton с правильным контекстом.

**2.1 Создать ExchangeSubmitSection компонент**

**Место:** `apps/web/src/components/exchange/ExchangeLayout.tsx`

**Архитектурный подход:**

- **Модифицируем AdditionalSections** - встраиваем в существующую структуру
- **Используем ExchangeForm.ActionArea** - следуем установленному паттерну
- **Применяем `context="exchange"`** - семантически правильно

**Код изменений:**

```typescript
// В существующей функции AdditionalSections заменить:

{/* Submit Section - будет реализовано в task 2.4 */}
<section className="submit-section">
  <div className="placeholder-content h-16 bg-primary/10 border border-dashed border-primary/30 rounded-md flex items-center justify-center">
    <span className="text-sm text-primary">Submit Button & Actions (Task 2.4)</span>
  </div>
</section>

// НА:

{/* Submit Section - РЕАЛИЗОВАНО */}
<section className="submit-section">
  <ExchangeForm.ActionArea variant="separated">
    <SubmitButton
      form={form}
      context="exchange"  // ✅ Семантически правильно
      t={t}
      variant="default"
      size="lg"
    />
  </ExchangeForm.ActionArea>
</section>
```

**2.2 Добавить импорт SubmitButton**

```typescript
// В начало файла ExchangeLayout.tsx добавить:
import { SubmitButton } from '@repo/ui';
```

### **ЭТАП 3: Обновление импортов и типов**

**3.1 Проверить существующие импорты**

- Убедиться что `ExchangeForm` уже импортирован в ExchangeLayout.tsx
- Проверить доступность `UseFormReturn<SecurityEnhancedFullExchangeForm>` типа

**3.2 Валидация типов**

```typescript
// Убедиться что типы совместимы:
form: UseFormReturn<SecurityEnhancedFullExchangeForm>;
SubmitButton<SecurityEnhancedFullExchangeForm>;
```

### **ЭТАП 4: Тестирование и верификация**

**4.1 Build test**

```bash
npm run build
```

**4.2 TypeScript check**

```bash
npm run type-check
```

**4.3 Runtime test**

```bash
npm run dev
# Проверить /exchange страницу
```

**4.4 Функциональная проверка:**

- ✅ SubmitButton отображается корректно
- ✅ `form.isSubmitting` автоматически отображает loading состояние
- ✅ `form.isValid` корректно валидирует форму
- ✅ Локализация через `t` функцию работает
- ✅ Стили `context="exchange"` применяются правильно

---

## 🎯 **АРХИТЕКТУРНЫЕ ПРИНЦИПЫ СОБЛЮДЕНЫ**

### **✅ Модификация существующего кода (не с нуля):**

- Используем AuthSubmitButton как основу
- Расширяем ExchangeLayout.tsx без переписывания
- Встраиваемся в существующий ExchangeForm.ActionArea паттерн

### **✅ Рефакторинг общей логики:**

- SubmitButton как семантически правильная абстракция
- AuthSubmitButton остается для legacy compatibility
- Единая логика submit buttons через переиспользование

### **✅ Соблюдение code style проекта:**

- TypeScript strict mode без any
- Compound Components Pattern v2.0
- CVA типизированные стили
- next-intl локализация

### **✅ Избегание copy-paste:**

- Переиспользуем AuthSubmitButton внутри SubmitButton
- Используем существующие SUBMIT_BUTTON_STYLES константы
- Применяем готовый ExchangeForm.ActionArea

---

## 📁 **ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ**

### **Новые файлы:**

1. `packages/ui/src/components/forms/SubmitButton.tsx` - семантически правильный компонент

### **Модифицируемые файлы:**

1. `packages/ui/src/components/index.ts` - добавить экспорт SubmitButton
2. `apps/web/src/components/exchange/ExchangeLayout.tsx` - заменить placeholder на SubmitButton

### **Затрагиваемые системы:**

- ✅ UI пакет - новый компонент
- ✅ Exchange страница - интеграция submit button
- ✅ TypeScript - типизация компонента
- ✅ Build система - компиляция и экспорт

---

## ⚡ **ОЖИДАЕМЫЙ РЕЗУЛЬТАТ**

### **Немедленные преимущества:**

- ✅ **Семантическая корректность**: SubmitButton для универсального использования
- ✅ **Zero Breaking Changes**: AuthSubmitButton продолжает работать
- ✅ **Working Exchange Submit**: Полностью функциональная кнопка на /exchange странице
- ✅ **Автоматический loading state**: `form.isSubmitting` интеграция
- ✅ **Правильная валидация**: `securityEnhancedFullExchangeFormSchema` поддержка

### **Архитектурные улучшения:**

- ✅ **DRY Compliance**: Единая логика submit buttons
- ✅ **Future-Proof**: Готовность к новым контекстам (admin, operator, etc.)
- ✅ **Developer Experience**: Интуитивное `context="exchange"` API
- ✅ **Centralized Constants**: Использование SUBMIT_BUTTON_STYLES

### **Техническое качество:**

- ✅ **Type Safety**: Полная TypeScript типизация
- ✅ **Performance**: Нет дублирования кода
- ✅ **Maintainability**: Единая точка изменений
- ✅ **Testability**: Совместимость с существующими тестами

**Финальный результат:** Архитектурно чистое решение с семантически правильным именованием, полной обратной совместимостью и готовностью к масштабированию.
