# 📋 TASK 2.3: Personal Data & Security Section Implementation

> **Цель**: Реализовать personal data input (email, card details) и security verification section (math captcha, terms agreement) с полной integration в form validation.

## 🎯 **Scope Definition - на 100% основано на архитектурном анализе**

### Создаваемые файлы:

- `apps/web/app/[locale]/exchange/components/PersonalDataSection.tsx` - email и personal info
- `apps/web/app/[locale]/exchange/components/SecuritySection.tsx` - captcha и agreements
- `apps/web/app/[locale]/exchange/components/CardValidationField.tsx` - enhanced card validation

### Интеграция с существующими системами:

- **MathCaptcha Component**: `@repo/ui/components/ui/math-captcha` (СУЩЕСТВУЕТ)
- **Checkbox Component**: `@repo/ui/components/ui/checkbox` (СУЩЕСТВУЕТ)
- **Form Components**: `FormField`, `FormLabel`, `FormControl`, `FormMessage` from `@repo/ui` (СУЩЕСТВУЮТ)
- **Validation Schemas**: `securityEnhancedAdvancedExchangeFormSchema` (ГОТОВО в task 1.1)
- **Card Validation Utils**: Luhn algorithm, BIN detection (ТРЕБУЕТСЯ СОЗДАТЬ)

### Architectural Requirements from Acceptance Criteria:

- Email validation через existing patterns из AuthEmailField
- Card number validation с Luhn algorithm и BIN detection
- Math CAPTCHA integration для security verification
- Terms agreement checkbox с required validation
- Privacy settings checkbox (optional)

## 📐 **Technical Implementation Plan**

### 1. **Personal Data Section** (`PersonalDataSection.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/PersonalDataSection.tsx
'use client';

import { UseFormReturn } from '@repo/hooks';
import { ExchangeFormData } from '@repo/exchange-core/src/types';
import { FormField, FormLabel, FormControl, FormMessage, Input } from '@repo/ui';
import { CardValidationField } from './CardValidationField';

interface PersonalDataSectionProps {
  form: UseFormReturn<ExchangeFormData>;
  t: (key: string) => string;
}

export function PersonalDataSection({ form, t }: PersonalDataSectionProps) {
  const { getFieldProps, errors } = form;

  return (
    <section
      className="personal-data-section bg-muted/50 border border-border rounded-lg p-6"
      aria-labelledby="personal-data-heading"
    >
      <header className="section-header mb-6">
        <h2 id="personal-data-heading" className="text-xl font-semibold text-foreground">
          {t('personalData.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('personalData.subtitle')}</p>
      </header>

      <div className="personal-data-content space-y-4">
        {/* Email Field */}
        <FormField name="email" error={errors.email}>
          <FormLabel htmlFor="exchange-email" className="text-sm font-medium required">
            {t('personalData.email.label')}
          </FormLabel>
          <FormControl>
            <Input
              {...getFieldProps('email')}
              id="exchange-email"
              type="email"
              placeholder={t('personalData.email.placeholder')}
              className="w-full"
              inputMode="email"
              autoComplete="email"
              aria-required="true"
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </FormControl>
          <FormMessage id="email-error" />
        </FormField>

        {/* Enhanced Card Number Field */}
        <CardValidationField form={form} t={t} />

        {/* Additional Personal Info (Future Extension) */}
        <div className="additional-info-placeholder">
          <div className="text-xs text-muted-foreground p-3 bg-background border border-dashed border-muted-foreground/30 rounded-md">
            {t('personalData.additionalInfo.placeholder')}
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 2. **Enhanced Card Validation Field** (`CardValidationField.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/CardValidationField.tsx
'use client';

import { UseFormReturn } from '@repo/hooks';
import { ExchangeFormData } from '@repo/exchange-core/src/types';
import { FormField, FormLabel, FormControl, FormMessage, Input } from '@repo/ui';
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

// Card validation utilities
const sanitizeCardNumber = (input: string): string => input.replace(/\D/g, '');

const luhnCheck = (cardNumber: string): boolean => {
  const digits = cardNumber.split('').map(Number);
  let sum = 0;
  let alternate = false;

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
