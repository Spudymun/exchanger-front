# 🚀 ExchangeGO Development Tasks - Part 4: UI Components & Forms

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** UI библиотека, формы, компоненты, дизайн-система

---

## 📋 Общая информация

### Связь с предыдущими частями:

- ✅ Использует типы из `@repo/exchange-core` (Part 1)
- ✅ Интегрируется с tRPC API (Part 2)
- ✅ Применяет State Management и хуки (Part 3)
- ✅ Реализует валидацию форм (Part 3)

### Архитектурный подход:

- **Design System** с Tailwind CSS
- **Compound Components** для сложных UI
- **Form Components** с интеграцией валидации
- **Responsive Design** mobile-first

---

## 🎨 PHASE 4: UI COMPONENTS & FORMS

### TASK 4.1: Создать UI библиотеку с дизайн-системой

**Время:** 3 часа  
**Приоритет:** 🔴 Критический

#### Описание

Создать переиспользуемую UI библиотеку с компонентами, основанную на дизайн-токенах и Tailwind CSS.

#### Технические требования

```
packages/ui/
├── src/
│   ├── index.ts              # Главный экспорт
│   ├── components/           # UI компоненты
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── InputGroup.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Notification/
│   │   └── Layout/
│   ├── hooks/                # UI-specific хуки
│   │   ├── useClickOutside.ts
│   │   ├── useKeyboard.ts
│   │   └── useMediaQuery.ts
│   └── utils/                # UI утилиты
│       ├── cn.ts             # classnames utility
│       └── variants.ts       # variant helpers
```

#### Реализация

1. **packages/ui/src/utils/cn.ts**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility для объединения классов с поддержкой Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

2. **packages/ui/src/utils/variants.ts**

```typescript
import { type VariantProps, cva } from 'class-variance-authority';

// Helper для создания вариантов компонентов
export { cva, type VariantProps };

// Общие варианты размеров
export const sizeVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs px-2 py-1',
      sm: 'text-sm px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-6 py-3',
      xl: 'text-lg px-8 py-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// Общие варианты цветов
export const colorVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
  warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
  error: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent hover:bg-gray-100',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
};
```

3. **packages/ui/src/components/Button/Button.tsx**

```typescript
import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
        error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-6',
        xl: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

4. **packages/ui/src/components/Input/Input.tsx**

```typescript
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, error, hint, leftIcon, rightIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    // Устанавливаем variant в error если есть ошибка
    const currentVariant = error ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            className={cn(
              inputVariants({ variant: currentVariant, size, className }),
              leftIcon && 'pl-10',
              (rightIcon || rightElement) && 'pr-10'
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={cn(
              error && errorId,
              hint && hintId
            )}
            {...props}
          />

          {(rightIcon || rightElement) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {rightElement || rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
```

5. **packages/ui/src/components/Input/InputGroup.tsx**

```typescript
import React from 'react';
import { cn } from '../../utils/cn';

interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function InputGroup({ children, className }: InputGroupProps) {
  return (
    <div className={cn('flex', className)}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        return React.cloneElement(child as React.ReactElement<any>, {
          className: cn(
            child.props.className,
            !isFirst && '-ml-px',
            !isFirst && !isLast && 'rounded-none',
            isFirst && !isLast && 'rounded-r-none',
            isLast && !isFirst && 'rounded-l-none'
          ),
        });
      })}
    </div>
  );
}
```

6. **packages/ui/src/components/Select/Select.tsx**

```typescript
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const selectVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-10 px-3',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, label, error, hint, options, placeholder, id, children, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    const currentVariant = error ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            className={cn(
              selectVariants({ variant: currentVariant, size, className }),
              'appearance-none pr-10 cursor-pointer'
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={cn(
              error && errorId,
              hint && hintId
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}

            {children}
          </select>

          <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select, selectVariants };
```

7. **packages/ui/src/components/Card/Card.tsx**

```typescript
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-gray-200 bg-white',
        outlined: 'border-gray-300 bg-white',
        elevated: 'border-gray-200 bg-white shadow-md',
        ghost: 'border-transparent bg-transparent shadow-none',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  )
);

Card.displayName = 'Card';

// Card sub-components
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

8. **packages/ui/src/components/Modal/Modal.tsx**

```typescript
import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { Button } from '../Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'relative w-full bg-white rounded-lg shadow-xl',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-gray-500">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Modal compound components
interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn('p-6 border-b border-gray-200', className)}>
      {children}
    </div>
  );
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex justify-end gap-3 p-6 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}
```

9. **packages/ui/src/hooks/useClickOutside.ts**

```typescript
import React from 'react';

/**
 * Hook для обработки кликов вне элемента
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(handler: () => void) {
  const ref = React.useRef<T>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handler]);

  return ref;
}
```

10. **packages/ui/src/hooks/useMediaQuery.ts**

```typescript
import React from 'react';

/**
 * Hook для работы с media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Предопределенные breakpoints
export const useBreakpoint = () => {
  const isSm = useMediaQuery('(min-width: 640px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const is2Xl = useMediaQuery('(min-width: 1536px)');

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile: !isSm,
    isTablet: isSm && !isLg,
    isDesktop: isLg,
  };
};
```

11. **packages/ui/src/index.ts**

```typescript
// Components
export * from './components/Button';
export * from './components/Input';
export * from './components/Select';
export * from './components/Card';
export * from './components/Modal';

// Hooks
export * from './hooks/useClickOutside';
export * from './hooks/useMediaQuery';

// Utils
export * from './utils/cn';
export * from './utils/variants';
```

12. **packages/ui/package.json**

```json
{
  "name": "@repo/ui",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --external react",
    "dev": "tsup src/index.ts --format esm,cjs --dts --external react --watch",
    "lint": "eslint src/",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/react": "^18.2.61",
    "@types/react-dom": "^18.2.19",
    "eslint": "^8.57.0",
    "react": "^18.2.0",
    "tsup": "^8.0.2",
    "typescript": "^5.3.3"
  },
  "dependencies": {
    "@heroicons/react": "^2.0.18",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

#### Юзкейсы и Edge Cases

1. **Accessibility**
   - ✅ ARIA attributes для всех компонентов
   - ✅ Keyboard navigation поддержка
   - ✅ Focus management в модалках
   - ✅ Screen reader compatibility

2. **Responsive Design**
   - ✅ Mobile-first подход
   - ✅ Breakpoint hooks
   - ✅ Adaptive компоненты
   - ✅ Touch-friendly размеры

3. **Variant System**
   - ✅ Consistent design tokens
   - ✅ Type-safe variants
   - ✅ Customizable themes
   - ✅ Easy extension

4. **Developer Experience**
   - ✅ TypeScript типизация
   - ✅ Compound components
   - ✅ Ref forwarding
   - ✅ Storybook stories

#### Чек-лист готовности

- [ ] Все базовые компоненты созданы
- [ ] TypeScript типизация корректна
- [ ] Accessibility требования выполнены
- [ ] Responsive design работает
- [ ] Variant system настроен
- [ ] Package.json настроен правильно

---

### TASK 4.2: Создать компоненты форм с валидацией

**Время:** 2.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Создать специализированные форм-компоненты для ExchangeGO с интеграцией валидации и бизнес-логики.

#### Реализация

1. **apps/web/src/components/forms/ExchangeForm/ExchangeForm.tsx**

```typescript
import React from 'react';
import { z } from 'zod';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent } from '@repo/ui';
import { useForm } from '~/hooks/useForm';
import { useExchange } from '~/hooks/useExchange';
import { CRYPTOCURRENCIES, CURRENCY_LIMITS } from '@repo/constants';
import { ArrowsUpDownIcon, CalculatorIcon } from '@heroicons/react/24/outline';

// Валидация схема
const exchangeFormSchema = z.object({
  amount: z.string()
    .min(1, 'Введите сумму')
    .regex(/^\d+(\.\d{1,8})?$/, 'Некорректный формат суммы'),
  currency: z.enum(CRYPTOCURRENCIES),
  direction: z.enum(['crypto-to-uah', 'uah-to-crypto']),
  recipientEmail: z.string().email('Введите корректный email'),
});

type ExchangeFormData = z.infer<typeof exchangeFormSchema>;

interface ExchangeFormProps {
  onSubmit?: () => void;
}

export function ExchangeForm({ onSubmit }: ExchangeFormProps) {
  const exchange = useExchange();

  const form = useForm<ExchangeFormData>({
    initialValues: {
      amount: exchange.formData.amount,
      currency: exchange.formData.currency,
      direction: exchange.formData.direction,
      recipientEmail: exchange.formData.recipientEmail,
    },
    validationSchema: exchangeFormSchema,
    onSubmit: async (values) => {
      // Синхронизируем с store
      exchange.updateFormData(values);

      // Рассчитываем обмен
      await exchange.calculateExchange();

      onSubmit?.();
    },
  });

  // Синхронизация с exchange store
  React.useEffect(() => {
    const { amount, currency, direction, recipientEmail } = form.values;
    exchange.updateFormData({ amount, currency, direction, recipientEmail });
  }, [form.values]);

  // Получаем лимиты для текущей валюты
  const currentLimits = CURRENCY_LIMITS[form.values.currency];
  const displayRate = exchange.getDisplayRate();

  // Обработчики
  const handleSwapDirection = () => {
    const newDirection = form.values.direction === 'crypto-to-uah'
      ? 'uah-to-crypto'
      : 'crypto-to-uah';

    form.setValue('direction', newDirection);

    // Если есть расчет, используем полученную сумму
    if (exchange.calculation) {
      const newAmount = form.values.direction === 'crypto-to-uah'
        ? exchange.calculation.uahAmount.toString()
        : exchange.calculation.cryptoAmount.toString();
      form.setValue('amount', newAmount);
    }
  };

  const handleCalculate = async () => {
    if (form.validate()) {
      await exchange.calculateExchange();
    }
  };

  const currencyOptions = CRYPTOCURRENCIES.map(currency => ({
    value: currency,
    label: `${currency} - ${currency === 'BTC' ? 'Bitcoin' :
                            currency === 'ETH' ? 'Ethereum' :
                            currency === 'USDT' ? 'Tether' : 'Litecoin'}`,
  }));

  const isFromCrypto = form.values.direction === 'crypto-to-uah';
  const amountLabel = isFromCrypto ? `Отдаете (${form.values.currency})` : 'Отдаете (UAH)';
  const amountHint = isFromCrypto
    ? `Мин: ${currentLimits.minCrypto}, Макс: ${currentLimits.maxCrypto} ${form.values.currency}`
    : `Мин: ${currentLimits.minUah}, Макс: ${currentLimits.maxUah} UAH`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Обмен криптовалют</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Направление обмена */}
          <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">
              {isFromCrypto ? 'Крипта → UAH' : 'UAH → Крипта'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSwapDirection}
              leftIcon={<ArrowsUpDownIcon className="h-4 w-4" />}
            >
              Поменять
            </Button>
          </div>

          {/* Валюта */}
          <Select
            {...form.getFieldProps('currency')}
            label="Криптовалюта"
            options={currencyOptions}
            error={form.getFieldError('currency')?.message}
          />

          {/* Текущий курс */}
          {displayRate && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <div className="font-medium">{displayRate.formattedRate}</div>
                <div className="text-xs mt-1">{displayRate.formattedCommission}</div>
              </div>
            </div>
          )}

          {/* Сумма */}
          <Input
            {...form.getFieldProps('amount')}
            type="text"
            label={amountLabel}
            placeholder="0.00"
            hint={amountHint}
            error={form.getFieldError('amount')?.message}
            rightElement={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCalculate}
                disabled={exchange.isCalculating}
                loading={exchange.isCalculating}
              >
                <CalculatorIcon className="h-4 w-4" />
              </Button>
            }
          />

          {/* Результат расчета */}
          {exchange.calculation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <div className="flex justify-between items-center">
                  <span>Получите:</span>
                  <span className="font-bold text-lg">
                    {isFromCrypto
                      ? `₴${exchange.calculation.uahAmount.toLocaleString()}`
                      : `${exchange.calculation.cryptoAmount} ${form.values.currency}`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span>Комиссия:</span>
                  <span>₴{exchange.calculation.commissionAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Email получателя */}
          <Input
            {...form.getFieldProps('recipientEmail')}
            type="email"
            label="Email для уведомлений"
            placeholder="example@email.com"
            hint="На этот email будут отправлены детали заявки"
            error={form.getFieldError('recipientEmail')?.message}
          />

          {/* Ошибки */}
          {exchange.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{exchange.error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!exchange.calculation || form.isSubmitting}
            loading={form.isSubmitting}
          >
            {exchange.calculation ? 'Создать заявку' : 'Рассчитать обмен'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

2. **apps/web/src/components/forms/AuthForms/LoginForm.tsx**

```typescript
import React from 'react';
import { z } from 'zod';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@repo/ui';
import { useForm } from '~/hooks/useForm';
import { useAuth } from '~/hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

export function LoginForm({ onSuccess, onRegisterClick, onForgotPasswordClick }: LoginFormProps) {
  const auth = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        await auth.login(values.email, values.password);
        onSuccess?.();
      } catch (error) {
        // Ошибка уже обработана в useAuth
      }
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Вход в систему</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <Input
            {...form.getFieldProps('email')}
            type="email"
            label="Email"
            placeholder="example@email.com"
            error={form.getFieldError('email')?.message}
            autoComplete="email"
          />

          <Input
            {...form.getFieldProps('password')}
            type={showPassword ? 'text' : 'password'}
            label="Пароль"
            placeholder="Введите пароль"
            error={form.getFieldError('password')?.message}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ?
                  <EyeSlashIcon className="h-4 w-4" /> :
                  <EyeIcon className="h-4 w-4" />
                }
              </button>
            }
          />

          {auth.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{auth.error}</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={form.isSubmitting || auth.isLoading}
            disabled={!form.isValid}
          >
            Войти
          </Button>

          <div className="space-y-2 text-center">
            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Забыли пароль?
            </button>

            <div className="text-sm text-gray-600">
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={onRegisterClick}
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

3. **apps/web/src/components/forms/AuthForms/RegisterForm.tsx**

```typescript
import React from 'react';
import { z } from 'zod';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@repo/ui';
import { useForm } from '~/hooks/useForm';
import { useAuth } from '~/hooks/useAuth';
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const registerSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Должна быть заглавная буква')
    .regex(/[a-z]/, 'Должна быть строчная буква')
    .regex(/[0-9]/, 'Должна быть цифра'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const auth = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      try {
        await auth.register(values.email, values.password);
        onSuccess?.();
      } catch (error) {
        // Ошибка уже обработана в useAuth
      }
    },
  });

  // Индикаторы силы пароля
  const passwordRequirements = [
    { test: (pwd: string) => pwd.length >= 8, label: 'Минимум 8 символов' },
    { test: (pwd: string) => /[A-Z]/.test(pwd), label: 'Заглавная буква' },
    { test: (pwd: string) => /[a-z]/.test(pwd), label: 'Строчная буква' },
    { test: (pwd: string) => /[0-9]/.test(pwd), label: 'Цифра' },
  ];

  const password = form.values.password;
  const showPasswordHints = password.length > 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <Input
            {...form.getFieldProps('email')}
            type="email"
            label="Email"
            placeholder="example@email.com"
            error={form.getFieldError('email')?.message}
            autoComplete="email"
          />

          <Input
            {...form.getFieldProps('password')}
            type={showPassword ? 'text' : 'password'}
            label="Пароль"
            placeholder="Создайте надежный пароль"
            error={form.getFieldError('password')?.message}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ?
                  <EyeSlashIcon className="h-4 w-4" /> :
                  <EyeIcon className="h-4 w-4" />
                }
              </button>
            }
          />

          {/* Индикаторы требований к паролю */}
          {showPasswordHints && (
            <div className="space-y-2">
              {passwordRequirements.map((req, index) => {
                const isValid = req.test(password);
                return (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    {isValid ? (
                      <CheckIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={isValid ? 'text-green-600' : 'text-gray-500'}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Input
            {...form.getFieldProps('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            label="Подтвердите пароль"
            placeholder="Повторите пароль"
            error={form.getFieldError('confirmPassword')?.message}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ?
                  <EyeSlashIcon className="h-4 w-4" /> :
                  <EyeIcon className="h-4 w-4" />
                }
              </button>
            }
          />

          {auth.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{auth.error}</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={form.isSubmitting || auth.isLoading}
            disabled={!form.isValid}
          >
            Зарегистрироваться
          </Button>

          <div className="text-center">
            <div className="text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={onLoginClick}
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Войти
              </button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

4. **apps/web/src/components/forms/index.ts**

```typescript
// Exchange Forms
export { ExchangeForm } from './ExchangeForm/ExchangeForm';

// Auth Forms
export { LoginForm } from './AuthForms/LoginForm';
export { RegisterForm } from './AuthForms/RegisterForm';

// Form Components
export { FormField } from './FormField/FormField';
export { FormSection } from './FormSection/FormSection';
```

#### Юзкейсы и Edge Cases

1. **Form Validation**
   - ✅ Real-time валидация с debounce
   - ✅ Server-side ошибки интеграция
   - ✅ Conditional validation rules
   - ✅ Custom validation messages

2. **User Experience**
   - ✅ Password strength indicators
   - ✅ Show/hide password toggle
   - ✅ Auto-calculation в exchange форме
   - ✅ Loading states и disabled states

3. **Accessibility**
   - ✅ Proper form labeling
   - ✅ Error announcements
   - ✅ Keyboard navigation
   - ✅ Focus management

4. **Integration**
   - ✅ Store synchronization
   - ✅ API error handling
   - ✅ Success callbacks
   - ✅ Form reset logic

#### Чек-лист готовности

- [ ] Все формы созданы и типизированы
- [ ] Валидация работает корректно
- [ ] Интеграция с хуками настроена
- [ ] UX элементы реализованы
- [ ] Accessibility проверена
- [ ] Error handling настроен

---

## 📊 Статус Progress Part 4

### Завершенные задачи: 0/2

- [ ] TASK 4.1: Создать UI библиотеку с дизайн-системой
- [ ] TASK 4.2: Создать компоненты форм с валидацией

### Следующие задачи в Part 4:

Часть 4 завершена. Готов к созданию Part 5.

### Следующие части:

- **TASKS-PART-5.md** - Pages & User Flow
- **TASKS-PART-6.md** - Admin Panel
- **TASKS-PART-7.md** - Testing & Quality
- **TASKS-PART-8.md** - Production Setup & Deployment

### Ключевые результаты Part 4:

✅ **UI библиотека** с переиспользуемыми компонентами  
✅ **Design System** на основе Tailwind CSS  
✅ **Form Components** с валидацией и UX  
✅ **Accessibility** во всех компонентах  
✅ **TypeScript типизация** с variance authority  
✅ **Responsive Design** с mobile-first подходом  
✅ **Compound Components** для сложных UI  
✅ **Integration Hooks** для бизнес-логики

---

**Дата создания:** 29 июня 2025  
**Версия:** 1.0  
**Следующая часть:** TASKS-PART-5.md
