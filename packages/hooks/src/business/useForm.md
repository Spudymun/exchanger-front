# useForm Hook

Универсальный хук для работы с формами с интеграцией Zod валидации.

## Особенности

- ✅ **Безопасность**: Полностью проходит все ESLint security проверки
- ✅ **TypeScript**: Строгая типизация с генериками
- ✅ **Zod интеграция**: Полная поддержка Zod схем валидации
- ✅ **Enhanced hooks pattern**: Следует паттерну проекта
- ✅ **Предустановленные схемы**: Email, password, amount валидация
- ✅ **Оптимизация**: useMemo и useCallback для производительности

## Использование

```typescript
import { useForm, FORM_VALIDATION_SCHEMAS } from '@repo/hooks';
import { z } from 'zod';

// Создание схемы формы
const LoginSchema = z.object({
  email: FORM_VALIDATION_SCHEMAS.email,
  password: FORM_VALIDATION_SCHEMAS.password,
});

type LoginForm = z.infer<typeof LoginSchema>;

// В компоненте
function LoginForm() {
  const form = useForm<LoginForm>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values) => {
      await api.login(values);
    },
    validateOnBlur: true,
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input {...form.getFieldProps('email')} />
      <input {...form.getFieldProps('password')} type="password" />

      {form.errors.email && <div>{form.errors.email}</div>}
      {form.errors.password && <div>{form.errors.password}</div>}

      <button
        type="submit"
        disabled={!form.isValid || form.isSubmitting}
      >
        Войти
      </button>
    </form>
  );
}
```

## API

### Опции

```typescript
interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}
```

### Возвращаемые значения

```typescript
interface UseFormReturn<T> {
  // Состояние
  values: T;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;

  // Методы управления
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  reset: () => void;

  // Валидация
  validateField: <K extends keyof T>(field: K) => boolean;
  validateForm: () => boolean;

  // Интеграция с UI
  getFieldProps: <K extends keyof T>(field: K) => FormField<T[K]>;
  handleSubmit: (event?: React.FormEvent) => Promise<void>;
}
```

## Предустановленные схемы

```typescript
FORM_VALIDATION_SCHEMAS = {
  email: z.string().min(1).max(254).email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/complex-pattern/),
  amount: z.number().min(MIN_ORDER_AMOUNT).max(MAX_ORDER_AMOUNT),
};
```

## Архитектурные решения

- **Безопасность**: Используется `Object.entries()` вместо динамического доступа к свойствам
- **Производительность**: Минимальные ре-рендеры через `useCallback` и `useMemo`
- **Типобезопасность**: Строгая типизация через генерики TypeScript
- **Модульность**: Разделение логики на отдельные функции < 100 строк
