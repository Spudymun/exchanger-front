# Acceptance Criteria: Создание НОВОЙ страницы «Обмен USDT (TRC-20) на Банк. карта UAH»

> **СОЗДАНИЕ С НУЛЯ ПОД АРХИТЕКТУРУ ПРОЕКТА**: Критерии приемки для создания полностью новой страницы `/[locale]/exchange` с использованием правильных compound components, CSS Architecture v3.0, mobile-first дизайна и security-enhanced валидации согласно всем архитектурным стандартам проекта.

## 🔄 **Интеграция с обменником:**

**Переход на страницу обмена:**

- С главной страницы через кнопки "Обменять [CRYPTO] → [FIAT]" с предустановленными валютами
- Через навигационное меню `/[locale]/exchange` для общего обменника
- Прямые ссылки с query параметрами:
  - Базовые: `/ru/exchange?from=usdt-trc20&to=uah-card`
  - С банком: `/ru/exchange?from=usdt-trc20&to=uah-card&bank=privatbank`
  - С суммой: `/ru/exchange?from=btc&to=uah-card&bank=monobank&amount=0.01`

**Формирование вариантов обмена:**

- **Send валюты**: `CRYPTOCURRENCIES` ['BTC', 'ETH', 'USDT', 'LTC'] + стандарты токенов для USDT (TRC-20, ERC-20, BEP-20)
- **Receive методы**: UAH банковские карты через `getBanksForCurrency('UAH')` (ПриватБанк, Монобанк, ПУМБ, Ощадбанк)
- **Bank параметры**: конкретные банки в URL (`bank=privatbank`, `bank=monobank`, `bank=pumb`, `bank=oschadbank`)
- **Комбинации**: любая crypto → UAH + метод получения + конкретный банк

**User Story:**\
Как пользователь, я хочу обменять криптовалюту **USDT (TRC-20)** на гривны с выводом на банковскую карту, чтобы получить деньги быстро, безопасно и по актуальному курсу через современный интерфейс с полной мобильной адаптацией.

**Область применения:**\
Создание НОВОЙ страницы `/[locale]/exchange` с полностью функциональной формой обмена, использующей compound components pattern, semantic CSS v3.0, mobile-first approach и все современные архитектурные стандарты проекта.

**Архитектурная основа (NEW implementation):**\

- **Роутинг**: Создание NEW страницы `/[locale]/exchange` с Next.js 15 App Router
  - Поддержка query параметров:
    - `?from=usdt-trc20&to=uah-card` для предустановки валют
    - `?from=btc&to=uah-card&bank=privatbank` для предустановки банка
    - `?from=usdt-trc20&to=uah-card&bank=monobank&amount=100` для полной предустановки
  - Использование `next-intl` routing через `src/i18n/navigation.ts`
  - Генерация metadata для SEO на основе выбранных валют и банка
- **Layout Pattern**: Два-колоночная структура согласно конкурентам (НЕ карточки)
  - Колонка "Отдаете" - cryptocurrency selection и amount input
  - Колонка "Получаете" - bank selection, amount display и card input
  - Responsive layout: vertical stack на mobile, side-by-side на desktop
- **CSS Architecture v3.0**: Centralized System из `@repo/tailwind-preset/globals.css`
  - Single Source of Truth: все переменные в одном файле
  - Semantic classes: `bg-background`, `text-foreground`, `border-border`
  - Auto-import: `@import '@repo/tailwind-preset/globals.css'`
  - Theme Support: автоматическая поддержка light/dark режимов
- **Mobile-First Подход**: Touch-friendly интерфейс согласно Mobile Adaptation Guidelines
  - Minimum touch targets: `min-h-[44px]` для всех интерактивных элементов
  - Responsive breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
  - Typography scaling и spacing patterns из документации
- **Security-Enhanced Validation**: Architecture с Multi-Layer Validation
  - Security-First Consistency: UI и tRPC используют одинаковые security-enhanced схемы
  - Fail-Fast Security: XSS protection на раннем этапе валидации
  - Single Source of Truth: валидация из `@repo/utils/validation-schemas`
- **i18n**: Структурированная локализация через `useTranslations('AdvancedExchangeForm')`
  - Namespace из `/messages/ru.json` с established structure
  - Централизованные переводы для validation errors
- **State Management**: Zustand + React Query integration через `@repo/hooks`
  - Business logic через `useExchange` hook из `@repo/hooks/src/business/`
  - Query patterns для exchange rates и bank data

---

## 1. Page Structure & Layout (NEW Implementation)

- **AC 1.1:** Создание NEW page component `apps/web/app/[locale]/exchange/page.tsx`:
  - Standard HTML form structure согласно конкурентам (НЕ compound components)
  - Main container: `<div className="exchange-container bg-background text-foreground">`
  - Mobile-first layout с responsive breakpoints из `@repo/tailwind-preset`
  - Dynamic metadata generation на основе query params (`from`, `to`, `bank`)
  - Query params обработка: предустановка валют, банка и суммы из URL параметров
- **AC 1.2:** Two-Column Layout Structure (согласно конкурентам):
  - Левая колонка: "Отдаете" - cryptocurrency selection и amount input
  - Правая колонка: "Получаете" - bank selection, calculated amount и card number
  - Responsive: `grid-cols-1 md:grid-cols-2` layout с proper spacing
  - Semantic HTML: sections с descriptive headings и proper form structure
- **AC 1.3:** Responsive Design Standards:
  - Mobile: `min-h-[44px]` для всех touch элементов
  - Tablet: адаптивные grid layouts с `grid-cols-1 md:grid-cols-2`
  - Desktop: оптимизированное пространство с hover эффектами
- **AC 1.4:** Semantic HTML Structure:
  - `<main>` с `role="main"` для accessibility
  - Правильная heading hierarchy (`h1` → `h2` → `h3`)
  - `<form>` с `aria-labelledby` и `aria-describedby`

---

## 2. "Send" Currency Column (NEW Two-Column Implementation)

- **AC 2.1:** Column structure согласно конкурентам:
  ```tsx
  <section className="exchange-give-column">
    <h2>Отдаете</h2>
    {/* Currency selection and amount input */}
  </section>
  ```
- **AC 2.2:** Cryptocurrency Selection (СУЩЕСТВУЮЩИЙ PATTERN):
  - Использование `Select` из `@repo/ui` - **УЖЕ ОТТОЧЕНО**
  - Валюты из `CRYPTOCURRENCIES` constant - **УЖЕ РЕАЛИЗОВАНО**
  - Token standards через `getTokenStandards('USDT')` - **УЖЕ ГОТОВО**
  - Паттерн из ExchangeForm.legacy.tsx:
    ```tsx
    <Select
      value={form.values.currency as string}
      onValueChange={value => form.setValue('currency', value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Выберите валюту" />
      </SelectTrigger>
      <SelectContent>
        {CRYPTOCURRENCIES.map(currency => (
          <SelectItem key={currency} value={currency}>
            {currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    ```
- **AC 2.3:** Exchange Rate Display:
  - Real-time курс через `trpc.exchange.getRate.useQuery(['USDT', 'UAH'])`
  - Отображение: `1 USDT = {rate} UAH` с обновлением каждые 30 секунд
  - Loading skeleton во время загрузки курса
  - Error fallback с retry функциональностью
- **AC 2.4:** Amount Input Field (СУЩЕСТВУЮЩИЙ PATTERN):
  - `Input` component - **УЖЕ ОТТОЧЕН**
  - Type: `number` с mobile `inputMode="decimal"` - **УЖЕ ГОТОВО**
  - Real-time validation через `securityEnhancedSimpleExchangeSchema` - **СУЩЕСТВУЕТ**
  - Паттерн из ExchangeForm.legacy.tsx:
    ```tsx
    <Input
      {...form.getFieldProps('cryptoAmount')}
      type="number"
      placeholder="Введите сумму"
      step="0.00000001"
      min="0"
    />
    ```
- **AC 2.5:** Limits Information:
  - Responsive display: `text-sm text-muted-foreground`
  - Format: `min: {min} USDT • max: {max} USDT`
  - Dynamic обновление based on selected token standard

---

## 3. "Receive" Currency Column (NEW Two-Column Implementation)

- **AC 3.1:** Column structure согласно конкурентам:
  ```tsx
  <section className="exchange-get-column">
    <h2>Получаете</h2>
    {/* Bank selection, amount display and card input */}
  </section>
  ```
- **AC 3.2:** Bank Selection System:
  - `Select` component для банков UAH из `getBanksForCurrency('UAH')`
  - Банки: ПриватБанк, Монобанк, ПУМБ, Ощадбанк с логотипами
  - Bank logos из `bank.logoUrl` с fallback icons
  - Priority sorting: банки с `priority: 1` отображаются первыми
  - Mobile-optimized: `min-h-[44px]` touch targets
- **AC 3.3:** Calculated Amount Display:
  - Real-time calculation: `cryptoAmount * exchangeRate`
  - Read-only input с semantic styling: `bg-muted text-foreground`
  - Format: украинские гривны с 2 decimal places
  - Debounced updates (300ms) для performance
- **AC 3.4:** Bank Limits Information:
  - Dynamic лимиты через `getBankReserve(bankId, 'UAH')`
  - Responsive display: `text-sm text-muted-foreground`
  - Format: `min: {min} UAH • max: {max} UAH`
  - Real-time updates при смене банка
- **AC 3.5:** Column Separation:
  - Clean visual separation между send и receive колонками
  - CSS grid с `gap` для proper spacing
  - Mobile: vertical stack с clear section division

---

## 4. Card Number Input (NEW Enhanced Validation)

- **AC 4.1:** Field Container:
  - `FormField` wrapper с semantic styling: `space-y-2`
  - `FormLabel` с accessibility: `htmlFor="cardNumber"`
  - Mobile-first layout с proper spacing
- **AC 4.2:** Enhanced Input Component:
  - `Input` с auto-formatting: `1234 5678 9012 3456`
  - `inputMode="numeric"` для mobile numeric keyboard
  - `maxLength={19}` with spaces включая formatting
  - Real-time маска только для цифр с автоматическими пробелами
  - Semantic CSS: `bg-input border-input focus:border-ring`
- **AC 4.3:** Security-Enhanced Validation:
  - **NEW Zod Schema Extension**:
    ```ts
    cardNumber: z.string()
      .transform(sanitizeCardNumber) // Remove spaces
      .refine(luhnCheck, 'INVALID_CARD_NUMBER')
      .refine(validateCardBrand, 'UNSUPPORTED_CARD_TYPE')
      .refine(validateCardLength, 'INVALID_CARD_LENGTH');
    ```
  - **Luhn Algorithm**: контрольная сумма validation
  - **BIN Detection**: автоматическое определение Visa/MasterCard/MIR
  - **Length Validation**: Visa (13/16/19), MasterCard (16), MIR (16)
- **AC 4.4:** Visual Feedback System:
  - Payment system icon появляется при valid BIN
  - `FormMessage` для real-time validation errors
  - Success state: `border-green-500 text-green-700`
  - Error state: `border-destructive text-destructive`
  - Loading state во время validation
- **AC 4.5:** NEW Validation Utilities (`@repo/utils/src/validation/`):
  - `sanitizeCardNumber(input: string)`: очистка от пробелов
  - `luhnCheck(number: string): boolean`: Luhn algorithm
  - `getCardBrand(number: string)`: определение типа карты
  - `validateCardLength(cardNumber: string): boolean`: проверка длины для определенного бренда
  - `formatCardNumber(input: string)`: форматирование с пробелами
  - `validateCard(cardNumber: string)`: комплексная валидация с ошибками

---

## 5. Personal Data Section (NEW Form Architecture)

- **AC 5.1:** Section Container:
  - Semantic HTML: `<section aria-labelledby="personal-data-heading">`
  - CSS styling: `bg-muted/50 border border-border rounded-lg p-4`
  - Mobile-first spacing: `space-y-4`
- **AC 5.2:** Email Field (СУЩЕСТВУЮЩИЙ PATTERN):
  - `Input` type="email" - **УЖЕ ОТТОЧЕН**
  - Валидация через `securityEnhancedSimpleExchangeSchema` - **УЖЕ РЕАЛИЗОВАНО**
  - Mobile optimization: `inputMode="email"` - **УЖЕ ГОТОВО**
  - Паттерн из ExchangeForm.legacy.tsx:
    ```tsx
    <Input {...form.getFieldProps('email')} type="email" placeholder="Введите email" />
    ```
- **AC 5.3:** Accessibility Features:
  - `aria-required="true"` для required fields
  - `aria-describedby` linking to validation messages
  - Proper focus management с keyboard navigation
  - Screen reader support с descriptive labels

---

## 6. Security & Verification Section (NEW Implementation)

- **AC 6.1:** Math Captcha Integration:
  - Использование существующего `MathCaptcha` из `@repo/ui/components/ui/math-captcha`
  - Generation двух случайных чисел: `{num1} + {num2} = ?`
  - `Input` для ответа с validation schema:
    ```ts
    captchaAnswer: z.string()
      .min(1, 'CAPTCHA_REQUIRED')
      .refine(validateCaptchaAnswer, 'CAPTCHA_INCORRECT');
    ```
  - Refresh button с новым вызовом: `onClick={generateNewCaptcha}`
  - Mobile-friendly: `inputMode="numeric"` для numeric keyboard
- **AC 6.2:** Terms Agreement Checkbox:
  - **СОЗДАТЬ НОВЫЙ** `Checkbox` компонент в `@repo/ui` с semantic styling
  - Required validation:
    ```ts
    agreeToTerms: z.boolean().refine(val => val === true, 'TERMS_AGREEMENT_REQUIRED');
    ```
  - Text с internal links: "Я согласен с [Правилами сервиса](/tos) и [AML Политикой](/aml)"
  - Mobile: larger touch target `min-h-[44px]`
- **AC 6.3:** Privacy Checkbox (Optional):
  - "Не запоминать данные" для localStorage control
  - Does not affect form validation
  - Influences data persistence behavior
- **AC 6.4:** Security Enhancements:
  - Rate limiting для captcha attempts
  - CSRF protection через tRPC built-in security
  - Input sanitization для всех user inputs

---

## 7. Submit Button & Actions (NEW Enhanced UX)

- **AC 7.1:** Submit Button (СУЩЕСТВУЮЩИЙ PATTERN):
  - `Button` component - **УЖЕ ОТТОЧЕН**
  - Loading states и disabled states - **УЖЕ ГОТОВО**
  - Паттерн из ExchangeForm.legacy.tsx:
    ```tsx
    <Button type="submit" disabled={isLoading || !form.isValid} className="submit-button">
      {isLoading ? 'Создание заявки...' : 'Создать заявку'}
    </Button>
    ```
- **AC 7.2:** Form Validation (СУЩЕСТВУЮЩИЙ PATTERN):
  - `securityEnhancedSimpleExchangeSchema` - **УЖЕ ОТТОЧЕНА**
  - `useFormWithNextIntl` - **СОВРЕМЕННЫЙ ПАТТЕРН**
  - Паттерн из ExchangeForm.legacy.tsx:
    ```tsx
    const form = useFormWithNextIntl<ExchangeFormData>({
      initialValues: { currency: 'BTC', cryptoAmount: '', email: '' },
      validationSchema: securityEnhancedSimpleExchangeSchema,
      t,
      onSubmit: async values => {
        /* обработка */
      },
    });
    ```
- **AC 7.3:** Order Creation Flow:
  - `useExchangeMutation` с enhanced data payload
  - tRPC call: `exchange.createOrder.mutate(formData)`
  - Success: redirect to `/[locale]/order/{orderId}` page
  - Error handling через `useNotifications` toast system
- **AC 7.4:** Submit Button Enhancement:
  - Standard form structure с submit button в конце формы
  - Submit button через standard `Button` component из `@repo/ui`
  - Loading states и disabled states management
  - Visual feedback через существующие UI patterns

---

## 8. State Management & Error Handling (NEW Architecture)

- **AC 8.1:** Loading States Management:
  - **Form submission**: button disabled + loading spinner
  - **Exchange rates**: `Skeleton` components во время загрузки
  - **Bank limits**: loading indicators для dynamic data
  - **Validation**: debounced validation с loading states
  - Global loading state через Zustand store
- **AC 8.2:** Enhanced Error Handling:
  - **Client-side validation**: immediate field-level feedback
  - **Network errors**: retry mechanisms с exponential backoff
  - **API errors**: локализованные сообщения через `useNotifications`
  - **Validation errors**: detailed messages в `FormMessage` components
  - **Fallback UI**: graceful degradation при critical errors
- **AC 8.3:** React Query Integration:
  - **Cache management**: стратегии для exchange rates и bank data
  - **Optimistic updates**: immediate UI feedback
  - **Background refetching**: автоматическое обновление rates
  - **Error boundaries**: component-level error isolation
- **AC 8.4:** Zustand State Architecture:
  - **Exchange store**: form data, selected currencies, amounts
  - **User preferences**: remember card data (if opted-in)
  - **UI state**: loading states, error states, step progress
  - **Cache invalidation**: smart updates при data changes

---

## 9. Mobile-First Design Implementation (NEW Standards)

- **AC 9.1:** Touch-Friendly Interface:
  - **Minimum touch targets**: все interactive elements `min-h-[44px]`
  - **Spacing**: adequate spacing между elements для avoid mis-taps
  - **Button sizing**: full-width buttons на mobile `w-full`
  - **Input fields**: larger input areas с comfortable padding
- **AC 9.2:** Responsive Breakpoints (CSS Architecture v3.0):
  - **Mobile first**: base styles для mobile (< 768px)
  - **Tablet**: `md:` prefix для tablet styles (768px+)
  - **Desktop**: `lg:` prefix для desktop styles (1024px+)
  - **Large desktop**: `xl:` prefix для large screens (1280px+)
- **AC 9.3:** Mobile-Specific Features:
  - **Input modes**: правильные `inputMode` attributes
    - `inputMode="numeric"` для amounts и card numbers
    - `inputMode="email"` для email fields
  - **Virtual keyboard**: optimization для different input types
  - **Swipe gestures**: touch-friendly interactions
- **AC 9.4:** Performance Optimization:
  - **Lazy loading**: images и heavy components
  - **Code splitting**: mobile-specific chunks
  - **Bundle size**: optimization для mobile networks
  - **Progressive enhancement**: core functionality works без JS

---

## 10. Internationalization & SEO (NEW Implementation)

- **AC 10.1:** next-intl Integration:
  - **URL structure**: `/ru/exchange`, `/en/exchange`, `/uk/exchange`
  - **Query params**: `?from=usdt-trc20&to=uah-card` для deep linking
  - **Translation namespace**: `AdvancedExchangeForm` для form content
  - **Dynamic translations**: support для interpolated values
    ```tsx
    t('exchangeRate', { from: 'USDT', to: 'UAH', rate: 41.5 });
    ```
- **AC 10.2:** SEO Optimization:
  - **Dynamic metadata**: based on selected currencies и query params
  - **Structured data**: JSON-LD для financial exchange schema
  - **Open Graph**: social media sharing optimization
  - **Meta descriptions**: localized descriptions для each currency pair
- **AC 10.3:** Translation Structure:
  ```json
  {
    "AdvancedExchangeForm": {
      "title": "Криптовалютный обмен",
      "sending": {
        "title": "Вы отправляете",
        "placeholder": "Введите сумму"
      },
      "receiving": {
        "title": "Вы получаете",
        "cardNumber": "Номер карты"
      },
      "validation": {
        "cardNumber": {
          "invalid": "Неверный номер карты",
          "unsupported": "Неподдерживаемая карта"
        }
      }
    }
  }
  ```
- **AC 10.4:** Accessibility (a11y):
  - **Screen readers**: proper ARIA labels и descriptions
  - **Keyboard navigation**: full functionality без mouse
  - **Focus management**: logical tab order
  - **Color contrast**: WCAG 2.1 AA compliance

---

## 11. Technical Implementation Architecture (NEW Standards)

- **AC 11.1:** File Structure (NEW Clean Architecture):
  ```
  apps/web/app/[locale]/exchange/
  ├── page.tsx                    # Main page component
  ├── layout.tsx                  # Exchange-specific layout
  └── components/
      ├── ExchangeContainer.tsx   # Main container logic
      ├── CurrencyPairSection.tsx # Send/Receive pair
      ├── PersonalDataSection.tsx # User data inputs
      └── SecuritySection.tsx     # Captcha & agreements
  ```
- **AC 11.2:** Component Architecture (Standard Form Pattern):
  - **Standard HTML Form**: обычная form structure согласно конкурентам
  - **Two-Column Layout**: CSS Grid для responsive колонок
  - **Standard Components**: использование базовых `Input`, `Select`, `Button` из `@repo/ui`
  - **Semantic CSS**: применение CSS Architecture v3.0 классов
  - **Form Validation**: integration с `useFormWithNextIntl` для валидации
- **AC 11.3:** TypeScript Architecture:

  ```ts
  // Enhanced form data type
  interface NewExchangeFormData {
    fromCurrency: CryptoCurrency;
    fromTokenStandard: TokenStandard;
    toCurrency: 'UAH';
    cryptoAmount: number;
    uahAmount: number;
    selectedBank: BankId;
    cardNumber: string;
    email: string;
    captchaAnswer: string;
    agreeToTerms: boolean;
    rememberData?: boolean;
  }

  // Enhanced validation schema
  const newExchangeFormSchema = z.object({
    fromCurrency: cryptoCurrencySchema,
    fromTokenStandard: tokenStandardSchema,
    toCurrency: z.literal('UAH'),
    cryptoAmount: enhancedAmountSchema,
    selectedBank: bankSelectionSchema,
    cardNumber: cardValidationSchema,
    email: enhancedEmailSchema,
    captchaAnswer: captchaValidationSchema,
    agreeToTerms: termsAgreementSchema,
  });
  ```

- **AC 11.4:** Performance Architecture:
  - **Bundle splitting**: separate chunks для heavy validation
  - **Lazy loading**: non-critical components lazy loaded
  - **Memoization**: expensive calculations memoized
  - **Debouncing**: user input debounced для API calls
- **AC 11.5:** Security Architecture:
  - **Input sanitization**: all user inputs sanitized
  - **CSRF protection**: built-in tRPC protection
  - **Rate limiting**: API endpoints rate limited
  - **Validation**: multi-layer validation (client + server)

---

## 📚 Architectural Implementation Guide

### Standard Form Components from @repo/ui:

**Basic UI Components (shadcn/ui foundation):**

- `Input` - form inputs с semantic styling
- `Select` - dropdown selection с proper styling
- `Button` - действия и submit с loading states
- `FormField` - field wrapper с validation integration
- `FormLabel` - accessible labels с proper linking
- `FormMessage` - validation error display
- **СОЗДАТЬ НОВЫЙ** `Checkbox` - agreement checkboxes с touch targets

**CSS Architecture v3.0 (Semantic Classes):**

```css
/* Centralized variables from @repo/tailwind-preset/globals.css */
.bg-background        /* Page background */
.text-foreground     /* Primary text color */
.border-border        /* Consistent borders */
.bg-input            /* Input backgrounds */
.text-foreground     /* Primary text */
.text-muted-foreground /* Secondary text */
.bg-primary          /* Primary action color */
.text-primary-foreground /* Primary text */
```

**Mobile-First Responsive Classes:**

```css
/* Base mobile styles */
.min-h-[44px]        /* Touch-friendly minimum height */
.w-full              /* Full width on mobile */
.space-y-4           /* Consistent spacing */

/* Tablet breakpoint (md:) */
.md:grid-cols-2      /* Two-column layout */
.md:space-x-6        /* Horizontal spacing */

/* Desktop breakpoint (lg:) */
.lg:max-w-4xl        /* Maximum width */
.lg:grid-cols-3      /* Three-column layout */
```

### Enhanced Validation Architecture:

**Security-Enhanced Validation Utils (@repo/utils/src/validation/):**

```ts
// Card validation utilities
export const sanitizeCardNumber = (input: string): string => input.replace(/\D/g, '');

export const luhnCheck = (cardNumber: string): boolean => {
  // Luhn algorithm implementation
  const digits = cardNumber.split('').map(Number);
  // ... implementation
};

export const getCardBrand = (cardNumber: string): CardBrand => {
  const bin = cardNumber.slice(0, 6);
  // BIN detection logic
};

export const validateCardLength = (cardNumber: string, brand: CardBrand): boolean => {
  const validLengths = {
    visa: [13, 16, 19],
    mastercard: [16],
    mir: [16],
  };
  return validLengths[brand]?.includes(cardNumber.length) ?? false;
};
```

### State Management Architecture:

**Zustand Store Structure:**

```ts
interface ExchangeStore {
  // Form state
  formData: NewExchangeFormData;
  setFormData: (data: Partial<NewExchangeFormData>) => void;

  // UI state
  isLoading: boolean;
  currentStep: ExchangeStep;
  validationErrors: ValidationErrors;

  // Cache state
  exchangeRates: ExchangeRates;
  bankLimits: BankLimits;

  // Actions
  calculateAmount: (amount: number, rate: number) => number;
  validateForm: () => ValidationResult;
  submitExchange: () => Promise<OrderResult>;
}
```

**React Query Integration:**

```ts
// Exchange rates query
const useExchangeRates = (from: string, to: string) =>
  useQuery({
    queryKey: ['exchange', 'rates', from, to],
    queryFn: () => trpc.exchange.getRate.query({ from, to }),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000,
  });

// Bank limits query
const useBankLimits = (bankId: string, currency: string) =>
  useQuery({
    queryKey: ['banks', 'limits', bankId, currency],
    queryFn: () => trpc.banks.getLimits.query({ bankId, currency }),
    staleTime: 300000, // 5 minutes
  });
```

### Constants & Configuration:

**Enhanced Constants (@repo/constants):**

```ts
// Cryptocurrency constants
export const CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDT', 'LTC'] as const;
export const TOKEN_STANDARDS = {
  USDT: ['ERC-20', 'TRC-20', 'BEP-20'],
  USDC: ['ERC-20', 'BEP-20'],
} as const;

// Bank configuration for UAH
export const UAH_BANKS = [
  {
    id: 'privatbank',
    name: 'ПриватБанк',
    logoUrl: '/banks/privatbank.svg',
    priority: 1,
    isActive: true,
    minAmount: 100,
    maxAmount: 100000,
  },
  // ... other banks
] as const;

// Validation limits
export const VALIDATION_LIMITS = {
  USDT: {
    min: 10,
    max: 50000,
    decimals: 8,
  },
  UAH: {
    min: 400,
    max: 2000000,
    decimals: 2,
  },
} as const;
```

### Internationalization Structure:

**Translation Namespace (messages/ru.json):**

```json
{
  "AdvancedExchangeForm": {
    "title": "Криптовалютный обмен",
    "steps": {
      "selection": "Выбор валют",
      "details": "Детали обмена",
      "confirmation": "Подтверждение"
    },
    "sending": {
      "title": "Вы отправляете",
      "placeholder": "Введите сумму",
      "limits": "Лимиты: {min} - {max} {currency}"
    },
    "receiving": {
      "title": "Вы получаете",
      "cardNumber": "Номер карты",
      "selectBank": "Выберите банк"
    },
    "validation": {
      "cardNumber": {
        "required": "Номер карты обязателен",
        "invalid": "Неверный номер карты",
        "unsupported": "Неподдерживаемая платежная система"
      },
      "captcha": {
        "required": "Решите пример",
        "incorrect": "Неверный ответ"
      },
      "terms": {
        "required": "Необходимо согласие с условиями"
      }
    }
  }
}
```

### Performance Optimization:

**Code Splitting Strategy:**

```ts
// Lazy load heavy validation utilities
const CardValidation = lazy(() => import('./utils/card-validation'));

// Lazy load bank selection component
const BankSelector = lazy(() => import('./components/BankSelector'));

// Lazy load captcha component
const MathCaptcha = lazy(() => import('@repo/ui/components/ui/math-captcha'));
```

**Optimization Techniques:**

- Debounced input validation (300ms)
- Memoized currency calculations
- Optimistic UI updates
- Background data prefetching
- Progressive form loading
