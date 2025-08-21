# 📋 TASK 2.1: Создание основной страницы Exchange с двухколоночным layout

> **Цель**: Создать NEW страницу `/[locale]/exchange/page.tsx` с стандартной формой (НЕ compound components) согласно acceptance criteria и архитектуре конкурентов.

## 🎯 **Scope Definition - на 100% основано на архитектурном анализе**

### Создаваемые файлы:

- `apps/web/app/[locale]/exchange/page.tsx` - основная страница
- `apps/web/app/[locale]/exchange/components/ExchangeContainer.tsx` - главный контейнер
- `apps/web/app/[locale]/exchange/components/ExchangeLayout.tsx` - layout структура

### Интеграция с существующими системами:

- **Validation schemas**: `@repo/utils/src/validation/security-enhanced-exchange-schemas.ts` (СУЩЕСТВУЕТ)
- **Constants**: `@repo/constants/src/exchange.ts` и getDefaultTokenStandard (СУЩЕСТВУЕТ)
- **Types**: `@repo/hooks/src/state/exchange-store.ts` ExchangeFormData (СУЩЕСТВУЕТ)
- **UI Components**: `@repo/ui` - ExchangeForm compound pattern, Input, Button, Select (СУЩЕСТВУЮТ)
- **Form Hooks**: `@repo/hooks/src/client-hooks` - useFormWithNextIntl (СУЩЕСТВУЕТ)

### Архитектурные требования из Acceptance Criteria:

- Standard HTML form structure (НЕ compound components как в HeroExchangeForm)
- Two-column layout: "Отдаете" (левая) | "Получаете" (правая)
- Mobile-first responsive с CSS Architecture v3.0
- Query параметры поддержка: `?from=usdt-trc20&to=uah-card&bank=privatbank`

## 📐 **Technical Implementation Plan**

### 1. **Page Structure Creation** (`/exchange/page.tsx`)

```tsx
// apps/web/app/[locale]/exchange/page.tsx
import { NextPageProps } from '@/types/next';
import { getTranslations } from 'next-intl/server';
import { ExchangeContainer } from './components/ExchangeContainer';

interface ExchangePageProps extends NextPageProps {
  searchParams: {
    from?: string;
    to?: string;
    bank?: string;
    amount?: string;
  };
}

export async function generateMetadata({ params, searchParams }: ExchangePageProps) {
  const t = await getTranslations('AdvancedExchangeForm');

  const fromCurrency = searchParams.from || 'USDT-TRC20';
  const toCurrency = searchParams.to || 'UAH-CARD';
  const selectedBank = searchParams.bank;

  return {
    title: t('metadata.title', { from: fromCurrency, to: toCurrency }),
    description: t('metadata.description', {
      from: fromCurrency,
      to: toCurrency,
      bank: selectedBank,
    }),
    openGraph: {
      title: t('metadata.ogTitle', { from: fromCurrency, to: toCurrency }),
      description: t('metadata.ogDescription'),
    },
  };
}

export default function ExchangePage({ params, searchParams }: ExchangePageProps) {
  return (
    <main role="main" className="exchange-page min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <ExchangeContainer
          locale={params.locale}
          initialParams={{
            from: searchParams.from,
            to: searchParams.to,
            bank: searchParams.bank,
            amount: searchParams.amount ? parseFloat(searchParams.amount) : undefined,
          }}
        />
      </div>
    </main>
  );
}
```

### 2. **Container Component** (`ExchangeContainer.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/ExchangeContainer.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import { securityEnhancedAdvancedExchangeFormSchema } from '@repo/utils/src/validation/security-enhanced-exchange-schemas';
import { ExchangeLayout } from './ExchangeLayout';
import { ExchangeFormData } from '@repo/hooks/src/state/exchange-store';
import { EXCHANGE_DEFAULTS, getDefaultTokenStandard } from '@repo/constants/src/exchange';

interface ExchangeContainerProps {
  locale: string;
  initialParams?: {
    from?: string;
    to?: string;
    bank?: string;
    amount?: number;
  };
}

export function ExchangeContainer({ locale, initialParams }: ExchangeContainerProps) {
  const t = useTranslations('AdvancedExchangeForm');

  // Parse initial values from query params
  const initialFormData: Partial<ExchangeFormData> = {
    fromCurrency: (initialParams?.from?.split('-')[0] as any) || EXCHANGE_DEFAULTS.FROM_CURRENCY,
    tokenStandard:
      (initialParams?.from?.split('-')[1] as any) ||
      getDefaultTokenStandard(EXCHANGE_DEFAULTS.FROM_CURRENCY) ||
      'TRC-20',
    toCurrency: EXCHANGE_DEFAULTS.TO_CURRENCY,
    selectedBankId: (initialParams?.bank as any) || 'privatbank',
    cryptoAmount: initialParams?.amount || 0,
    uahAmount: 0,
    email: '',
    cardNumber: '',
    captchaAnswer: '',
    agreeToTerms: false,
    rememberData: false,
  };

  const form = useFormWithNextIntl<ExchangeFormData>({
    initialValues: initialFormData,
    validationSchema: securityEnhancedAdvancedExchangeFormSchema,
    t,
    onSubmit: async values => {
      // Form submission logic будет в task 2.4
      console.log('Form submitted:', values);
    },
  });

  return (
    <div className="exchange-container">
      {/* Page Header */}
      <header className="exchange-header mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground lg:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground lg:text-lg">{t('subtitle')}</p>
      </header>

      {/* Main Exchange Layout */}
      <ExchangeLayout form={form} t={t} />
    </div>
  );
}
```

### 3. **Layout Structure** (`ExchangeLayout.tsx`)

```tsx
// apps/web/app/[locale]/exchange/components/ExchangeLayout.tsx
'use client';

import { UseFormWithNextIntlReturn } from '@repo/hooks/src/client-hooks';
import { ExchangeFormData } from '@repo/hooks/src/state/exchange-store';

interface ExchangeLayoutProps {
  form: UseFormWithNextIntlReturn<ExchangeFormData>;
  t: (key: string) => string;
}

export function ExchangeLayout({ form, t }: ExchangeLayoutProps) {
  return (
    <form onSubmit={form.handleSubmit} className="exchange-form">
      {/* Two-Column Layout Container */}
      <div className="exchange-grid grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {/* LEFT COLUMN: "Отдаете" */}
        <section className="exchange-send-column bg-muted/50 border border-border rounded-lg p-6">
          <header className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">{t('sending.title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('sending.subtitle')}</p>
          </header>

          <div className="send-content space-y-4">
            {/* Currency Selection - будет реализовано в task 2.2 */}
            <div className="currency-selection">
              <div className="placeholder-content h-20 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Currency Selection (Task 2.2)</span>
              </div>
            </div>

            {/* Amount Input - будет реализовано в task 2.2 */}
            <div className="amount-input">
              <div className="placeholder-content h-16 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Amount Input (Task 2.2)</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: "Получаете" */}
        <section className="exchange-receive-column bg-muted/50 border border-border rounded-lg p-6">
          <header className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">{t('receiving.title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('receiving.subtitle')}</p>
          </header>

          <div className="receive-content space-y-4">
            {/* Bank Selection - будет реализовано в task 2.2 */}
            <div className="bank-selection">
              <div className="placeholder-content h-20 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Bank Selection (Task 2.2)</span>
              </div>
            </div>

            {/* Amount Display - будет реализовано в task 2.2 */}
            <div className="amount-display">
              <div className="placeholder-content h-16 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Amount Display (Task 2.2)</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FULL-WIDTH SECTIONS */}
      <div className="exchange-additional-sections mt-8 space-y-6">
        {/* Personal Data Section - будет реализовано в task 2.3 */}
        <section className="personal-data-section bg-muted/50 border border-border rounded-lg p-6">
          <header className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">{t('personalData.title')}</h2>
          </header>
          <div className="placeholder-content h-24 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Personal Data Form (Task 2.3)</span>
          </div>
        </section>

        {/* Security Section - будет реализовано в task 2.3 */}
        <section className="security-section bg-muted/50 border border-border rounded-lg p-6">
          <header className="section-header mb-6">
            <h2 className="text-xl font-semibold text-foreground">{t('security.title')}</h2>
          </header>
          <div className="placeholder-content h-32 bg-background border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-center">
            <span className="text-sm text-muted-foreground">
              Security & Verification (Task 2.3)
            </span>
          </div>
        </section>

        {/* Submit Section - будет реализовано в task 2.4 */}
        <section className="submit-section">
          <div className="placeholder-content h-16 bg-primary/10 border border-dashed border-primary/30 rounded-md flex items-center justify-center">
            <span className="text-sm text-primary">Submit Button & Actions (Task 2.4)</span>
          </div>
        </section>
      </div>
    </form>
  );
}
```

## 🎨 **CSS Architecture v3.0 Integration**

### Semantic CSS Classes:

```css
/* Используемые semantic classes из @repo/tailwind-preset/globals.css */
.bg-background        /* Page background */
.text-foreground     /* Primary text */
.text-muted-foreground /* Secondary text */
.border-border       /* Consistent borders */
.bg-muted/50         /* Section backgrounds */
.bg-primary/10       /* Accent backgrounds */
```

### Mobile-First Responsive:

```css
/* Base mobile styles (default) */
.grid-cols-1         /* Single column on mobile */
.p-6                 /* Consistent padding */

/* Tablet styles (md: 768px+) */
.md:grid-cols-2      /* Two columns on tablet+ */

/* Desktop styles (lg: 1024px+) */
.lg:gap-8            /* Larger gaps on desktop */
.lg:text-4xl         /* Larger text on desktop */
```

## 🔗 **Integration Points**

### 1. **Next.js App Router Integration**

- Dynamic metadata generation based on query params
- Proper `generateMetadata` export for SEO
- TypeScript integration с NextPageProps

### 2. **Internationalization (next-intl)**

- `AdvancedExchangeForm` translation namespace
- Server-side translations for metadata
- Client-side translations for UI

### 3. **Form Management Integration**

- `useFormWithNextIntl` hook для form state
- Integration с validation schemas из task 1.1
- Type-safe form data с ExchangeFormData

### 4. **State Management Preparation**

- Initial values parsing от query params
- Form state management через established patterns
- Preparation для API integration в task 2.4

## ✅ **Validation Criteria**

### Functional Requirements:

- [ ] Страница корректно отображается по адресу `/[locale]/exchange`
- [ ] Query параметры правильно парсятся и устанавливают initial values
- [ ] Layout responsive на всех устройствах (mobile, tablet, desktop)
- [ ] SEO metadata генерируется динамически
- [ ] Все placeholder sections отображаются корректно

### Technical Requirements:

- [ ] TypeScript компиляция без ошибок
- [ ] CSS Architecture v3.0 classes применяются корректно
- [ ] Form integration с validation schemas работает
- [ ] Internationalization работает для всех локалей
- [ ] Accessibility standards соблюдены (semantic HTML, ARIA)

### Integration Requirements:

- [ ] Интеграция с существующими UI компонентами из @repo/ui
- [ ] Константы импортируются из @repo/constants
- [ ] Types импортируются из @repo/hooks/src/state/exchange-store
- [ ] Validation schemas импортируются из @repo/utils

## 🎯 **Success Metrics**

1. **Page loads successfully** на всех supported routes
2. **Query params parsing** работает корректно
3. **Responsive layout** адаптируется правильно
4. **Form initialization** происходит без ошибок
5. **Semantic HTML structure** готова для screen readers
6. **CSS Architecture** применяется последовательно
7. **TypeScript type safety** обеспечена на 100%

---

**Статус**: ✅ Ready for implementation  
**Зависимости**: Tasks 1.1-1.3 (COMPLETED)  
**Следующий шаг**: Task 2.2 - Currency Selection & Amount Calculation
