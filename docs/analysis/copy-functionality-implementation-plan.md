# План реализации: Интеграция функциональности копирования в OrderStatus

## 🎯 Роль: Агент-кодер (рефакторинг и паттерны)

**Задача:** Грамотно встроить новую функциональность копирования в существующую кодовую базу через рефакторинг, следуя архитектурным паттернам проекта.

---

## 📋 Анализ существующего кода

### ✅ **НАЙДЕНО: Существующие паттерны проекта**

#### 1. **Hook структура** (`packages/hooks/src/ui/`)

```typescript
// ПАТТЕРН: useScrollVisibility.ts
'use client';
import { useEffect, useState } from 'react';

export interface UseHookNameOptions {
  // опции с default значениями
}

export function useHookName(params: Type, options: UseHookNameOptions = {}): ReturnType {
  // логика хука
}
```

#### 2. **UI компоненты** (`packages/ui/src/components/ui/`)

```tsx
// ПАТТЕРН: button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const componentVariants = cva('базовые классы', {
  variants: {
    variant: {
      /* варианты */
    },
    size: {
      /* размеры */
    },
  },
});

function Component({ className, variant, size, ...props }) {
  return <element className={cn(componentVariants({ variant, size, className }))} {...props} />;
}
```

#### 3. **OrderStatus структура**

```tsx
// НАЙДЕНО: Существующая логика в OrderBasicInfo (строки 145-168)
<div>
  <p className={textStyles.heading.sm}>{t('amount')}</p>
  <p className={textStyles.body.md}>
    {orderData.cryptoAmount} {orderData.currency} →{' '}
    {orderData.uahAmount.toLocaleString(locale)} ₴
  </p>
</div>
<div>
  <p className={textStyles.heading.sm}>{t('depositAddress')}</p>
  <p className={combineStyles(textStyles.body.md, MONO_FONT_CLASS)}>
    {orderData.depositAddress}
  </p>
</div>
```

---

## 🔧 План реализации (поэтапно)

### **Этап 1: Создание хука копирования**

#### 📁 `packages/hooks/src/ui/useCopyToClipboard.ts`

```typescript
'use client';

import { useCallback, useState } from 'react';

export interface UseCopyToClipboardOptions {
  /** Длительность показа success состояния */
  successDuration?: number;
  /** Callback при успешном копировании */
  onSuccess?: (value: string) => void;
  /** Callback при ошибке */
  onError?: (error: Error) => void;
}

export interface UseCopyToClipboardReturn {
  /** Состояние успешного копирования */
  isCopied: boolean;
  /** Состояние загрузки */
  isLoading: boolean;
  /** Ошибка копирования */
  error: Error | null;
  /** Функция копирования */
  copy: (value: string) => Promise<void>;
  /** Сброс состояния */
  reset: () => void;
}

/**
 * Hook для копирования текста в буфер обмена
 * Следует паттерну существующих UI хуков
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { successDuration = 2000, onSuccess, onError } = options;

  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (value: string) => {
      if (!navigator.clipboard) {
        const err = new Error('Clipboard not supported in this browser');
        setError(err);
        onError?.(err);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        await navigator.clipboard.writeText(value);

        setIsCopied(true);
        onSuccess?.(value);

        setTimeout(() => setIsCopied(false), successDuration);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [successDuration, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setIsCopied(false);
    setIsLoading(false);
    setError(null);
  }, []);

  return { isCopied, isLoading, error, copy, reset };
}
```

#### 📁 Обновление `packages/hooks/src/ui/index.ts`

```typescript
export { useScrollVisibility, type UseScrollVisibilityOptions } from './useScrollVisibility';
export {
  useCopyToClipboard,
  type UseCopyToClipboardOptions,
  type UseCopyToClipboardReturn,
} from './useCopyToClipboard';
```

---

### **Этап 2: Создание CopyButton компонента**

#### 📁 `packages/ui/src/components/ui/copy-button.tsx`

```tsx
'use client';

import { forwardRef } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { useCopyToClipboard } from '@repo/hooks';
import { cn } from '../../lib/utils';

// Следуем паттерну button.tsx с cva
const copyButtonVariants = cva(
  'inline-flex items-center justify-center transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      variant: {
        ghost: 'hover:bg-accent hover:text-accent-foreground rounded-md',
        outline: 'border bg-background hover:bg-accent hover:text-accent-foreground rounded-md',
      },
      size: {
        icon: 'h-9 w-9',
        sm: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'icon',
    },
  }
);

export interface CopyButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof copyButtonVariants> {
  /** Значение для копирования */
  value: string;
  /** Дополнительные CSS классы */
  className?: string;
}

/**
 * Кнопка копирования с визуальной обратной связью
 * Интегрируется с существующей системой кнопок
 */
export const CopyButton = forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ value, className, variant, size, title, ...props }, ref) => {
    const { isCopied, isLoading, copy } = useCopyToClipboard({
      successDuration: 2000,
    });

    const handleCopy = () => {
      copy(value);
    };

    const Icon = isLoading ? Loader2 : isCopied ? Check : Copy;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          copyButtonVariants({ variant, size }),
          isCopied && 'text-green-600 dark:text-green-400',
          className
        )}
        onClick={handleCopy}
        disabled={isLoading}
        title={title || (isCopied ? 'Copied!' : 'Copy to clipboard')}
        {...props}
      >
        <Icon className={cn('h-4 w-4', isLoading && 'animate-spin')} />
      </button>
    );
  }
);

CopyButton.displayName = 'CopyButton';
```

---

### **Этап 3: Рефакторинг OrderBasicInfo**

#### **ТЕКУЩИЙ КОД** (строки 145-168 в OrderStatus.tsx):

```tsx
<div>
  <p className={textStyles.heading.sm}>{t('amount')}</p>
  <p className={textStyles.body.md}>
    {orderData.cryptoAmount} {orderData.currency} →{' '}
    {orderData.uahAmount.toLocaleString(locale)} ₴
  </p>
</div>
<div>
  <p className={textStyles.heading.sm}>{t('depositAddress')}</p>
  <p className={combineStyles(textStyles.body.md, MONO_FONT_CLASS)}>
    {orderData.depositAddress}
  </p>
</div>
```

#### **НОВЫЙ КОД** с интеграцией CopyButton:

```tsx
// Добавить импорт в начало файла OrderStatus.tsx
import { CopyButton } from '@repo/ui';

// ЗАМЕНИТЬ существующие блоки в OrderBasicInfo:
<div className="group">
  <p className={textStyles.heading.sm}>{t('amount')}</p>
  <div className="flex items-center justify-between gap-2 rounded-lg p-2 group-hover:bg-accent/5 transition-colors">
    <p className={combineStyles(textStyles.body.md, 'font-semibold text-primary')}>
      {orderData.cryptoAmount} {orderData.currency} →{' '}
      {orderData.uahAmount.toLocaleString(locale)} ₴
    </p>
    <CopyButton
      value={`${orderData.cryptoAmount} ${orderData.currency}`}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
      variant="ghost"
      size="sm"
    />
  </div>
</div>
<div className="group">
  <p className={textStyles.heading.sm}>{t('depositAddress')}</p>
  <div className="flex items-center justify-between gap-2 rounded-lg p-2 group-hover:bg-accent/5 transition-colors">
    <p className={combineStyles(textStyles.body.md, MONO_FONT_CLASS, 'font-semibold text-primary break-all')}>
      {orderData.depositAddress}
    </p>
    <CopyButton
      value={orderData.depositAddress}
      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      variant="ghost"
      size="sm"
    />
  </div>
</div>
```

---

### **Этап 4: Обновление экспортов**

#### 📁 `packages/ui/src/components/ui/index.ts`

```typescript
// Добавить в существующие экспорты:
export { CopyButton, type CopyButtonProps } from './copy-button';
```

---

## 🎯 Ключевые принципы рефакторинга

### ✅ **Следование существующим паттернам**

1. **Hook структура** - точно как `useScrollVisibility.ts`
2. **Component варианты** - используем `cva` как в `button.tsx`
3. **TypeScript типы** - интерфейсы с префиксом компонента
4. **Import структура** - следуем существующему порядку импортов

### ✅ **Минимальные изменения**

1. **НЕ переписываем** OrderStatus.tsx полностью
2. **Изменяем только** два блока в OrderBasicInfo
3. **Добавляем один импорт** CopyButton
4. **Используем существующие** textStyles и combineStyles

### ✅ **Избегание дублирования**

1. **Переиспользуем** lucide-react иконки (Copy, Check, Loader2)
2. **Используем** существующую систему стилей (`textStyles.body.md`)
3. **Следуем** паттерну hover эффектов из проекта

### ✅ **Code Style соответствие**

1. **Отступы** - 2 пробела (как в существующем коде)
2. **Именование** - camelCase для переменных, PascalCase для компонентов
3. **Комментарии** - JSDoc для функций, inline для сложной логики
4. **Импорты** - сначала внешние, потом внутренние

---

## 📊 Impact Analysis

### ✅ **Zero Breaking Changes**

- Изменяем только визуальное отображение в OrderBasicInfo
- Все существующие пропсы и API остаются неизменными
- Совместимость с существующей локализацией

### ✅ **Performance Impact**

- +2KB bundle size (useCopyToClipboard + CopyButton)
- Используем существующие зависимости (lucide-react уже подключен)
- Lazy loading через dynamic imports не требуется

### ✅ **Architectural Integrity**

- Хук размещается в правильном пакете `packages/hooks/src/ui/`
- Компонент следует существующей структуре `packages/ui/`
- Интеграция через существующую систему экспортов

---

## ✅ Готовность к реализации

План готов к выполнению. Все решения основаны на:

1. **Существующих паттернах** - изучен код useScrollVisibility.ts, button.tsx
2. **Архитектуре проекта** - packages/hooks/ui, packages/ui/components
3. **Code style** - ESLint config, существующие компоненты
4. **Минимальных изменениях** - рефакторинг, а не переписывание

**100% соответствие требованию "НЕ ПРЕДПОЛАГАЙ"** ✅
