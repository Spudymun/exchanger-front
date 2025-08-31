# Урок 8.3: Интеграция валидации с формами

> **Цель урока**: Изучить как Security-Enhanced схемы интегрируются с React Hook Form и next-intl для создания безопасных и удобных форм

## 📖 Теория

### Современный стек валидации форм

В проекте ExchangeGO используется современный подход к валидации:

```
Пользовательский ввод
        ↓
React Hook Form (управление состоянием)
        ↓
Zod Security-Enhanced схемы (валидация)
        ↓
next-intl error map (локализация ошибок)
        ↓
UI компоненты (отображение ошибок)
```

**Преимущества этого подхода:**

1. **Type Safety** - полная типизация от схемы до UI
2. **Performance** - валидация только при необходимости
3. **Security** - многоуровневая защита на каждом этапе
4. **UX** - локализованные понятные сообщения об ошибках
5. **Maintainability** - единая логика валидации

### React Hook Form + Zod интеграция

Традиционная проблема форм:

```typescript
// ❌ Старый подход: дублирование логики
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const validateEmail = (value: string) => {
  if (!value) return 'Email обязателен';
  if (!value.includes('@')) return 'Неверный формат email';
  return '';
};

const handleSubmit = () => {
  const error = validateEmail(email);
  if (error) {
    setEmailError(error);
    return;
  }
  // Отправка...
};
```

**Современное решение:**

```typescript
// ✅ Новый подход: единая схема для всего
const schema = z.object({
  email: z.string().email('Неверный формат email'),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: '' },
});

// Автоматическая валидация, типизация, обработка ошибок
```

## 🔍 Анализ кода проекта

### Хук useFormWithNextIntl

Рассмотрим `packages/hooks/src/forms/useFormWithNextIntl.ts`:

```typescript
/**
 * Enhanced useForm hook с интеграцией next-intl для валидации
 */
export function useFormWithNextIntl<T extends Record<string, unknown>>({
  initialValues,
  validationSchema,
  t,
  onSubmit,
}: UseFormWithNextIntlProps<T>): UseFormReturn<T> & {
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
} {
  // Создаем error map для локализации ошибок
  const errorMap = createNextIntlZodErrorMap({ t });

  // Инициализация React Hook Form с Zod resolver
  const form = useForm<T>({
    resolver: zodResolver(validationSchema, { errorMap }),
    defaultValues: initialValues,
    mode: 'onChange', // Валидация при изменении
    reValidateMode: 'onChange', // Ре-валидация при изменении
  });

  // Обработчик отправки с error handling
  const handleSubmit = async (e?: React.BaseSyntheticEvent) => {
    e?.preventDefault();

    try {
      const isValid = await form.trigger(); // Принудительная валидация

      if (isValid) {
        const values = form.getValues();
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Здесь можно добавить глобальную обработку ошибок
    }
  };

  return {
    ...form,
    handleSubmit,
  };
}
```

**Ключевые особенности:**

1. **Интеграция с next-intl** - автоматическая локализация ошибок
2. **Mode: onChange** - мгновенная обратная связь пользователю
3. **Error Map** - единая система переводов для всех ошибок
4. **Type Safety** - полная типизация через generics

### Реальный пример: RegisterForm

Изучим `apps/web/src/components/forms/RegisterForm.tsx`:

```typescript
/**
 * Custom hook для логики формы регистрации
 */
function useRegisterForm(onSuccess?: () => void) {
  const { register } = useAuthMutationAdapter();
  const tValidation = useTranslations('AdvancedExchangeForm'); // Переводы для валидации

  const form = useFormWithNextIntl<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      captcha: ''
    },
    validationSchema: fullySecurityEnhancedRegisterSchema, // Security-Enhanced схема
    t: tValidation,
    onSubmit: async (values: RegisterFormData) => {
      try {
        await register.mutateAsync({
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          captcha: values.captcha,
        });
        if (onSuccess) {
          createAuthFormSubmitHandler(onSuccess)();
        }
      } catch (error) {
        createAuthFormErrorHandler()(error);
      }
    },
  });

  return { form, tValidation };
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { form, tValidation } = useRegisterForm(onSuccess);
  const { register } = useAuthMutationAdapter();
  const t = useTranslations('Layout.forms.register'); // Переводы для UI

  return (
    <AuthForm
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      isLoading={register.isPending}
      t={tValidation}
      fieldId={AUTH_FIELD_IDS.REGISTER.EMAIL}
      formType="register"
      defaultErrorStyling="disabled"
    >
      <AuthForm.FormWrapper>
        <AuthForm.FieldWrapper>
          <FormEmailField />
          <AuthPasswordField />
          <AuthConfirmPasswordField />
          <FormCaptchaField />
        </AuthForm.FieldWrapper>
        <AuthForm.ActionsWrapper>
          <AuthSubmitButton />
          <AuthSwitchButton onSwitch={onSwitchToLogin} isLoading={register.isPending}>
            {t('switchToLogin')}
          </AuthSwitchButton>
        </AuthForm.ActionsWrapper>
      </AuthForm.FormWrapper>
    </AuthForm>
  );
}
```

**Архитектурные решения:**

1. **Разделение concerns** - отдельный хук для логики формы
2. **Два типа переводов** - `tValidation` для ошибок, `t` для UI
3. **Переиспользуемые компоненты** - `FormEmailField`, `AuthPasswordField`
4. **Security-Enhanced схема** - `fullySecurityEnhancedRegisterSchema`

### UI компоненты форм

Рассмотрим `packages/ui/src/components/form-fields/FormEmailField.tsx`:

```typescript
'use client';

import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { InputField } from '../ui/input';
import { FormFieldWrapper } from './FormFieldWrapper';

/**
 * Переиспользуемое поле Email с автоматической валидацией
 */
export function FormEmailField() {
  const form = useFormContext(); // Получаем форму из контекста
  const t = useTranslations('Layout.forms'); // Переводы для labels

  return (
    <FormFieldWrapper>
      <InputField
        {...form.register('email')} // Автоматическая регистрация поля
        type="email"
        placeholder={t('email.placeholder')}
        label={t('email.label')}
        error={form.formState.errors.email?.message} // Автоматическое отображение ошибок
        aria-describedby="email-error"
        autoComplete="email"
        disabled={form.formState.isSubmitting}
      />
    </FormFieldWrapper>
  );
}
```

**Принципы компонентов:**

1. **useFormContext** - автоматическое подключение к форме
2. **Автоматическая регистрация** - `{...form.register('fieldName')}`
3. **Автоматические ошибки** - `form.formState.errors.fieldName?.message`
4. **Accessibility** - `aria-describedby`, правильные типы input
5. **UX** - disable во время отправки, автокомплит

## 💻 Практическое задание

### Задание 1: Создание формы с валидацией

Создайте форму для отзыва пользователя:

```typescript
// feedback-form.tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createXSSProtectedStringWithLength } from '@repo/utils';

// TODO: Создайте схему валидации
const feedbackSchema = z.object({
  name: createXSSProtectedStringWithLength(2, 50),
  email: // Используйте xssProtectedEmailSchema
  rating: z.number().min(1).max(5),
  comment: createXSSProtectedStringWithLength(10, 500),
  recommend: z.boolean().optional()
});

type FeedbackData = z.infer<typeof feedbackSchema>;

// TODO: Создайте компонент формы
export function FeedbackForm() {
  const form = useForm<FeedbackData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      rating: 5,
      comment: '',
      recommend: false
    }
  });

  const onSubmit = async (data: FeedbackData) => {
    // TODO: Реализуйте отправку
    console.log('Feedback submitted:', data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* TODO: Добавьте поля формы */}
    </form>
  );
}
```

### Задание 2: Анализ error handling

Изучите как обрабатываются ошибки в `packages/utils/src/validation/handlers.ts`:

```typescript
// Найдите функции:
// 1. handleEmailValidation - как обрабатываются ошибки email?
// 2. handlePasswordValidation - какие проверки пароля?
// 3. handleAmountValidation - как валидируются суммы?

// Вопросы для анализа:
// 1. Почему используются строковые ключи вместо прямого текста?
// 2. Как система определяет какой handler использовать?
// 3. Что происходит если handler не найден?
```

### Задание 3: Создание кастомного поля

Создайте компонент поля для рейтинга звездами:

```typescript
// StarRatingField.tsx
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';

export function StarRatingField({ name }: { name: string }) {
  const form = useFormContext();
  const [hover, setHover] = useState(0);

  // TODO: Реализуйте:
  // 1. Интеграцию с React Hook Form
  // 2. Визуальное отображение звезд
  // 3. Hover эффекты
  // 4. Отображение ошибок валидации
  // 5. Accessibility (keyboard navigation)

  return (
    <div>
      {/* Ваш код здесь */}
    </div>
  );
}
```

## ✅ Проверка знаний

### Теоретические вопросы

1. **Что такое zodResolver в React Hook Form?**
   - a) Функция для создания схем Zod
   - b) Мост между Zod схемами и React Hook Form
   - c) Компонент для отображения ошибок

2. **Зачем нужен useFormContext?**
   - a) Для создания новой формы
   - b) Для доступа к данным формы из дочерних компонентов
   - c) Для валидации полей

3. **Что означает mode: 'onChange' в useForm?**
   - a) Валидация происходит при отправке формы
   - b) Валидация происходит при изменении поля
   - c) Валидация отключена

### Практические задания

1. **Объясните код:**

   ```typescript
   const form = useForm({
     resolver: zodResolver(schema, { errorMap }),
     mode: 'onChange',
   });
   ```

2. **Найдите ошибку:**

   ```typescript
   function MyField() {
     const form = useForm(); // ❌ Что не так?
     return <input {...form.register('name')} />;
   }
   ```

3. **Создайте схему** для поля "Номер телефона" с проверкой украинского формата.

## 🔧 Отладка интеграции форм

### Проблема 1: Ошибки не отображаются

```typescript
// ❌ Проблема: поле не зарегистрировано
function MyField() {
  const form = useFormContext();
  return <input type="text" />; // Нет register!
}

// ✅ Решение
function MyField({ name }: { name: string }) {
  const form = useFormContext();
  return (
    <input
      {...form.register(name)}
      type="text"
    />
  );
}
```

### Проблема 2: Неправильная типизация

```typescript
// ❌ Проблема: потеря типизации
const form = useForm();
form.setValue('unknownField', 'value'); // Нет проверки типов

// ✅ Решение: типизированная форма
interface FormData {
  name: string;
  email: string;
}

const form = useForm<FormData>();
form.setValue('name', 'John'); // ✅ Типизировано
form.setValue('unknown', 'value'); // ❌ TypeScript ошибка
```

### Проблема 3: Асинхронная валидация

```typescript
// ❌ Проблема: блокирующая валидация
const schema = z.string().refine(async val => {
  const exists = await checkUserExists(val);
  return !exists;
});

// ✅ Решение: правильная обработка
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // Не при каждом символе!
});

// Использование
await form.trigger('username'); // Ручной запуск async валидации
```

## 🚀 Продвинутые паттерны

### 1. Условная валидация

```typescript
const conditionalSchema = z
  .object({
    accountType: z.enum(['personal', 'business']),
    taxId: z.string().optional(),
  })
  .refine(
    data => {
      if (data.accountType === 'business') {
        return data.taxId && data.taxId.length > 0;
      }
      return true;
    },
    {
      message: 'Tax ID required for business accounts',
      path: ['taxId'],
    }
  );
```

### 2. Мультишаговые формы

```typescript
const step1Schema = z.object({
  email: xssProtectedEmailSchema,
  phone: z.string(),
});

const step2Schema = z.object({
  name: createXSSProtectedStringWithLength(2, 50),
  address: createXSSProtectedStringWithLength(5, 200),
});

const fullSchema = step1Schema.merge(step2Schema);

function MultiStepForm() {
  const [step, setStep] = useState(1);
  const form = useForm<z.infer<typeof fullSchema>>({
    resolver: zodResolver(step === 1 ? step1Schema : fullSchema),
    mode: 'onChange',
  });

  const nextStep = async () => {
    const isValid = await form.trigger(); // Валидация текущего шага
    if (isValid) setStep(2);
  };
}
```

### 3. Оптимизация производительности

```typescript
// ❌ Медленно: валидация всей формы при каждом изменении
const form = useForm({
  resolver: zodResolver(complexSchema),
  mode: 'onChange',
});

// ✅ Быстрее: ленивая валидация
const form = useForm({
  resolver: zodResolver(complexSchema),
  mode: 'onBlur', // Валидация при потере фокуса
  delayError: 500, // Задержка перед показом ошибки
});

// Еще быстрее: валидация по полям
const validateField = useCallback(
  debounce(async (fieldName: string) => {
    await form.trigger(fieldName);
  }, 300),
  [form]
);
```

## 📚 Дополнительные материалы

### React Hook Form ресурсы

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Performance Guide](https://react-hook-form.com/advanced-usage#PerformanceOptimization)
- [TypeScript Support](https://react-hook-form.com/ts)

### Zod Resolver

- [@hookform/resolvers Zod](https://github.com/react-hook-form/resolvers#zod)
- [Zod Error Mapping](https://github.com/colinhacks/zod#custom-error-map)

### Accessibility в формах

- [ARIA Form Practices](https://www.w3.org/WAI/ARIA/apg/patterns/form/)
- [Form Validation UX](https://uxdesign.cc/form-validation-best-practices-8e3bec7d0549)

## 🎯 Резюме урока

В этом уроке вы изучили:

1. **Современную архитектуру валидации форм** с React Hook Form + Zod + next-intl
2. **Хук useFormWithNextIntl** - центральную интеграцию всех технологий
3. **Переиспользуемые компоненты полей** с автоматической валидацией
4. **Паттерны обработки ошибок** и интеграции с UI
5. **Продвинутые техники** для сложных форм

**Ключевые принципы:**

- **Single Source of Truth** - схема Zod определяет все
- **Автоматическая интеграция** - минимум boilerplate кода
- **Type Safety** - полная типизация от схемы до UI
- **Performance** - оптимизированная валидация

**Следующий урок**: [Урок 8.4: Обработка ошибок и пользовательский опыт](./lesson-8.4-error-handling-ux.md) - изучим как правильно отображать ошибки валидации для максимально удобного пользовательского опыта.

---

[← Урок 8.2](./lesson-8.2-security-enhanced-schemas.md) | [Урок 8.4 →](./lesson-8.4-error-handling-ux.md)
