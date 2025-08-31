# Урок 8.4: Обработка ошибок и пользовательский опыт

> **Цель урока**: Изучить как правильно отображать ошибки валидации для создания интуитивно понятного и дружелюбного пользовательского интерфейса

## 📖 Теория

### Психология восприятия ошибок

Ошибки валидации часто становятся точкой фрустрации пользователей. Правильная обработка ошибок превращает негативный опыт в позитивное обучение.

**Принципы хорошего UX ошибок:**

1. **Предотвращение лучше исправления** - помогать избежать ошибок
2. **Немедленная обратная связь** - показывать статус валидации сразу
3. **Понятные сообщения** - объяснять что конкретно не так
4. **Конструктивная помощь** - предлагать как исправить
5. **Прогресс вместо блокировки** - позволять продолжать работу

**Антипаттерны (чего НЕ делать):**

```
❌ "Ошибка валидации" - неинформативно
❌ "Поле обязательно" - не объясняет формат
❌ Красный цвет везде - агрессивно
❌ Блокировка всей формы - фрустрирующе
❌ Технические детали - непонятно пользователю
```

**Хорошие практики:**

```
✅ "Email должен содержать символ @"
✅ "Пароль должен быть не менее 8 символов"
✅ Мягкие цвета для ошибок
✅ Валидация по полям отдельно
✅ Понятные человеческие объяснения
```

### Типы обратной связи в формах

**1. Real-time валидация** - во время ввода

```typescript
// Показываем прогресс, а не только ошибки
const passwordStrength = calculateStrength(password);
// "Слабый → Средний → Сильный"
```

**2. On-blur валидация** - при потере фокуса

```typescript
// Финальная проверка поля после завершения ввода
const isEmailValid = validateEmail(email);
```

**3. Submit валидация** - при отправке формы

```typescript
// Последняя проверка всех полей перед отправкой
const errors = validateFullForm(formData);
```

## 🔍 Анализ кода проекта

### Система локализации ошибок

Рассмотрим как устроены переводы ошибок в `apps/web/messages/ru/AdvancedExchangeForm.json`:

```json
{
  "validation": {
    "email": {
      "required": "Email адрес обязателен",
      "invalid": "Введите корректный email адрес",
      "tooLong": "Email не должен превышать {max} символов"
    },
    "password": {
      "required": "Пароль обязателен",
      "tooShort": "Пароль должен содержать не менее {min} символов",
      "tooLong": "Пароль не должен превышать {max} символов",
      "weak": "Пароль должен содержать заглавные, строчные буквы и цифры"
    },
    "amount": {
      "required": "Укажите сумму",
      "positive": "Сумма должна быть положительной",
      "min": "Минимальная сумма: {min} {currency}",
      "max": "Максимальная сумма: {max} {currency}",
      "precision": "Слишком много знаков после запятой"
    }
  }
}
```

**Принципы локализации:**

1. **Иерархическая структура** - группировка по типам полей
2. **Параметризация** - `{min}`, `{max}`, `{currency}` для динамических значений
3. **Человеческий язык** - понятные объяснения вместо технических терминов
4. **Конструктивность** - что нужно сделать, а не что неправильно

### Handlers валидации

Изучим `packages/utils/src/validation/handlers.ts`:

```typescript
/**
 * EMAIL VALIDATION HANDLER
 */
export function handleEmailValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  const path = issue.path[0];

  if (typeof path === 'string' && path.includes('email')) {
    switch (issue.code) {
      case z.ZodIssueCode.too_small:
        return { message: t('validation.email.required') };
      case z.ZodIssueCode.invalid_string:
        if (issue.validation === 'email') {
          return { message: t('validation.email.invalid') };
        }
        break;
      case z.ZodIssueCode.too_big:
        return {
          message: t('validation.email.tooLong', {
            max: issue.maximum,
          }),
        };
      case z.ZodIssueCode.custom:
        // Security-Enhanced ошибки
        if (issue.message === 'INVALID_CHARACTERS_DETECTED') {
          return { message: t('validation.security.invalidCharacters') };
        }
        break;
    }
  }

  return null;
}

/**
 * AMOUNT VALIDATION HANDLER с бизнес-логикой
 */
export function handleAmountValidation(
  issue: z.ZodIssueOptionalMessage,
  t: NextIntlValidationConfig['t']
): { message: string } | null {
  const path = issue.path[0];

  if (typeof path === 'string' && path.includes('Amount')) {
    // Получаем контекст валидации для бизнес-правил
    const context = getCurrentValidationContext();

    if (context && !context.isValid) {
      // Локализация бизнес-правил
      return {
        message: t(context.localizationKey || 'validation.amount.businessRules', {
          ...context.params,
        }),
      };
    }

    // Стандартная валидация формата
    switch (issue.code) {
      case z.ZodIssueCode.too_small:
        return { message: t('validation.amount.min', { min: issue.minimum }) };
      case z.ZodIssueCode.too_big:
        return { message: t('validation.amount.max', { max: issue.maximum }) };
      case z.ZodIssueCode.invalid_type:
        return { message: t('validation.amount.required') };
    }
  }

  return null;
}
```

**Архитектурные решения:**

1. **Контекстный анализ** - разные сообщения для разных ситуаций
2. **Параметризация** - передача динамических значений в переводы
3. **Бизнес-логика** - специальная обработка для финансовых правил
4. **Security-Enhanced** - особые сообщения для проблем безопасности

### UI компоненты для ошибок

Рассмотрим `packages/ui/src/components/ui/input.tsx`:

```tsx
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, type, label, error, success, hint, ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        {/* Label с правильной связью */}
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
          </Label>
        )}

        {/* Input с состояниями */}
        <Input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            // Базовые стили
            'w-full',
            // Состояние ошибки
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            // Состояние успеха
            success && 'border-green-500 focus:border-green-500 focus:ring-green-500',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {/* Hint - подсказка для пользователя */}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-gray-600">
            {hint}
          </p>
        )}

        {/* Error - сообщение об ошибке */}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
```

**UX решения:**

1. **Accessibility** - правильные ARIA атрибуты и связи
2. **Визуальная обратная связь** - цветовое кодирование состояний
3. **Hint система** - проактивная помощь пользователю
4. **Role="alert"** - экранные читалки озвучивают ошибки
5. **Unique IDs** - правильная связь label ↔ input ↔ error

### Прогрессивная валидация пароля

Изучим компонент прогрессивной валидации из проекта:

```typescript
// PasswordStrengthIndicator.tsx
interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4; // Слабый → Очень сильный
  feedback: string[];
  suggestions: string[];
}

function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];
  const suggestions: string[] = [];

  // Длина
  if (password.length >= 8) {
    score++;
  } else {
    suggestions.push('Используйте не менее 8 символов');
  }

  // Разнообразие символов
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Добавьте заглавные и строчные буквы');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('Добавьте цифры');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Добавьте специальные символы');
  }

  // Позитивная обратная связь
  if (score >= 3) {
    feedback.push('Хороший пароль!');
  }

  return { score: score as any, feedback, suggestions };
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const { score, feedback, suggestions } = calculatePasswordStrength(password);

  const strengthLabels = [
    'Очень слабый',
    'Слабый',
    'Средний',
    'Сильный',
    'Очень сильный'
  ];

  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500'
  ];

  return (
    <div className="space-y-2">
      {/* Визуальный индикатор */}
      <div className="flex space-x-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-2 flex-1 rounded",
              level <= score
                ? strengthColors[score]
                : "bg-gray-200"
            )}
          />
        ))}
      </div>

      {/* Текстовая обратная связь */}
      <div className="text-sm">
        <span className={cn(
          "font-medium",
          score <= 1 ? "text-red-600" :
          score <= 2 ? "text-yellow-600" :
          score <= 3 ? "text-blue-600" : "text-green-600"
        )}>
          {strengthLabels[score]}
        </span>
      </div>

      {/* Конструктивная помощь */}
      {suggestions.length > 0 && (
        <ul className="text-sm text-gray-600 space-y-1">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Позитивная обратная связь */}
      {feedback.length > 0 && (
        <div className="text-sm text-green-600">
          {feedback.join(', ')}
        </div>
      )}
    </div>
  );
}
```

## 💻 Практическое задание

### Задание 1: Анализ UX ошибок

Проанализируйте следующие сообщения об ошибках и улучшите их:

```typescript
// ❌ Плохие сообщения
const badMessages = [
  'Validation failed',
  'Invalid input',
  'Error code: 400',
  'Field required',
  'Wrong format',
];

// TODO: Создайте улучшенные сообщения
const goodMessages = [
  // Ваши варианты здесь
];

// TODO: Объясните почему ваши варианты лучше
```

### Задание 2: Создание компонента обратной связи

Создайте компонент для отображения статуса email адреса:

```typescript
// EmailValidationFeedback.tsx
interface EmailValidationFeedbackProps {
  email: string;
  isValidating: boolean;
  error?: string;
  isAvailable?: boolean;
}

export function EmailValidationFeedback({
  email,
  isValidating,
  error,
  isAvailable
}: EmailValidationFeedbackProps) {
  // TODO: Реализуйте компонент с:
  // 1. Индикатором загрузки при проверке
  // 2. Сообщением об ошибке формата
  // 3. Проверкой доступности email (если нужно)
  // 4. Позитивной обратной связью при успехе
  // 5. Подсказками для исправления

  return (
    <div>
      {/* Ваш код здесь */}
    </div>
  );
}
```

### Задание 3: Мультиуровневая валидация

Создайте систему валидации номера телефона с прогрессивной обратной связью:

```typescript
// PhoneValidation.ts
interface PhoneValidationResult {
  isValid: boolean;
  step: 'format' | 'country' | 'carrier' | 'complete';
  message: string;
  suggestions: string[];
}

export function validatePhoneProgressive(phone: string): PhoneValidationResult {
  // TODO: Реализуйте поэтапную валидацию:
  // 1. Формат (начинается с +380)
  // 2. Длина (корректное количество цифр)
  // 3. Код оператора (Киевстар, Vodafone, lifecell)
  // 4. Полная валидация
  // Возвращайте конструктивную обратную связь на каждом этапе
}
```

## ✅ Проверка знаний

### Теоретические вопросы

1. **Какой принцип лучше для UX ошибок?**
   - a) Показывать все ошибки сразу
   - b) Показывать ошибки по одной
   - c) Предотвращать ошибки, а потом показывать понятно

2. **Когда лучше показывать валидацию?**
   - a) Только при отправке формы
   - b) При каждом нажатии клавиши
   - c) Комбинированный подход по контексту

3. **Что важнее в сообщении об ошибке?**
   - a) Техническая точность
   - b) Понятность пользователю
   - c) Краткость

### Практические задания

1. **Улучшите сообщение:**

   ```
   ❌ "Invalid password"
   ✅ Ваш вариант: _______
   ```

2. **Объясните проблему:**

   ```typescript
   <input type="email" />
   {error && <span style={{color: 'red'}}>{error}</span>}
   ```

3. **Создайте ARIA-разметку** для поля с ошибкой валидации.

## 🔧 Отладка UX проблем

### Проблема 1: Слишком агрессивная валидация

```typescript
// ❌ Проблема: показываем ошибку сразу
const form = useForm({
  mode: 'onChange', // Валидация при каждом символе
});

// Пользователь набирает "j" → "Invalid email"
// Набирает "jo" → "Invalid email"
// Набирает "john@" → "Invalid email"
// Фрустрация!

// ✅ Решение: умная валидация
const form = useForm({
  mode: 'onTouched', // Только после первого взаимодействия
  delayError: 1000, // Задержка перед показом ошибки
});

// Или кастомная логика:
const [showError, setShowError] = useState(false);
const [timer, setTimer] = useState<NodeJS.Timeout>();

const handleChange = (value: string) => {
  // Сбрасываем предыдущий таймер
  if (timer) clearTimeout(timer);

  // Если поле не пустое - запускаем отложенную валидацию
  if (value.length > 0) {
    const newTimer = setTimeout(() => {
      setShowError(true);
    }, 800); // Даем пользователю время набрать
    setTimer(newTimer);
  } else {
    setShowError(false);
  }
};
```

### Проблема 2: Неинформативные ошибки

```typescript
// ❌ Проблема: техническое сообщение
const error = 'Validation failed at path email with code invalid_string';

// ✅ Решение: человеческое объяснение
const getUserFriendlyMessage = (error: ZodError) => {
  const issue = error.issues[0];

  if (issue.path.includes('email') && issue.code === 'invalid_string') {
    return 'Пожалуйста, введите корректный email адрес (например: your@email.com)';
  }

  if (issue.path.includes('password') && issue.code === 'too_small') {
    return `Пароль должен содержать не менее ${issue.minimum} символов. Сейчас: ${issue.actual}`;
  }

  return 'Пожалуйста, проверьте введенные данные';
};
```

### Проблема 3: Потеря контекста при ошибках

```typescript
// ❌ Проблема: пользователь не понимает что исправлять
<form onSubmit={handleSubmit}>
  <input name="email" />
  <input name="password" />
  {generalError && <div>{generalError}</div>}
</form>

// ✅ Решение: контекстные ошибки
<form onSubmit={handleSubmit}>
  <div>
    <input name="email" />
    {errors.email && (
      <div className="error-with-context">
        <Icon name="alert" />
        <span>{errors.email}</span>
        {/* Подсказка для исправления */}
        <button type="button" onClick={showEmailHelp}>
          Как исправить?
        </button>
      </div>
    )}
  </div>
</form>
```

## 🎨 Визуальный дизайн ошибок

### Цветовая схема

```css
/* ❌ Агрессивные цвета */
.error {
  color: #ff0000; /* Ярко-красный */
  border: 2px solid #ff0000;
  background: #ffcccc;
}

/* ✅ Мягкие, но заметные цвета */
.error {
  color: #dc2626; /* Приглушенный красный */
  border: 1px solid #fca5a5; /* Светлый красный */
  background: #fef2f2; /* Очень светлый красный */
}

.success {
  color: #059669; /* Зеленый */
  border: 1px solid #86efac;
  background: #f0fdf4;
}

.warning {
  color: #d97706; /* Оранжевый */
  border: 1px solid #fed7aa;
  background: #fffbeb;
}
```

### Анимации для обратной связи

```css
/* Плавное появление ошибки */
.error-enter {
  opacity: 0;
  transform: translateY(-10px);
}

.error-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.2s ease-out;
}

/* Мягкое покачивание при ошибке */
.field-error {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* Прогресс-бар для сложной валидации */
.validation-progress {
  height: 2px;
  background: #e5e7eb;
  overflow: hidden;
}

.validation-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  transition: width 0.3s ease;
}
```

## 📚 Дополнительные материалы

### UX Research ошибок

- [Form Design Patterns](https://www.smashingmagazine.com/printed-books/form-design-patterns/) - книга о дизайне форм
- [Error Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/) - Nielsen Norman Group
- [Inclusive Form Design](https://www.a11yproject.com/posts/how-to-write-accessible-forms/) - доступность форм

### Психология UX

- [Psychology of Form Design](https://uxdesign.cc/the-psychology-behind-form-design-fd96b1bdce6d)
- [Error Prevention Strategies](https://www.interaction-design.org/literature/article/error-prevention-how-to-avoid-user-errors)

### Технические ресурсы

- [ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [Form Validation UX](https://baymard.com/blog/inline-form-validation)

## 🎯 Резюме урока

В этом уроке вы изучили:

1. **Психологические принципы** обработки ошибок в UI
2. **Архитектуру локализации ошибок** в проекте с next-intl
3. **Систему handlers** для контекстуальной обработки разных типов ошибок
4. **UI компоненты** с правильной accessibility и визуальной обратной связью
5. **Прогрессивную валидацию** для улучшения пользовательского опыта

**Ключевые принципы:**

- **Предотвращение лучше исправления** - помогать избежать ошибок
- **Конструктивная помощь** - объяснять как исправить
- **Контекстуальность** - разные подходы для разных ситуаций
- **Accessibility First** - доступность для всех пользователей

**Следующий урок**: [Урок 8.5: Практика - безопасная форма создания заявки](./lesson-8.5-secure-order-form.md) - применим все изученные принципы для создания полноценной формы обменника валют с максимальной безопасностью и удобством.

---

[← Урок 8.3](./lesson-8.3-form-validation-integration.md) | [Урок 8.5 →](./lesson-8.5-secure-order-form.md)
