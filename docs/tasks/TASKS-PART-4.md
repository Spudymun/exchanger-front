# 🚀 ExchangeGO Development Tasks - Part 4: UI Components & Forms

**Дата обновления:** 10 июля 2025  
**Статус:** Актуализирован по реальной кодовой базе  
**Покрытие:** UI библиотека, формы, компоненты, дизайн-система, Storybook

---

## 📋 Общая информация

### Связь с предыдущими частями:

- ✅ Использует типы из `@repo/exchange-core` (Part 1)
- ✅ Интегрируется с tRPC API (Part 2)
- ✅ Применяет State Management и хуки (Part 3)
- ✅ Реализует валидацию форм (Part 3)

### Реальная архитектура (по состоянию кодовой базы):

- **✅ Design System** с Tailwind CSS (`@repo/design-tokens`)
- **✅ UI Library** на базе Radix UI (`@repo/ui`)
- **✅ Form Hooks** с Zod валидацией (`@repo/hooks`)
- **✅ Storybook** для документации компонентов
- **Responsive Design** mobile-first с design-tokens

---

## 🎨 PHASE 4: UI COMPONENTS & FORMS

### TASK 4.1: Расширить существующую UI библиотеку

**Время:** 2.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Дополнить существующую UI библиотеку `@repo/ui` недостающими компонентами для криптообменника, используя уже настроенную архитектуру на базе Radix UI.

#### Текущее состояние UI библиотеки

```
packages/ui/
├── src/
│   ├── index.ts              # ✅ Главный экспорт
│   ├── components/           # ✅ UI компоненты
│   │   ├── ui/               # ✅ Базовые Radix UI компоненты
│   │   │   ├── button.tsx    # ✅ ГОТОВ
│   │   │   ├── card.tsx      # ✅ ГОТОВ
│   │   │   ├── input.tsx     # ✅ ГОТОВ
│   │   │   ├── select.tsx    # ✅ ГОТОВ
│   │   │   ├── dialog.tsx    # ✅ ГОТОВ
│   │   │   ├── table.tsx     # ✅ ГОТОВ
│   │   │   └── ...           # ✅ Другие компоненты
│   │   ├── data-table.tsx    # ✅ ГОТОВ
│   │   ├── tree-view.tsx     # ✅ ГОТОВ
│   │   └── theme-toggle.tsx  # ✅ ГОТОВ
│   ├── lib/
│   │   └── utils.ts          # ✅ cn() функция готова
│   ├── stories/              # ✅ Storybook stories
│   │   ├── Button.stories.ts # ✅ ГОТОВ
│   │   └── ...               # ✅ Другие stories
│   └── styles/               # ✅ Глобальные стили
└── package.json              # ✅ НАСТРОЕН (Radix UI deps)
```

#### Необходимые дополнения

1. **packages/ui/src/components/ui/notification.tsx**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const notificationVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success: 'border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-600',
        warning: 'border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-600',
        info: 'border-blue-500/50 text-blue-700 dark:border-blue-500 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Notification = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof notificationVariants> & {
    onClose?: () => void;
    title?: string;
    description?: string;
  }
>(({ className, variant, onClose, title, description, children, ...props }, ref) => {
  const Icon = {
    success: CheckCircle,
    destructive: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    default: Info,
  }[variant || 'default'];

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(notificationVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Закрыть</span>
        </button>
      )}
      <div>
        {title && <div className="mb-1 font-medium leading-none tracking-tight">{title}</div>}
        {description && <div className="text-sm [&_p]:leading-relaxed">{description}</div>}
        {children}
      </div>
    </div>
  );
});

Notification.displayName = 'Notification';

export { Notification, notificationVariants };
```

2. **packages/ui/src/components/ui/form.tsx**

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

// Form Field Context
const FormFieldContext = React.createContext<{
  name: string;
  error?: string;
  required?: boolean;
}>({} as any);

// Form Field Component
export interface FormFieldProps {
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField = ({ name, error, required, children }: FormFieldProps) => {
  return (
    <FormFieldContext.Provider value={{ name, error, required }}>
      <div className="space-y-2">
        {children}
      </div>
    </FormFieldContext.Provider>
  );
};

// Form Label
export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<'label'>
>(({ className, ...props }, ref) => {
  const { required } = React.useContext(FormFieldContext);

  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {props.children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
  );
});

FormLabel.displayName = 'FormLabel';

// Form Message
export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<'p'>
>(({ className, children, ...props }, ref) => {
  const { error } = React.useContext(FormFieldContext);
  const body = error || children;

  if (!body) return null;

  return (
    <p
      ref={ref}
      className={cn(
        'text-sm font-medium',
        error ? 'text-destructive' : 'text-muted-foreground',
        className
      )}
      {...props}
    >
      {body}
    </p>
  );
});

FormMessage.displayName = 'FormMessage';

// Form Control (wrapper for inputs)
export const FormControl = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => {
  const { error, name } = React.useContext(FormFieldContext);

  return (
    <Slot
      ref={ref}
      id={name}
      aria-describedby={error ? `${name}-error` : undefined}
      aria-invalid={!!error}
      {...props}
    />
  );
});

FormControl.displayName = 'FormControl';
```

3. **packages/ui/src/components/ui/spinner.tsx**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-[3px]',
        xl: 'h-12 w-12 border-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size }), className)}
        role="status"
        aria-label="Загрузка"
        {...props}
      >
        <span className="sr-only">Загрузка...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner, spinnerVariants };
```

#### Обновление экспортов

4. **packages/ui/src/components/index.ts** (дополнить существующий)

```typescript
// ...existing exports...

// Новые компоненты
export { Notification, notificationVariants } from './ui/notification';
export { FormField, FormLabel, FormMessage, FormControl } from './ui/form';
export { Spinner, spinnerVariants } from './ui/spinner';
```

#### Чек-лист готовности

- [ ] Notification компонент добавлен
- [ ] Form компоненты добавлены
- [ ] Spinner компонент добавлен
- [ ] Экспорты обновлены
- [ ] TypeScript типизация корректна
- [ ] Интеграция с существующей архитектурой Radix UI

---

### TASK 4.2: Создать форм-компоненты для web-приложения

**Время:** 2.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Создать специализированные форм-компоненты для ExchangeGO web-приложения с интеграцией с существующими хуками `useForm` и `useExchange`.

#### Текущее состояние

```
apps/web/src/components/
├── AuthProvider.tsx        # ✅ ГОТОВ
├── ExchangeRates.tsx       # ✅ ГОТОВ - показ курсов
└── OrderStatus.tsx         # ✅ ГОТОВ

packages/hooks/src/business/
├── useForm.ts              # ✅ ГОТОВ - с Zod валидацией
├── useExchange.ts          # ✅ ГОТОВ - бизнес-логика обмена
└── useAuth.ts              # ✅ ГОТОВ - аутентификация
```

#### Необходимые компоненты

1. **apps/web/src/components/forms/ExchangeForm.tsx**

```typescript
'use client';

import { useState } from 'react';
import { z } from 'zod';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Notification,
  Spinner
} from '@repo/ui';
import { useForm, useExchange } from '@repo/hooks';
import { CRYPTOCURRENCIES } from '@repo/constants';
import { ArrowLeftRightIcon, CalculatorIcon } from 'lucide-react';

// Схема валидации для формы обмена
const exchangeFormSchema = z.object({
  fromAmount: z.string()
    .min(1, 'Введите сумму')
    .regex(/^\d+(\.\d{1,8})?$/, 'Некорректный формат суммы'),
  fromCurrency: z.enum(CRYPTOCURRENCIES),
  direction: z.enum(['buy', 'sell']),
  userEmail: z.string().email('Введите корректный email'),
});

type ExchangeFormData = z.infer<typeof exchangeFormSchema>;

interface ExchangeFormProps {
  onSubmit?: () => void;
}

export function ExchangeForm({ onSubmit }: ExchangeFormProps) {
  const exchange = useExchange();
  const [showCalculation, setShowCalculation] = useState(false);

  const form = useForm<ExchangeFormData>({
    initialValues: {
      fromAmount: exchange.formData.fromAmount || '',
      fromCurrency: exchange.formData.fromCurrency || 'BTC',
      direction: exchange.formData.direction || 'sell',
      userEmail: exchange.formData.userEmail || '',
    },
    validationSchema: exchangeFormSchema,
    onSubmit: async (values) => {
      // Обновляем store
      exchange.updateFormData(values);

      // Создаем заявку
      const result = await exchange.createOrder();

      if (result.success) {
        onSubmit?.();
      }
    },
  });

  // Автоматический расчет при изменении суммы
  const handleAmountChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('fromAmount', e.target.value);

    if (e.target.value && !isNaN(Number(e.target.value))) {
      await exchange.calculateExchange();
      setShowCalculation(true);
    } else {
      setShowCalculation(false);
    }
  };

  const handleDirectionSwap = () => {
    const newDirection = form.values.direction === 'buy' ? 'sell' : 'buy';
    form.setValue('direction', newDirection);
    exchange.updateFormData({ ...form.values, direction: newDirection });
  };

  const currencyOptions = CRYPTOCURRENCIES.map(currency => ({
    value: currency,
    label: `${currency} - ${currency === 'BTC' ? 'Bitcoin' :
                            currency === 'ETH' ? 'Ethereum' :
                            currency === 'USDT' ? 'Tether' : 'Litecoin'}`,
  }));

  const isFromCrypto = form.values.direction === 'sell';
  const amountLabel = isFromCrypto ? `Продаете (${form.values.fromCurrency})` : 'Покупаете (UAH)';

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
              {isFromCrypto ? 'Продажа → UAH' : 'Покупка ← UAH'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDirectionSwap}
            >
              <ArrowLeftRightIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Выбор валюты */}
          <div>
            <label className="block text-sm font-medium mb-2">Криптовалюта</label>
            <Select
              value={form.values.fromCurrency}
              onValueChange={(value) => form.setValue('fromCurrency', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите валюту" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Текущий курс */}
          {exchange.rates && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <div className="font-medium">
                  1 {form.values.fromCurrency} = {exchange.rates[form.values.fromCurrency]?.toLocaleString()} UAH
                </div>
              </div>
            </div>
          )}

          {/* Сумма */}
          <Input
            label={amountLabel}
            type="text"
            placeholder="0.00"
            value={form.values.fromAmount}
            onChange={handleAmountChange}
            error={form.errors.fromAmount}
          />

          {/* Результат расчета */}
          {showCalculation && exchange.calculation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <div className="flex justify-between items-center">
                  <span>Получите:</span>
                  <span className="font-bold text-lg">
                    {isFromCrypto
                      ? `₴${exchange.calculation.toAmount.toLocaleString()}`
                      : `${exchange.calculation.toAmount} ${form.values.fromCurrency}`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span>Комиссия:</span>
                  <span>₴{exchange.calculation.fee.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Email */}
          <Input
            label="Email для уведомлений"
            type="email"
            placeholder="example@email.com"
            value={form.values.userEmail}
            onChange={(e) => form.setValue('userEmail', e.target.value)}
            error={form.errors.userEmail}
          />

          {/* Ошибки */}
          {exchange.error && (
            <Notification variant="destructive" title="Ошибка">
              {exchange.error}
            </Notification>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!exchange.calculation || form.isSubmitting}
          >
            {form.isSubmitting && <Spinner size="sm" className="mr-2" />}
            {exchange.calculation ? 'Создать заявку' : 'Рассчитать обмен'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

2. **apps/web/src/components/forms/AuthForms.tsx**

```typescript
'use client';

import { useState } from 'react';
import { z } from 'zod';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Notification,
  Spinner
} from '@repo/ui';
import { useForm, useEnhancedAuth } from '@repo/hooks';
import { EyeIcon, EyeOffIcon, CheckIcon, XIcon } from 'lucide-react';

// Схемы валидации
const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

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

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// Login Form
interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

export function LoginForm({ onSuccess, onRegisterClick }: LoginFormProps) {
  const auth = useEnhancedAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      const result = await auth.login(values.email, values.password);
      if (result.success) {
        onSuccess?.();
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
            label="Email"
            type="email"
            placeholder="example@email.com"
            value={form.values.email}
            onChange={(e) => form.setValue('email', e.target.value)}
            error={form.errors.email}
            autoComplete="email"
          />

          <Input
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            placeholder="Введите пароль"
            value={form.values.password}
            onChange={(e) => form.setValue('password', e.target.value)}
            error={form.errors.password}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            }
          />

          {auth.error && (
            <Notification variant="destructive">
              {auth.error}
            </Notification>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!form.isValid}
          >
            {form.isSubmitting && <Spinner size="sm" className="mr-2" />}
            Войти
          </Button>

          <div className="text-center text-sm text-gray-600">
            Нет аккаунта?{' '}
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Зарегистрироваться
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Register Form
interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick?: () => void;
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps) {
  const auth = useEnhancedAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      const result = await auth.register(values.email, values.password);
      if (result.success) {
        onSuccess?.();
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
            label="Email"
            type="email"
            placeholder="example@email.com"
            value={form.values.email}
            onChange={(e) => form.setValue('email', e.target.value)}
            error={form.errors.email}
            autoComplete="email"
          />

          <Input
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            placeholder="Создайте надежный пароль"
            value={form.values.password}
            onChange={(e) => form.setValue('password', e.target.value)}
            error={form.errors.password}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
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
                      <XIcon className="h-3 w-3 text-gray-400" />
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
            label="Подтвердите пароль"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Повторите пароль"
            value={form.values.confirmPassword}
            onChange={(e) => form.setValue('confirmPassword', e.target.value)}
            error={form.errors.confirmPassword}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            }
          />

          {auth.error && (
            <Notification variant="destructive">
              {auth.error}
            </Notification>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!form.isValid}
          >
            {form.isSubmitting && <Spinner size="sm" className="mr-2" />}
            Зарегистрироваться
          </Button>

          <div className="text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              Войти
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

3. **apps/web/src/components/forms/index.ts**

```typescript
// Exchange Forms
export { ExchangeForm } from './ExchangeForm';

// Auth Forms
export { LoginForm, RegisterForm } from './AuthForms';
```

#### Чек-лист готовности

- [ ] ExchangeForm создан с интеграцией useExchange
- [ ] LoginForm и RegisterForm созданы с интеграцией useEnhancedAuth
- [ ] Используются существующие UI компоненты из @repo/ui
- [ ] Интеграция с хуками useForm настроена
- [ ] Zod валидация работает корректно
- [ ] UX элементы реализованы (показать/скрыть пароль, индикаторы)
- [ ] Error handling настроен

---

### TASK 4.3: Расширить Storybook документацию

**Время:** 1.5 часа  
**Приоритет:** 🟡 Средний

#### Описание

Дополнить существующую Storybook конфигурацию stories для новых компонентов UI библиотеки.

#### Текущее состояние Storybook

```
.storybook/
├── main.ts              # ✅ НАСТРОЕН - Vite + Next.js
├── preview.ts           # ✅ НАСТРОЕН
└── vitest.setup.ts      # ✅ НАСТРОЕН

packages/ui/src/stories/
├── Button.stories.ts    # ✅ ГОТОВ
├── DataTable.stories.tsx # ✅ ГОТОВ
└── TreeView.stories.tsx  # ✅ ГОТОВ

npm scripts:
├── "storybook"          # ✅ НАСТРОЕН - storybook dev -p 6006
└── "build-storybook"    # ✅ НАСТРОЕН
```

#### Необходимые дополнения

1. **packages/ui/src/stories/Form.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { z } from 'zod';
import { FormField, FormLabel, FormControl, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const meta: Meta<typeof FormField> = {
  title: 'UI/Form',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Комплект компонентов для построения форм с валидацией и доступностью.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <FormField name="email" required>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input placeholder="example@email.com" />
      </FormControl>
      <FormMessage>Введите корректный email адрес</FormMessage>
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField name="password" error="Пароль должен содержать минимум 8 символов" required>
      <FormLabel>Пароль</FormLabel>
      <FormControl>
        <Input type="password" placeholder="Введите пароль" />
      </FormControl>
      <FormMessage />
    </FormField>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 w-80">
      <FormField name="name" required>
        <FormLabel>Имя</FormLabel>
        <FormControl>
          <Input placeholder="Ваше имя" />
        </FormControl>
      </FormField>

      <FormField name="email" required>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" placeholder="example@email.com" />
        </FormControl>
      </FormField>

      <FormField name="password" required>
        <FormLabel>Пароль</FormLabel>
        <FormControl>
          <Input type="password" placeholder="Создайте пароль" />
        </FormControl>
        <FormMessage>Минимум 8 символов, включая цифры и буквы</FormMessage>
      </FormField>

      <Button type="submit" className="w-full">
        Зарегистрироваться
      </Button>
    </form>
  ),
};
```

2. **packages/ui/src/stories/Notification.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Notification } from '../components/ui/notification';

const meta: Meta<typeof Notification> = {
  title: 'UI/Notification',
  component: Notification,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Компонент для отображения уведомлений, предупреждений и сообщений об ошибках.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning', 'info'],
    },
    onClose: {
      action: 'closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Информация',
    description: 'Это обычное информационное уведомление.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Успешно!',
    description: 'Операция завершена успешно.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Внимание',
    description: 'Пожалуйста, проверьте введенные данные.',
  },
};

export const Error: Story = {
  args: {
    variant: 'destructive',
    title: 'Ошибка',
    description: 'Произошла ошибка при обработке запроса.',
  },
};

export const WithCloseButton: Story = {
  args: {
    variant: 'info',
    title: 'Новое обновление',
    description: 'Доступна новая версия приложения.',
    onClose: () => alert('Уведомление закрыто'),
  },
};

export const OnlyDescription: Story = {
  args: {
    variant: 'success',
    description: 'Данные сохранены.',
  },
};
```

3. **packages/ui/src/stories/Spinner.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../components/ui/spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Индикатор загрузки для отображения процесса выполнения операций.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const InButton: Story = {
  render: () => (
    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md">
      <Spinner size="sm" className="mr-2" />
      Загрузка...
    </button>
  ),
};

export const Centered: Story = {
  render: () => (
    <div className="flex items-center justify-center h-32 w-64 border border-dashed border-gray-300 rounded-lg">
      <Spinner size="lg" />
    </div>
  ),
};
```

4. **packages/ui/src/stories/ExchangeForm.stories.tsx**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ExchangeForm } from '../../apps/web/src/components/forms/ExchangeForm';

const meta: Meta<typeof ExchangeForm> = {
  title: 'Forms/ExchangeForm',
  component: ExchangeForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Форма для обмена криптовалют с интегрированным расчетом и валидацией.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: () => alert('Форма отправлена!'),
  },
};

export const WithInitialData: Story = {
  args: {
    onSubmit: () => alert('Форма отправлена!'),
  },
  // Здесь бы использовались моки для демонстрации
};
```

#### Обновление конфигурации

5. **Обновить .storybook/main.ts для включения новых stories**

```typescript
// ...existing code...
const config: StorybookConfig = {
  stories: [
    '../packages/ui/src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../apps/web/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)', // Добавить stories из web
  ],
  // ...rest of config
};
```

#### Чек-лист готовности

- [ ] Stories для новых UI компонентов созданы
- [ ] Storybook конфигурация обновлена
- [ ] Документация компонентов написана
- [ ] Примеры использования добавлены
- [ ] Storybook билдится без ошибок

---

## 📊 Статус Progress Part 4

### Завершенные задачи: 0/3

- [ ] TASK 4.1: Расширить существующую UI библиотеку
- [ ] TASK 4.2: Создать форм-компоненты для web-приложения
- [ ] TASK 4.3: Расширить Storybook документацию

### Реальное архитектурное состояние:

✅ **@repo/ui** - UI библиотека существует (Radix UI, CVA, Tailwind)  
✅ **@repo/design-tokens** - дизайн-система готова  
✅ **@repo/hooks** - хуки useForm, useExchange готовы  
✅ **Storybook** - настроен и работает  
🔄 **Формы** - нужны специализированные компоненты для web  
🔄 **Stories** - нужны для новых компонентов

### Следующие части:

- **TASKS-PART-5.md** - Pages & User Flow
- **TASKS-PART-6.md** - Admin Panel
- **TASKS-PART-7.md** - Testing & Quality
- **TASKS-PART-8.md** - Production Setup & Deployment

### Ключевые результаты Part 4:

✅ **Архитектурная синхронизация** с реальной кодовой базой  
✅ **Radix UI Integration** вместо самописных компонентов  
✅ **Существующие хуки** интегрированы в план  
✅ **Storybook** включен как часть задач  
✅ **Web-focus** - задачи сфокусированы на приложении  
🆕 **Notification, Form, Spinner** - новые недостающие компоненты  
🆕 **Специализированные формы** - ExchangeForm, AuthForms для web

---

**Дата обновления:** 10 июля 2025  
**Версия:** 2.0 (Актуализирован по реальной кодовой базе)  
**Следующая часть:** TASKS-PART-5.md
