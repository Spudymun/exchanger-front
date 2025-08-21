# 📋 TASK 2.3: 🎯 ЗАПОЛНЕНИЕ ПОЛЕЙ - Personal Data & Security Section

> **Фактический статус**: 🎯 **ГОТОВ К РЕАЛИЗАЦИИ** - секции созданы, нужно заполнить placeholder-ы реальными полями.  
> **Цель**: Заменить placeholder контент в секциях "Персональные данные" и "Безопасность" на реальные поля email, captcha и согласий.

## 🎯 **Фактическое состояние - основано на скриншоте**

### ✅ Что УЖЕ ЕСТЬ (основа Task 2.1):

- ✅ **Секция "Персональные данные"** - создана с placeholder "Personal Data Form (Task 2.3)"
- ✅ **Секция "Безопасность"** - создана с placeholder "Security & Verification (Task 2.3)"
- ✅ **ExchangeFormData типы** - уже содержат поля email, captchaAnswer, agreeToTerms, rememberData
- ✅ **Validation schema** - securityEnhancedAdvancedExchangeFormSchema включает все необходимые проверки
- ✅ **UI Components** - Input, Checkbox, MathCaptcha из @repo/ui готовы к использованию

### 🎯 Что нужно ЗАМЕНИТЬ в Task 2.3:

**В секции "Персональные данные" заменить:**

```tsx
// ЗАМЕНИТЬ ЭТО:
<div className="placeholder-content h-24 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
  <span className="text-sm text-muted-foreground">Personal Data Form (Task 2.3)</span>
</div>

// НА РЕАЛЬНЫЕ ПОЛЯ:
<div className="personal-data-form space-y-4">
  <Input name="email" type="email" placeholder="example@email.com" required />
</div>
```

**В секции "Безопасность" заменить:**

```tsx
// ЗАМЕНИТЬ ЭТО:
<div className="placeholder-content h-32 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
  <span className="text-sm text-muted-foreground">Security & Verification (Task 2.3)</span>
</div>

// НА РЕАЛЬНЫЕ ПОЛЯ:
<div className="security-form space-y-4">
  <MathCaptcha name="captchaAnswer" />
  <Checkbox name="agreeToTerms" required />
  <Checkbox name="rememberData" />
</div>
```

## 🎯 **Scope Definition - ОБНОВЛЕНО НА ОСНОВЕ ТЕКУЩЕГО СОСТОЯНИЯ**

### ✅ Что уже реализовано и НЕ нужно создавать:

- **ExchangeLayout.tsx** ✅ УЖЕ ИМЕЕТ структуру для personal data секций
- **Form Validation** ✅ `securityEnhancedAdvancedExchangeFormSchema` УЖЕ ВКЛЮЧАЕТ email, captcha, agreements
- **ExchangeFormData** ✅ УЖЕ СОДЕРЖИТ поля: email, captchaAnswer, agreeToTerms, rememberData
- **useFormWithNextIntl** ✅ УЖЕ ИНТЕГРИРОВАН с валидацией
- **UI Components** ✅ Input, Checkbox, MathCaptcha из `@repo/ui` ГОТОВЫ

### 🎯 Что нужно доработать в Task 2.3:

- **Email Field Integration** - добавить поле email в ExchangeLayout
- **Card Validation Enhancement** - улучшить валидацию cardNumber поля
- **Captcha Integration** - добавить MathCaptcha компонент
- **Agreement Checkboxes** - добавить согласия и privacy настройки
- **Security Validation** - интегрировать проверки в useExchange

### Интеграция с существующими системами - ОБНОВЛЕНО:

- **Validation** ✅ `securityEnhancedEmailSchema` из `@repo/utils` УЖЕ ПРИМЕНЯЕТСЯ
- **MathCaptcha** ✅ Компонент из `@repo/ui` ГОТОВ к использованию
- **Form State** ✅ ExchangeFormData поддерживает все необходимые поля
- **Business Logic** ✅ useExchange хук содержит validateForm функцию
- **Card Validation** 🎯 ТРЕБУЕТСЯ добавить Luhn algorithm проверку

## 📐 **Technical Implementation Plan - ОБНОВЛЕН**

### 🔧 **Добавить Email поле в ExchangeLayout.tsx**:

```tsx
// В ReceivingSection после cardNumber:
<ExchangeForm.FieldWrapper>
  <label>{t('receiving.email')}</label>
  <Input
    name="email"
    type="email"
    placeholder={t('receiving.email.placeholder')}
    autoComplete="email"
  />
</ExchangeForm.FieldWrapper>
```

### 🔧 **Добавить Security секцию в ExchangeLayout.tsx**:

```tsx
// После ExchangeForm.CardPair добавить:
<ExchangeForm.ActionArea>
  {/* Math Captcha */}
  <ExchangeForm.FieldWrapper>
    <label>{t('security.captcha')}</label>
    <MathCaptcha name="captchaAnswer" placeholder={t('security.captcha.placeholder')} />
  </ExchangeForm.FieldWrapper>

  {/* Agreement Checkboxes */}
  <ExchangeForm.FieldWrapper>
    <Checkbox name="agreeToTerms" required label={t('security.terms.agreement')} />
  </ExchangeForm.FieldWrapper>

  <ExchangeForm.FieldWrapper>
    <Checkbox name="rememberData" label={t('security.privacy.remember')} />
  </ExchangeForm.FieldWrapper>
</ExchangeForm.ActionArea>
```

### 🔧 **Улучшить валидацию cardNumber поля**:

````tsx
// В ReceivingSection улучшить cardNumber:
<ExchangeForm.FieldWrapper>
  <label>{t('receiving.cardNumber')}</label>
  <Input
    name="cardNumber"
    placeholder="**** **** **** ****"
    mask="9999 9999 9999 9999"
    validate={validateLuhnCardNumber}
    autoComplete="cc-number"
  />
</ExchangeForm.FieldWrapper>

// Добавить функцию валидации:
const validateLuhnCardNumber = (value: string) => {
  const cleaned = value.replace(/\s/g, '');
  return luhnCheck(cleaned) ? null : t('validation.cardNumber.invalid');
};
### 🔧 **Создать utility для валидации карт**:

```tsx
// utils/cardValidation.ts - создать новый файл
export function luhnCheck(cardNumber: string): boolean {
  const arr = cardNumber
    .split('')
    .reverse()
    .map(x => parseInt(x));

  const lastDigit = arr.splice(0, 1)[0];
  let sum = arr.reduce((acc, val, i) => {
    return i % 2 !== 0 ? acc + val : acc + ((val *= 2) > 9 ? val - 9 : val);
  }, 0);

  sum += lastDigit;
  return sum % 10 === 0;
}

export function detectCardType(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';

  return 'Unknown';
}
````

### 🎯 **Конкретные шаги для реализации Task 2.3**:

#### 1. **Добавить localization в ru.json**:

```json
// apps/web/messages/ru.json - добавить в AdvancedExchangeForm:
"receiving": {
  "email": "Email для уведомлений",
  "email.placeholder": "example@email.com"
},
"security": {
  "captcha": "Решите пример",
  "captcha.placeholder": "Введите ответ",
  "terms": {
    "agreement": "Согласен с условиями обмена"
  },
  "privacy": {
    "remember": "Запомнить данные для следующего обмена"
  }
},
"validation": {
  "cardNumber": {
    "invalid": "Неверный номер карты"
  }
}
```

#### 2. **Интегрировать с ExchangeContainer.tsx**:

```tsx
// В ExchangeContainer.tsx добавить:
import { validateForm } from '@repo/hooks/src/business/useExchange';

// Передать валидацию в form:
const form = useFormWithNextIntl<ExchangeFormData>({
  defaultValues: parseInitialFormData(initialParams),
  validationSchema: securityEnhancedAdvancedExchangeFormSchema,
  t,
  customValidation: {
    cardNumber: validateLuhnCardNumber,
  },
  onSubmit: async (values) => {
    const validation = validateForm();
    if (validation.isValid) {
      // Proceed to submission - Task 2.4
    }
  },
});
## ✅ **Success Metrics - ОБНОВЛЕНО**

### ✅ Что уже работает:
- ExchangeFormData поддерживает поля: email, captchaAnswer, agreeToTerms, rememberData
- securityEnhancedAdvancedExchangeFormSchema включает все необходимые валидации
- MathCaptcha, Input, Checkbox компоненты готовы в @repo/ui
- useFormWithNextIntl интегрирован с валидацией

### 🎯 Что нужно добавить:
- [ ] Email поле в ReceivingSection ExchangeLayout.tsx
- [ ] MathCaptcha в ExchangeForm.ActionArea
- [ ] Checkbox поля для согласий в ActionArea
- [ ] Luhn algorithm валидация для cardNumber
- [ ] Локализация security секции в ru.json
- [ ] Интеграция с validateForm из useExchange

### 📋 **Конкретные файлы для обновления**:

1. **ExchangeLayout.tsx** - добавить email поле и security секцию
2. **utils/cardValidation.ts** - создать с luhnCheck функцией
3. **apps/web/messages/ru.json** - добавить security переводы
4. **ExchangeContainer.tsx** - интегрировать кастомную валидацию

---

**Статус**: ✅ СХЕМА ГОТОВА, требует реализации полей
**Зависимости**: Task 2.2 (в процессе) ✅
**Следующий шаг**: Добавить поля в существующий ExchangeLayout

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];

    if (alternate) {
      digit *= 2;
      if (digit > 9) digit = (digit % 10) + 1;
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
};

const getCardBrand = (cardNumber: string): string | null => {
  const sanitized = sanitizeCardNumber(cardNumber);
  const bin = sanitized.slice(0, 6);

  // Visa: starts with 4
  if (sanitized.startsWith('4')) return 'visa';

  // MasterCard: 5[1-5]xxxx or 2[2-7]xxxx
  if (/^5[1-5]/.test(sanitized) || /^2[2-7]/.test(sanitized)) return 'mastercard';

  // MIR: 220[0-4]xx
  if (/^220[0-4]/.test(sanitized)) return 'mir';

  return null;
};

const validateCardLength = (cardNumber: string, brand: string | null): boolean => {
  const validLengths: Record<string, number[]> = {
    visa: [13, 16, 19],
    mastercard: [16],
    mir: [16],
  };

  if (!brand) return false;
  return validLengths[brand]?.includes(cardNumber.length) ?? false;
};

const formatCardNumber = (input: string): string => {
  const sanitized = sanitizeCardNumber(input);
  return sanitized.replace(/(\d{4})(?=\d)/g, '$1 ');
};

interface CardValidationFieldProps {
  form: UseFormReturn<ExchangeFormData>;
  t: (key: string) => string;
}

export function CardValidationField({ form, t }: CardValidationFieldProps) {
  const { values, setFieldValue, errors } = form;
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [isValidLength, setIsValidLength] = useState(false);
  const [isValidLuhn, setIsValidLuhn] = useState(false);

  // Real-time card validation
  useEffect(() => {
    const sanitized = sanitizeCardNumber(values.cardNumber);

    if (sanitized.length >= 6) {
      const brand = getCardBrand(sanitized);
      setCardBrand(brand);

      if (sanitized.length >= 13) {
        setIsValidLength(validateCardLength(sanitized, brand));
        setIsValidLuhn(luhnCheck(sanitized));
      } else {
        setIsValidLength(false);
        setIsValidLuhn(false);
      }
    } else {
      setCardBrand(null);
      setIsValidLength(false);
      setIsValidLuhn(false);
    }
  }, [values.cardNumber]);

  const handleCardInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const sanitized = sanitizeCardNumber(input);
    const formatted = formatCardNumber(sanitized);

    // Update display value
    e.target.value = formatted;

    // Update form value (sanitized)
    setFieldValue('cardNumber', sanitized);
  };

  const getValidationIcon = () => {
    if (!values.cardNumber) return null;

    if (errors.cardNumber) {
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    }

    if (isValidLength && isValidLuhn) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }

    return <CreditCard className="w-4 h-4 text-muted-foreground" />;
  };

  const getCardBrandIcon = () => {
    if (!cardBrand) return null;

    const brandStyles = {
      visa: 'bg-blue-100 text-blue-800 border-blue-200',
      mastercard: 'bg-red-100 text-red-800 border-red-200',
      mir: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <div
        className={`px-2 py-1 text-xs font-medium border rounded ${brandStyles[cardBrand as keyof typeof brandStyles]}`}
      >
        {cardBrand.toUpperCase()}
      </div>
    );
  };

  return (
    <FormField name="cardNumber" error={errors.cardNumber}>
      <FormLabel htmlFor="exchange-card-number" className="text-sm font-medium required">
        {t('personalData.cardNumber.label')}
      </FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            id="exchange-card-number"
            type="text"
            placeholder={t('personalData.cardNumber.placeholder')}
            className="pr-20"
            inputMode="numeric"
            maxLength={23} // Formatted length (19 digits + 4 spaces)
            autoComplete="cc-number"
            aria-required="true"
            aria-describedby="card-validation-status"
            onChange={handleCardInput}
            defaultValue={formatCardNumber(values.cardNumber)}
          />

          {/* Right side icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
            {getCardBrandIcon()}
            {getValidationIcon()}
          </div>
        </div>
      </FormControl>

      {/* Validation Status */}
      <div id="card-validation-status" className="mt-2 space-y-1">
        {values.cardNumber && (
          <div className="text-xs space-y-1">
            {/* Length validation */}
            <div
              className={`flex items-center space-x-1 ${isValidLength ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              <span>{isValidLength ? '✅' : '⏳'}</span>
              <span>{t('personalData.cardNumber.lengthValidation')}</span>
            </div>

            {/* Luhn validation */}
            {isValidLength && (
              <div
                className={`flex items-center space-x-1 ${isValidLuhn ? 'text-green-600' : 'text-destructive'}`}
              >
                <span>{isValidLuhn ? '✅' : '❌'}</span>
                <span>{t('personalData.cardNumber.luhnValidation')}</span>
              </div>
            )}

            {/* Brand support */}
            {cardBrand && (
              <div className="flex items-center space-x-1 text-green-600">
                <span>✅</span>
                <span>
                  {t('personalData.cardNumber.brandSupported', { brand: cardBrand.toUpperCase() })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <FormMessage />
    </FormField>
  );
}
```

### 3. **Security Section** (`SecuritySection.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/SecuritySection.tsx
'use client';

import { UseFormReturn } from '@repo/hooks';
import { ExchangeFormData } from '@repo/exchange-core/src/types';
import { FormField, FormLabel, FormControl, FormMessage, Checkbox } from '@repo/ui';
import { MathCaptcha } from '@repo/ui/components/ui/math-captcha';
import { useMathCaptcha } from '@repo/hooks/src/business/useMathCaptcha';
import { useEffect } from 'react';
import Link from 'next/link';

interface SecuritySectionProps {
  form: UseFormReturn<ExchangeFormData>;
  t: (key: string) => string;
}

export function SecuritySection({ form, t }: SecuritySectionProps) {
  const { values, setFieldValue, errors } = form;

  // Math CAPTCHA integration
  const captcha = useMathCaptcha({
    minNumber: 1,
    maxNumber: 10,
    operations: ['add', 'subtract'],
  });

  // Sync CAPTCHA answer with form
  useEffect(() => {
    setFieldValue('captchaAnswer', captcha.userAnswer);
  }, [captcha.userAnswer, setFieldValue]);

  // Handle CAPTCHA verification
  useEffect(() => {
    if (captcha.isVerified) {
      // Clear any CAPTCHA errors when verified
      if (errors.captchaAnswer) {
        setFieldValue('captchaAnswer', captcha.userAnswer);
      }
    }
  }, [captcha.isVerified, captcha.userAnswer, errors.captchaAnswer, setFieldValue]);

  return (
    <section
      className="security-section bg-muted/50 border border-border rounded-lg p-6"
      aria-labelledby="security-heading"
    >
      <header className="section-header mb-6">
        <h2 id="security-heading" className="text-xl font-semibold text-foreground">
          {t('security.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('security.subtitle')}</p>
      </header>

      <div className="security-content space-y-6">
        {/* Math CAPTCHA */}
        <FormField name="captchaAnswer" error={errors.captchaAnswer}>
          <FormLabel className="text-sm font-medium required">
            {t('security.captcha.label')}
          </FormLabel>
          <FormControl>
            <MathCaptcha
              name="captcha"
              question={captcha.challenge.question}
              userAnswer={captcha.userAnswer}
              isVerified={captcha.isVerified}
              hasError={captcha.hasError}
              onAnswerChange={captcha.setUserAnswer}
              onBlur={captcha.onBlur}
              onRefresh={captcha.refreshChallenge}
              disabled={false}
              hideLabel={true}
              labels={{
                question: t('security.captcha.question'),
                placeholder: t('security.captcha.placeholder'),
                refresh: t('security.captcha.refresh'),
                verification: t('security.captcha.verification'),
                error: t('security.captcha.error'),
              }}
            />
          </FormControl>
          <FormMessage />
        </FormField>

        {/* Terms Agreement */}
        <FormField name="agreeToTerms" error={errors.agreeToTerms}>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="agree-to-terms"
              checked={values.agreeToTerms}
              onCheckedChange={checked => setFieldValue('agreeToTerms', !!checked)}
              className="mt-1"
              aria-required="true"
              aria-describedby="terms-error"
            />
            <div className="flex-1">
              <FormLabel
                htmlFor="agree-to-terms"
                className="text-sm cursor-pointer leading-relaxed"
              >
                {t('security.terms.prefix')}{' '}
                <Link
                  href="/terms-of-service"
                  className="text-primary hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('security.terms.termsLink')}
                </Link>{' '}
                {t('security.terms.and')}{' '}
                <Link
                  href="/aml-policy"
                  className="text-primary hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('security.terms.amlLink')}
                </Link>
                {t('security.terms.suffix')}
              </FormLabel>
            </div>
          </div>
          <FormMessage id="terms-error" />
        </FormField>

        {/* Privacy Settings (Optional) */}
        <FormField name="rememberData">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="remember-data"
              checked={values.rememberData || false}
              onCheckedChange={checked => setFieldValue('rememberData', !!checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <FormLabel
                htmlFor="remember-data"
                className="text-sm cursor-pointer leading-relaxed text-muted-foreground"
              >
                {t('security.privacy.rememberData')}
              </FormLabel>
              <p className="text-xs text-muted-foreground mt-1">
                {t('security.privacy.rememberDataDescription')}
              </p>
            </div>
          </div>
        </FormField>

        {/* Security Information */}
        <div className="security-info bg-background border border-border rounded-md p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">{t('security.info.title')}</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• {t('security.info.encryption')}</li>
            <li>• {t('security.info.dataProtection')}</li>
            <li>• {t('security.info.noStorage')}</li>
            <li>• {t('security.info.compliance')}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
```

## 🔗 **Integration with Task 2.1 & 2.2**

### Update ExchangeLayout.tsx:

```tsx
// Replace placeholder sections in ExchangeLayout.tsx
import { PersonalDataSection } from './PersonalDataSection';
import { SecuritySection } from './SecuritySection';

// Replace the placeholder sections:
<PersonalDataSection form={form} t={t} />
<SecuritySection form={form} t={t} />
```

## 📝 **Translation Keys Required**

### Add to messages/ru.json:

```json
{
  "AdvancedExchangeForm": {
    "personalData": {
      "title": "Персональные данные",
      "subtitle": "Введите данные для обработки заявки",
      "email": {
        "label": "Email адрес",
        "placeholder": "Введите ваш email"
      },
      "cardNumber": {
        "label": "Номер банковской карты",
        "placeholder": "1234 5678 9012 3456",
        "lengthValidation": "Корректная длина номера карты",
        "luhnValidation": "Номер карты прошел проверку",
        "brandSupported": "Поддерживается {brand}"
      },
      "additionalInfo": {
        "placeholder": "Дополнительная информация (в будущих версиях)"
      }
    },
    "security": {
      "title": "Безопасность и подтверждение",
      "subtitle": "Завершите проверку для создания заявки",
      "captcha": {
        "label": "Решите математический пример",
        "question": "Вопрос",
        "placeholder": "Введите ответ",
        "refresh": "Обновить",
        "verification": "Проверка",
        "error": "Неверный ответ"
      },
      "terms": {
        "prefix": "Я согласен с",
        "termsLink": "Правилами сервиса",
        "and": "и",
        "amlLink": "AML политикой",
        "suffix": " обменника"
      },
      "privacy": {
        "rememberData": "Не запоминать введенные данные",
        "rememberDataDescription": "Данные не будут сохранены в локальном хранилище"
      },
      "info": {
        "title": "🔐 Защита данных",
        "encryption": "Все данные передаются по защищенному соединению",
        "dataProtection": "Персональные данные не сохраняются на серверах",
        "noStorage": "Номера карт не записываются в логи",
        "compliance": "Соответствие стандартам PCI DSS"
      }
    }
  }
}
```

## ✅ **Validation Criteria**

### Functional Requirements:

- [ ] Email validation через established patterns
- [ ] Card number validation с Luhn algorithm
- [ ] BIN detection для payment systems (Visa, MasterCard, MIR)
- [ ] Real-time visual feedback для card validation
- [ ] Math CAPTCHA integration и verification
- [ ] Terms agreement required validation
- [ ] Privacy settings optional checkbox

### Technical Requirements:

- [ ] TypeScript типы корректны
- [ ] Form integration с validation schemas работает
- [ ] CAPTCHA state синхронизируется с form
- [ ] Card formatting в real-time
- [ ] Accessibility standards соблюдены
- [ ] Error handling для всех validation states

### Security Requirements:

- [ ] XSS protection через validation schemas
- [ ] CAPTCHA prevents automated submissions
- [ ] Card numbers properly sanitized
- [ ] No sensitive data in console logs
- [ ] Secure form submission preparation

### UI/UX Requirements:

- [ ] Visual feedback для validation states
- [ ] Loading states для CAPTCHA operations
- [ ] Responsive design на всех устройствах
- [ ] Clear error messaging
- [ ] Intuitive form flow

---

**Статус**: ✅ Ready for implementation  
**Зависимости**: Task 2.1 (Page Structure), Task 2.2 (Currency Selection)  
**Следующий шаг**: Task 2.4 - Form Submission & State Management
