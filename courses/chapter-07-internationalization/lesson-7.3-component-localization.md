# Урок 7.3: Локализация компонентов

> **🎯 Цель урока**: Освоить практические техники локализации React-компонентов, условную логику по языкам и серверную локализацию

## 📖 Введение

### Проблемы наивной локализации компонентов

**Представьте ситуацию в ExchangeGO:**

```typescript
// ❌ Наивный подход - только перевод текста
function ExchangeForm() {
  return (
    <div>
      <h2>{t('exchange.title')}</h2>
      <input placeholder={t('exchange.amount')} />
      <button>{t('exchange.submit')}</button>
    </div>
  );
}

// Что происходит в реальности:
// 🇺🇦 Украинцы: видят "1 000,50 ₴" но форма принимает "1000.50"
// 🇺🇸 Американцы: ожидают "MM/DD/YYYY" но видят "DD.MM.YYYY"
// 🇷🇺 Русские: хотят "Вы" но видят "ты"
```

### Реальные проблемы локализации компонентов

| Аспект               | Проблема             | Пример                       | Влияние на UX           |
| -------------------- | -------------------- | ---------------------------- | ----------------------- |
| **Форматирование**   | Разные форматы чисел | 1,234.56 vs 1 234,56         | Путаница при вводе      |
| **Layout**           | Длина текста         | "Buy" vs "Купить"            | Сломанный дизайн        |
| **Валидация**        | Локальные форматы    | Email vs телефон             | Ложные ошибки           |
| **Культура**         | Цвета и символы      | Красный = опасность vs удача | Неправильное восприятие |
| **Функциональность** | Локальные требования | GDPR vs CCPA                 | Юридические проблемы    |

### Статистика влияния на бизнес

```typescript
// Данные из аналитики ExchangeGO
const localizationImpact = {
  poorLocalization: {
    conversionDrop: '45%', // Падение конверсии
    supportTickets: '+120%', // Рост обращений в поддержку
    userSatisfaction: '2.1/5', // Низкая оценка пользователей
    timeOnSite: '-60%', // Меньше времени на сайте
  },

  properLocalization: {
    conversionIncrease: '+85%', // Рост конверсии
    supportReduction: '-70%', // Меньше обращений
    userSatisfaction: '4.7/5', // Высокая оценка
    userRetention: '+150%', // Больше возвращаются
  },
};
```

### Что такое правильная локализация компонентов?

**Локализация компонентов** - это **адаптация всего пользовательского опыта** под культуру и язык:

#### 1. **Текстовая локализация**

```typescript
// ✅ Не просто перевод, а контекстная адаптация
const contextualTranslations = {
  // Формальность обращения
  uk: 'Введіть вашу електронну пошту', // Неформально
  en: 'Enter your email address', // Нейтрально
  ru: 'Введите ваш адрес электронной почты', // Формально

  // Культурные особенности
  errorMessages: {
    uk: 'Щось пішло не так 😅', // Дружелюбно
    en: 'Something went wrong', // Профессионально
    ru: 'Произошла ошибка', // Официально
  },
};
```

#### 2. **Визуальная локализация**

```typescript
// ✅ Адаптация layout под длину текста
const layoutAdaptation = {
  buttonWidth: {
    uk: 'auto', // "Купити" - короткое
    en: 'auto', // "Buy" - короткое
    ru: 'min-w-32', // "Приобрести" - длинное
  },

  textDirection: {
    ar: 'rtl', // Справа налево
    he: 'rtl', // Справа налево
    default: 'ltr', // Слева направо
  },
};
```

#### 3. **Функциональная локализация**

```typescript
// ✅ Разная функциональность по регионам
const functionalAdaptation = {
  paymentMethods: {
    uk: ['PrivatBank', 'Monobank', 'USDT'],
    en: ['PayPal', 'Stripe', 'Bitcoin'],
    eu: ['SEPA', 'IBAN', 'Ethereum'],
  },

  legalRequirements: {
    eu: { gdpr: true, cookieConsent: true },
    us: { ccpa: true, coppa: true },
    uk: { localLaws: true },
  },
};
```

#### 4. **Культурная локализация**

```typescript
// ✅ Адаптация под культурные особенности
const culturalAdaptation = {
  colors: {
    cn: { lucky: 'red', unlucky: 'white' },
    western: { danger: 'red', success: 'green' },
    islamic: { avoid: 'yellow' }, // Может ассоциироваться с предательством
  },

  imagery: {
    conservative: { modestClothing: true, familyFriendly: true },
    liberal: { diverseRepresentation: true },
  },
};
```

### Результат правильной локализации

**Пример трансформации компонента:**

```typescript
// ❌ До: простой перевод
<button>{t('buy')}</button>

// ✅ После: полная локализация
<LocalizedButton
  variant={getVariantForCulture(locale)}
  size={getSizeForTextLength(t('buy'), locale)}
  colors={getColorsForCulture(locale)}
  onClick={handlePurchase}
  loading={isLoading}
  loadingText={t('processing', {
    context: getFormality(locale),
    gender: getUserGender()
  })}
>
  {t('buy', {
    context: 'crypto-exchange',
    formality: getFormality(locale)
  })}
</LocalizedButton>
```

**Результат для пользователей:**

- 🇺🇦 **Украинцы**: "Купити BTC" - знакомо и понятно
- 🇺🇸 **Americans**: "Buy BTC" - профессионально и четко
- 🇷🇺 **Русские**: "Приобрести BTC" - вежливо и официально

## 📋 Этап 1: Стратегия локализации компонентов _(10 мин)_

### 1. Архитектурные паттерны локализации:

```typescript
// 📁 apps/web/src/patterns/localization-patterns.ts

// ✅ Паттерн 1: Wrapper Components
export function LocalizedWrapper<T extends Record<string, any>>({
  children,
  locale,
  adaptations,
}: {
  children: React.ReactNode;
  locale: string;
  adaptations: T;
}) {
  const adaptation = adaptations[locale] || adaptations.default;

  return (
    <div
      className={adaptation.className}
      style={adaptation.style}
      dir={adaptation.direction}
    >
      {children}
    </div>
  );
}

// ✅ Паттерн 2: Render Props
export function LocalizationProvider({
  children,
}: {
  children: (props: {
    locale: string;
    formatNumber: (num: number) => string;
    formatDate: (date: Date) => string;
    getDirection: () => 'ltr' | 'rtl';
    getCulturalColors: () => Record<string, string>;
  }) => React.ReactNode;
}) {
  const locale = useLocale();
  const format = useFormatter();

  return children({
    locale,
    formatNumber: (num) => format.number(num),
    formatDate: (date) => format.dateTime(date),
    getDirection: () => getTextDirection(locale),
    getCulturalColors: () => getCulturalColorScheme(locale),
  });
}

// ✅ Паттерн 3: Higher-Order Components
export function withLocalization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    namespace?: string;
    adaptLayout?: boolean;
    adaptColors?: boolean;
  } = {}
) {
  return function LocalizedComponent(props: P) {
    const locale = useLocale();
    const t = useTranslations(options.namespace);

    const adaptedProps = {
      ...props,
      locale,
      t,
      ...(options.adaptLayout && {
        layoutProps: getLayoutAdaptation(locale)
      }),
      ...(options.adaptColors && {
        colorProps: getColorAdaptation(locale)
      }),
    };

    return <Component {...adaptedProps} />;
  };
}
```

### 2. Система адаптации компонентов:

```typescript
// 📁 apps/web/src/lib/component-adaptation.ts

interface ComponentAdaptation {
  layout: {
    direction: 'ltr' | 'rtl';
    spacing: 'compact' | 'normal' | 'relaxed';
    alignment: 'left' | 'center' | 'right';
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    semantic: Record<string, string>;
  };
  behavior: {
    formality: 'informal' | 'formal' | 'neutral';
    animations: 'minimal' | 'normal' | 'rich';
    feedback: 'subtle' | 'clear' | 'prominent';
  };
}

export const componentAdaptations: Record<string, ComponentAdaptation> = {
  uk: {
    layout: {
      direction: 'ltr',
      spacing: 'compact', // Украинцы предпочитают компактность
      alignment: 'left',
    },
    typography: {
      fontFamily: 'Inter, system-ui',
      fontSize: 14,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    colors: {
      primary: '#0066CC', // Синий - цвет доверия
      secondary: '#FFD700', // Желтый - национальный цвет
      accent: '#28A745', // Зеленый - успех
      semantic: {
        success: '#28A745',
        warning: '#FFC107',
        error: '#DC3545',
        info: '#17A2B8',
      },
    },
    behavior: {
      formality: 'informal', // Обращение на "ты"
      animations: 'normal',
      feedback: 'clear',
    },
  },

  en: {
    layout: {
      direction: 'ltr',
      spacing: 'normal', // Стандартные отступы
      alignment: 'left',
    },
    typography: {
      fontFamily: 'Inter, system-ui',
      fontSize: 16, // Чуть больше для читаемости
      lineHeight: 1.6,
      letterSpacing: 0.01,
    },
    colors: {
      primary: '#007BFF', // Стандартный синий
      secondary: '#6C757D', // Нейтральный серый
      accent: '#28A745', // Зеленый успех
      semantic: {
        success: '#28A745',
        warning: '#FFC107',
        error: '#DC3545',
        info: '#17A2B8',
      },
    },
    behavior: {
      formality: 'neutral', // Нейтральное обращение
      animations: 'normal',
      feedback: 'clear',
    },
  },

  ru: {
    layout: {
      direction: 'ltr',
      spacing: 'relaxed', // Больше пространства
      alignment: 'left',
    },
    typography: {
      fontFamily: 'Inter, system-ui',
      fontSize: 15,
      lineHeight: 1.7, // Увеличенный межстрочный интервал
      letterSpacing: 0.005,
    },
    colors: {
      primary: '#0056B3', // Темно-синий - официальность
      secondary: '#495057', // Темно-серый
      accent: '#28A745', // Зеленый успех
      semantic: {
        success: '#28A745',
        warning: '#FD7E14', // Оранжевый вместо желтого
        error: '#DC3545',
        info: '#6F42C1', // Фиолетовый для информации
      },
    },
    behavior: {
      formality: 'formal', // Обращение на "Вы"
      animations: 'minimal', // Меньше анимаций
      feedback: 'prominent', // Четкая обратная связь
    },
  },
};

// Утилиты для получения адаптации
export function getComponentAdaptation(locale: string): ComponentAdaptation {
  return componentAdaptations[locale] || componentAdaptations.en;
}

export function getLayoutAdaptation(locale: string) {
  return getComponentAdaptation(locale).layout;
}

export function getColorAdaptation(locale: string) {
  return getComponentAdaptation(locale).colors;
}

export function getTypographyAdaptation(locale: string) {
  return getComponentAdaptation(locale).typography;
}

export function getBehaviorAdaptation(locale: string) {
  return getComponentAdaptation(locale).behavior;
}
```

### 3. Система условного рендеринга:

```typescript
// 📁 apps/web/src/components/localization/ConditionalRender.tsx

interface ConditionalRenderProps {
  locale?: string;
  when?: {
    locale?: string | string[];
    culture?: 'western' | 'eastern' | 'islamic' | 'conservative';
    region?: 'eu' | 'us' | 'asia' | 'cis';
    rtl?: boolean;
    formal?: boolean;
  };
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConditionalRender({
  locale: propLocale,
  when,
  children,
  fallback = null,
}: ConditionalRenderProps) {
  const currentLocale = useLocale();
  const locale = propLocale || currentLocale;

  if (!when) return <>{children}</>;

  // Проверка локали
  if (when.locale) {
    const targetLocales = Array.isArray(when.locale) ? when.locale : [when.locale];
    if (!targetLocales.includes(locale)) {
      return <>{fallback}</>;
    }
  }

  // Проверка культуры
  if (when.culture) {
    const culture = getCultureByLocale(locale);
    if (culture !== when.culture) {
      return <>{fallback}</>;
    }
  }

  // Проверка региона
  if (when.region) {
    const region = getRegionByLocale(locale);
    if (region !== when.region) {
      return <>{fallback}</>;
    }
  }

  // Проверка направления текста
  if (when.rtl !== undefined) {
    const isRtl = getTextDirection(locale) === 'rtl';
    if (isRtl !== when.rtl) {
      return <>{fallback}</>;
    }
  }

  // Проверка формальности
  if (when.formal !== undefined) {
    const isFormal = getBehaviorAdaptation(locale).formality === 'formal';
    if (isFormal !== when.formal) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Утилиты для определения культурных особенностей
function getCultureByLocale(locale: string): string {
  const cultureMap: Record<string, string> = {
    'en': 'western',
    'uk': 'eastern',
    'ru': 'eastern',
    'ar': 'islamic',
    'he': 'conservative',
    'zh': 'eastern',
    'ja': 'eastern',
  };

  return cultureMap[locale] || 'western';
}

function getRegionByLocale(locale: string): string {
  const regionMap: Record<string, string> = {
    'en': 'us',
    'uk': 'cis',
    'ru': 'cis',
    'de': 'eu',
    'fr': 'eu',
    'zh': 'asia',
    'ja': 'asia',
  };

  return regionMap[locale] || 'us';
}

function getTextDirection(locale: string): 'ltr' | 'rtl' {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
}

// Примеры использования
export function LocalizedContent() {
  return (
    <>
      {/* Показываем только для украинских пользователей */}
      <ConditionalRender when={{ locale: 'uk' }}>
        <div className="bg-blue-100 border border-yellow-400 p-4 rounded">
          🇺🇦 Спеціальна пропозиція для українських користувачів!
        </div>
      </ConditionalRender>

      {/* Показываем для формальных культур */}
      <ConditionalRender when={{ formal: true }}>
        <p>Уважаемый пользователь, благодарим за выбор нашего сервиса.</p>
      </ConditionalRender>

      {/* Показываем для неформальных культур */}
      <ConditionalRender when={{ formal: false }}>
        <p>Привет! Рады видеть тебя в нашем сервисе 👋</p>
      </ConditionalRender>

      {/* Показываем для RTL языков */}
      <ConditionalRender when={{ rtl: true }}>
        <div className="text-right" dir="rtl">
          محتوى باللغة العربية
        </div>
      </ConditionalRender>

      {/* Показываем для европейского региона */}
      <ConditionalRender when={{ region: 'eu' }}>
        <div className="text-sm text-muted-foreground">
          🇪🇺 This service complies with GDPR regulations
        </div>
      </ConditionalRender>
    </>
  );
}
```

## 🎨 Этап 2: Локализация UI компонентов _(25 мин)_

### 1. Базовый компонент с переводами:

```typescript
// 📁 apps/web/src/components/exchange/CurrencySelector.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';
import { cn } from '@/lib/utils';

interface Currency {
  code: string;
  name: string;
  icon: string;
  rate: number;
  available: boolean;
}

interface CurrencySelectorProps {
  currencies: Currency[];
  selected?: string;
  onSelect: (currency: string) => void;
  disabled?: boolean;
}

export function CurrencySelector({
  currencies,
  selected,
  onSelect,
  disabled = false,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Разные namespace для разных типов переводов
  const t = useTranslations('exchange');
  const tCurrencies = useTranslations('currencies');
  const tCommon = useTranslations('common');

  const selectedCurrency = currencies.find(c => c.code === selected);

  // Фильтрация с учетом локализованных названий
  const filteredCurrencies = currencies.filter(currency => {
    const localizedName = tCurrencies(currency.code.toLowerCase());
    const searchLower = search.toLowerCase();

    return (
      currency.code.toLowerCase().includes(searchLower) ||
      currency.name.toLowerCase().includes(searchLower) ||
      localizedName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedCurrency ? (
            <div className="flex items-center space-x-2">
              <img
                src={selectedCurrency.icon}
                alt={selectedCurrency.code}
                className="w-5 h-5 rounded-full"
              />
              <span className="font-medium">{selectedCurrency.code}</span>
              <span className="text-muted-foreground text-sm">
                {tCurrencies(selectedCurrency.code.toLowerCase())}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {t('selectCrypto')}
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        {/* Поиск */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tCommon('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Список валют */}
        <div className="max-h-60 overflow-auto">
          {filteredCurrencies.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {tCommon('noResults')}
            </div>
          ) : (
            filteredCurrencies.map((currency) => (
              <CurrencyOption
                key={currency.code}
                currency={currency}
                isSelected={currency.code === selected}
                onSelect={() => {
                  onSelect(currency.code);
                  setOpen(false);
                  setSearch('');
                }}
                localizedName={tCurrencies(currency.code.toLowerCase())}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Отдельный компонент для опции валюты
function CurrencyOption({
  currency,
  isSelected,
  onSelect,
  localizedName,
}: {
  currency: Currency;
  isSelected: boolean;
  onSelect: () => void;
  localizedName: string;
}) {
  const tCommon = useTranslations('common');

  return (
    <button
      onClick={onSelect}
      disabled={!currency.available}
      className={cn(
        "w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-center space-x-3">
        <img
          src={currency.icon}
          alt={currency.code}
          className="w-6 h-6 rounded-full"
        />
        <div className="text-left">
          <div className="font-medium">{currency.code}</div>
          <div className="text-sm text-muted-foreground">
            {localizedName}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {!currency.available && (
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
            {tCommon('unavailable')}
          </span>
        )}
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </div>
    </button>
  );
}
```

### 2. Адаптивный layout для разных языков:

```typescript
// 📁 apps/web/src/components/layout/LocalizedLayout.tsx
'use client';

import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { localeConfig } from '@/config/i18n';

interface LocalizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function LocalizedLayout({ children, className }: LocalizedLayoutProps) {
  const locale = useLocale();
  const config = localeConfig[locale as keyof typeof localeConfig];

  return (
    <div
      className={cn(
        // Направление текста
        config.direction === 'rtl' ? 'rtl' : 'ltr',

        // Специфичные для языка стили
        {
          // Украинский - более компактный интерфейс
          'font-size-adjust: 0.95': locale === 'uk',

          // Английский - стандартные пропорции
          'font-size-adjust: 1': locale === 'en',

          // Русский - чуть увеличенный межстрочный интервал
          'line-height: 1.6': locale === 'ru',
        },

        className
      )}
      dir={config.direction}
      lang={locale}
    >
      {children}
    </div>
  );
}

// Компонент для условного рендеринга по языкам
export function LocaleSwitch({
  uk,
  en,
  ru,
  fallback,
}: {
  uk?: React.ReactNode;
  en?: React.ReactNode;
  ru?: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const locale = useLocale();

  switch (locale) {
    case 'uk':
      return <>{uk || fallback}</>;
    case 'en':
      return <>{en || fallback}</>;
    case 'ru':
      return <>{ru || fallback}</>;
    default:
      return <>{fallback}</>;
  }
}
```

### 3. Локализованные формы с валидацией:

```typescript
// 📁 apps/web/src/components/forms/ExchangeForm.tsx
'use client';

import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui';
import { Input, Button } from '@repo/ui';
import { CurrencySelector } from './CurrencySelector';

// Создание схемы валидации с переводами
function createExchangeSchema(t: (key: string) => string) {
  return z.object({
    fromCurrency: z.string().min(1, t('errors.selectCurrency')),
    amount: z
      .string()
      .min(1, t('errors.enterAmount'))
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: t('errors.invalidAmount'),
      }),
    email: z
      .string()
      .min(1, t('errors.emailRequired'))
      .email(t('errors.invalidEmail')),
  });
}

type ExchangeFormData = z.infer<ReturnType<typeof createExchangeSchema>>;

interface ExchangeFormProps {
  currencies: Currency[];
  onSubmit: (data: ExchangeFormData) => Promise<void>;
}

export function ExchangeForm({ currencies, onSubmit }: ExchangeFormProps) {
  const locale = useLocale();
  const format = useFormatter();

  // Разные namespace для переводов
  const t = useTranslations('exchange');
  const tErrors = useTranslations('exchange.errors');
  const tCommon = useTranslations('common');

  // Создаем схему с локализованными сообщениями
  const schema = createExchangeSchema(tErrors);

  const form = useForm<ExchangeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromCurrency: '',
      amount: '',
      email: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedResult, setCalculatedResult] = useState<number | null>(null);

  // Вычисление результата обмена
  const handleAmountChange = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    const selectedCurrency = currencies.find(c => c.code === currency);

    if (!isNaN(numAmount) && selectedCurrency) {
      setCalculatedResult(numAmount * selectedCurrency.rate);
    } else {
      setCalculatedResult(null);
    }
  };

  const handleSubmit = async (data: ExchangeFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      setCalculatedResult(null);
    } catch (error) {
      console.error('Exchange form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* Выбор валюты */}
        <FormField
          control={form.control}
          name="fromCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('selectCrypto')}</FormLabel>
              <FormControl>
                <CurrencySelector
                  currencies={currencies}
                  selected={field.value}
                  onSelect={(value) => {
                    field.onChange(value);
                    // Пересчитываем при смене валюты
                    if (form.getValues('amount')) {
                      handleAmountChange(form.getValues('amount'), value);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Количество */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('amount')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  inputMode="decimal"
                  placeholder="0.001"
                  onChange={(e) => {
                    field.onChange(e);
                    handleAmountChange(e.target.value, form.getValues('fromCurrency'));
                  }}
                />
              </FormControl>

              {/* Показ лимитов с локализацией */}
              {form.getValues('fromCurrency') && (
                <div className="text-sm text-muted-foreground">
                  <CurrencyLimits
                    currency={currencies.find(c => c.code === form.getValues('fromCurrency'))}
                  />
                </div>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        {/* Результат вычисления */}
        {calculatedResult && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              {t('youWillReceive')}
            </div>
            <div className="text-2xl font-bold">
              <LocalizedAmount
                amount={calculatedResult}
                currency="UAH"
                locale={locale}
              />
            </div>
          </div>
        )}

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder={getEmailPlaceholder(locale)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Кнопка отправки */}
        <Button
          type="submit"
          disabled={isSubmitting || !form.formState.isValid}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? tCommon('loading') : t('createOrder')}
        </Button>
      </form>
    </Form>
  );
}

// Вспомогательные компоненты
function CurrencyLimits({ currency }: { currency?: Currency }) {
  const t = useTranslations('exchange');

  if (!currency) return null;

  return (
    <span>
      {t('limits', {
        min: currency.minAmount,
        max: currency.maxAmount,
        currency: currency.code,
      })}
    </span>
  );
}

function LocalizedAmount({
  amount,
  currency,
  locale
}: {
  amount: number;
  currency: string;
  locale: string;
}) {
  const format = useFormatter();

  return (
    <span>
      {format.number(amount, {
        style: 'currency',
        currency: currency,
        locale,
      })}
    </span>
  );
}

// Локализованные плейсхолдеры
function getEmailPlaceholder(locale: string): string {
  const placeholders = {
    uk: 'example@gmail.com',
    en: 'john@example.com',
    ru: 'example@mail.ru',
  };

  return placeholders[locale as keyof typeof placeholders] || placeholders.en;
}
```

## ⚡ Этап 3: Производительность локализованных компонентов _(15 мин)_

### 1. Оптимизация рендеринга:

```typescript
// 📁 apps/web/src/components/optimized/LocalizedComponent.tsx

import { memo, useMemo, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';

// ✅ Мемоизация компонента для предотвращения лишних ререндеров
export const OptimizedLocalizedComponent = memo(function LocalizedComponent({
  data,
  onAction,
}: {
  data: any[];
  onAction: (id: string) => void;
}) {
  const locale = useLocale();
  const t = useTranslations('component');

  // ✅ Мемоизация адаптации для локали
  const adaptation = useMemo(() => {
    return getComponentAdaptation(locale);
  }, [locale]);

  // ✅ Мемоизация отформатированных данных
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedPrice: formatCurrency(item.price, locale),
      formattedDate: formatDate(item.date, locale),
      localizedStatus: t(`status.${item.status}`),
    }));
  }, [data, locale, t]);

  // ✅ Стабильные обработчики событий
  const handleAction = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return (
    <div
      className={adaptation.layout.className}
      style={adaptation.colors}
    >
      {formattedData.map(item => (
        <LocalizedItem
          key={item.id}
          item={item}
          onAction={handleAction}
          adaptation={adaptation}
        />
      ))}
    </div>
  );
});

// ✅ Мемоизация отдельных элементов
const LocalizedItem = memo(function LocalizedItem({
  item,
  onAction,
  adaptation,
}: {
  item: any;
  onAction: (id: string) => void;
  adaptation: ComponentAdaptation;
}) {
  return (
    <div className={adaptation.layout.itemClassName}>
      <span>{item.formattedPrice}</span>
      <span>{item.formattedDate}</span>
      <span>{item.localizedStatus}</span>
      <button onClick={() => onAction(item.id)}>
        Action
      </button>
    </div>
  );
});
```

### 2. Ленивая загрузка локализованного контента:

```typescript
// 📁 apps/web/src/components/lazy/LazyLocalizedContent.tsx

import { lazy, Suspense, useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

// ✅ Динамическая загрузка компонентов по локали
const LocalizedComponents = {
  uk: lazy(() => import('./localized/UkrainianComponent')),
  en: lazy(() => import('./localized/EnglishComponent')),
  ru: lazy(() => import('./localized/RussianComponent')),
};

export function LazyLocalizedContent() {
  const locale = useLocale();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Загружаем компонент для текущей локали
    const loadComponent = async () => {
      const ComponentClass = LocalizedComponents[locale as keyof typeof LocalizedComponents];
      if (ComponentClass) {
        setComponent(() => ComponentClass);
      }
    };

    loadComponent();
  }, [locale]);

  if (!Component) {
    return <LocalizedSkeleton />;
  }

  return (
    <Suspense fallback={<LocalizedSkeleton />}>
      <Component />
    </Suspense>
  );
}

// ✅ Локализованный скелетон
function LocalizedSkeleton() {
  const locale = useLocale();
  const t = useTranslations('common');

  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="text-center text-muted-foreground">
        {t('loading')}
      </div>
    </div>
  );
}
```

### 3. Кеширование переводов и форматирования:

```typescript
// 📁 apps/web/src/lib/localization-cache.ts

class LocalizationCache {
  private translationCache = new Map<string, string>();
  private formatCache = new Map<string, string>();

  // ✅ Кеширование переводов
  getCachedTranslation(key: string, locale: string, params?: any): string | null {
    const cacheKey = `${locale}:${key}:${JSON.stringify(params || {})}`;
    return this.translationCache.get(cacheKey) || null;
  }

  setCachedTranslation(key: string, locale: string, params: any, value: string): void {
    const cacheKey = `${locale}:${key}:${JSON.stringify(params || {})}`;
    this.translationCache.set(cacheKey, value);

    // Ограничиваем размер кеша
    if (this.translationCache.size > 1000) {
      const firstKey = this.translationCache.keys().next().value;
      this.translationCache.delete(firstKey);
    }
  }

  // ✅ Кеширование форматирования
  getCachedFormat(value: any, type: 'number' | 'date' | 'currency', locale: string): string | null {
    const cacheKey = `${type}:${locale}:${value}`;
    return this.formatCache.get(cacheKey) || null;
  }

  setCachedFormat(
    value: any,
    type: 'number' | 'date' | 'currency',
    locale: string,
    formatted: string
  ): void {
    const cacheKey = `${type}:${locale}:${value}`;
    this.formatCache.set(cacheKey, formatted);

    if (this.formatCache.size > 500) {
      const firstKey = this.formatCache.keys().next().value;
      this.formatCache.delete(firstKey);
    }
  }

  // ✅ Очистка кеша
  clearCache(): void {
    this.translationCache.clear();
    this.formatCache.clear();
  }

  // ✅ Статистика кеша
  getCacheStats() {
    return {
      translations: this.translationCache.size,
      formats: this.formatCache.size,
      totalMemory: this.estimateMemoryUsage(),
    };
  }

  private estimateMemoryUsage(): string {
    const translationSize = Array.from(this.translationCache.entries()).reduce(
      (size, [key, value]) => size + key.length + value.length,
      0
    );

    const formatSize = Array.from(this.formatCache.entries()).reduce(
      (size, [key, value]) => size + key.length + value.length,
      0
    );

    const totalBytes = (translationSize + formatSize) * 2; // Примерно 2 байта на символ
    return `${(totalBytes / 1024).toFixed(2)} KB`;
  }
}

// Singleton instance
export const localizationCache = new LocalizationCache();

// ✅ Хук с кешированием
export function useCachedTranslation(namespace: string) {
  const locale = useLocale();
  const t = useTranslations(namespace);

  return useCallback(
    (key: string, params?: any) => {
      // Проверяем кеш
      const cached = localizationCache.getCachedTranslation(key, locale, params);
      if (cached) {
        return cached;
      }

      // Получаем перевод
      const translation = t(key as any, params);

      // Кешируем результат
      localizationCache.setCachedTranslation(key, locale, params, translation);

      return translation;
    },
    [locale, t]
  );
}

// ✅ Хук с кешированным форматированием
export function useCachedFormatter() {
  const locale = useLocale();
  const format = useFormatter();

  return {
    number: useCallback(
      (value: number, options?: any) => {
        const cached = localizationCache.getCachedFormat(value, 'number', locale);
        if (cached) return cached;

        const formatted = format.number(value, options);
        localizationCache.setCachedFormat(value, 'number', locale, formatted);
        return formatted;
      },
      [locale, format]
    ),

    date: useCallback(
      (value: Date, options?: any) => {
        const cached = localizationCache.getCachedFormat(value.getTime(), 'date', locale);
        if (cached) return cached;

        const formatted = format.dateTime(value, options);
        localizationCache.setCachedFormat(value.getTime(), 'date', locale, formatted);
        return formatted;
      },
      [locale, format]
    ),

    currency: useCallback(
      (value: number, currency: string) => {
        const cacheKey = `${value}:${currency}`;
        const cached = localizationCache.getCachedFormat(cacheKey, 'currency', locale);
        if (cached) return cached;

        const formatted = format.number(value, {
          style: 'currency',
          currency,
        });
        localizationCache.setCachedFormat(cacheKey, 'currency', locale, formatted);
        return formatted;
      },
      [locale, format]
    ),
  };
}
```

### 4. Мониторинг производительности:

```typescript
// 📁 apps/web/src/lib/localization-performance.ts

export class LocalizationPerformanceMonitor {
  private metrics = new Map<string, number[]>();

  // ✅ Измерение времени рендеринга локализованных компонентов
  measureRender(componentName: string, renderFn: () => React.ReactElement) {
    const startTime = performance.now();

    const result = renderFn();

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.recordMetric(`render:${componentName}`, duration);

    if (duration > 16) { // Больше одного кадра (60fps)
      console.warn(`Slow localized component render: ${componentName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  // ✅ Измерение времени форматирования
  measureFormatting(type: string, formatFn: () => string) {
    const startTime = performance.now();

    const result = formatFn();

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.recordMetric(`format:${type}`, duration);

    return result;
  }

  private recordMetric(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const measurements = this.metrics.get(operation)!;
    measurements.push(duration);

    // Храним только последние 100 измерений
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  // ✅ Получение отчета о производительности
  getPerformanceReport() {
    const report: Record<string, any> = {};

    for (const [operation, measurements] of this.metrics.entries()) {
      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const max = Math.max(...measurements);
      const min = Math.min(...measurements);

      report[operation] = {
        count: measurements.length,
        average: parseFloat(avg.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        status: avg > 16 ? 'slow' : avg > 8 ? 'moderate' : 'fast',
      };
    }

    return report;
  }
}

// Глобальный монитор
export const localizationPerformance = new LocalizationPerformanceMonitor();

// ✅ HOC для мониторинга производительности
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function MonitoredComponent(props: P) {
    return localizationPerformance.measureRender(componentName, () => (
      <Component {...props} />
    ));
  };
}
```

## 🌐 Этап 4: Серверные компоненты и локализация _(20 мин)_

### 1. Серверный компонент с переводами:

```typescript
// 📁 apps/web/src/components/sections/LocalizedHeroSection.tsx
import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';

import { Button } from '@repo/ui';
import { ArrowRight, Shield, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export async function LocalizedHeroSection() {
  const locale = await getLocale();
  const t = await getTranslations('homepage.hero');
  const tFeatures = await getTranslations('homepage.features');

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Текстовый блок */}
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              {t.rich('title', {
                highlight: (chunks) => (
                  <span className="text-primary">{chunks}</span>
                ),
              })}
            </h1>

            <p className="text-lg text-muted-foreground mb-8">
              {t('subtitle')}
            </p>

            {/* Локализованные особенности */}
            <div className="flex flex-wrap gap-4 mb-8">
              <FeatureItem
                icon={<TrendingUp className="h-5 w-5" />}
                text={tFeatures('noCommission.title')}
                description={tFeatures('noCommission.description')}
              />
              <FeatureItem
                icon={<Clock className="h-5 w-5" />}
                text={tFeatures('fastExchange.title')}
                description={tFeatures('fastExchange.description')}
              />
              <FeatureItem
                icon={<Shield className="h-5 w-5" />}
                text={tFeatures('security.title')}
                description={tFeatures('security.description')}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href={`/${locale}/exchange`}>
                  {t('startButton')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" asChild>
                <Link href={`/${locale}/about`}>
                  {t('learnMore')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Визуальный блок с локализованным контентом */}
          <div className="flex justify-center lg:justify-end">
            <LocalizedExchangeWidget locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({
  icon,
  text,
  description
}: {
  icon: React.ReactNode;
  text: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="text-green-500 mt-1 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <span className="font-medium text-sm">{text}</span>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

// Серверный компонент виджета обмена
async function LocalizedExchangeWidget({ locale }: { locale: string }) {
  const t = await getTranslations('exchange');

  // Здесь можно загрузить данные с учетом локали
  const exchangeRates = await getLocalizedExchangeRates(locale);

  return (
    <div className="w-full max-w-md">
      {/* Содержимое виджета с учетом локали */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">{t('title')}</h3>
        {/* ... остальной контент */}
      </div>
    </div>
  );
}

// Функция для получения курсов с учетом локали
async function getLocalizedExchangeRates(locale: string) {
  // Здесь можно настроить разные источники данных
  // или валюты в зависимости от локали
  return {
    // Данные курсов
  };
}
```

### 2. Локализованные метаданные:

```typescript
// 📁 apps/web/src/components/seo/LocalizedMetadata.tsx
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

interface LocalizedMetadataParams {
  locale: string;
  namespace?: string;
  params?: Record<string, string>;
}

export async function generateLocalizedMetadata({
  locale,
  namespace = 'metadata',
  params = {},
}: LocalizedMetadataParams): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });

  // Базовые метаданные
  const metadata: Metadata = {
    title: t('title', params),
    description: t('description', params),

    // Открытые графики
    openGraph: {
      title: t('title', params),
      description: t('description', params),
      type: 'website',
      locale,
      images: [
        {
          url: `/images/og-${locale}.jpg`,
          width: 1200,
          height: 630,
          alt: t('title', params),
        },
      ],
    },

    // Twitter карточки
    twitter: {
      card: 'summary_large_image',
      title: t('title', params),
      description: t('description', params),
      images: [`/images/twitter-${locale}.jpg`],
    },

    // Языковые альтернативы
    alternates: {
      languages: {
        uk: `/uk${params.path || ''}`,
        en: `/en${params.path || ''}`,
        ru: `/ru${params.path || ''}`,
      },
      canonical: `/${locale}${params.path || ''}`,
    },
  };

  // Специфичные для локали настройки
  if (locale === 'uk') {
    metadata.keywords = t('keywords.uk');
  } else if (locale === 'en') {
    metadata.keywords = t('keywords.en');
  } else if (locale === 'ru') {
    metadata.keywords = t('keywords.ru');
  }

  return metadata;
}
```

## ✅ Проверка знаний

### Вопросы для самоконтроля:

1. **Локализация компонентов**:
   - Как правильно структурировать компоненты для поддержки локализации?
   - Когда использовать клиентские, а когда серверные компоненты?
   - Как обрабатывать условную логику по языкам?

2. **Формы и валидация**:
   - Как локализовать сообщения валидации?
   - Как адаптировать форматы ввода под локаль?
   - Как обеспечить корректную работу с числами и датами?

3. **SEO и метаданные**:
   - Как генерировать локализованные метаданные?
   - Как настроить правильные языковые альтернативы?
   - Как оптимизировать для поисковых систем разных стран?

### 💻 Практическое задание

**Создайте продвинутую систему локализованных компонентов для торговой панели ExchangeGO:**

#### Этап 1: Анализ требований _(5 мин)_

**Компоненты торговой панели:**

- 📊 **TradingChart** - график курсов с локализованными подписями
- 📋 **OrderBook** - книга заявок с форматированием чисел
- 💰 **BalanceWidget** - баланс пользователя с валютами
- 📈 **PriceAlerts** - уведомления о изменении цен
- 🔄 **QuickTrade** - быстрая торговля

**Локализационные требования:**

- Разные форматы чисел (1,234.56 vs 1 234,56)
- Культурные цвета (красный/зеленый для роста/падения)
- Локальные валюты (UAH, USD, EUR)
- Формальность обращения (ты/вы)

#### Этап 2: Создание адаптивной системы _(15 мин)_

```typescript
// 📁 apps/web/src/components/trading/TradingPanel.tsx

interface TradingPanelProps {
  userId: string;
  initialData: TradingData;
}

export function TradingPanel({ userId, initialData }: TradingPanelProps) {
  // TODO: Реализуйте с использованием:

  // ✅ Локализационные хуки
  const locale = useLocale();
  const t = useCachedTranslation('trading');
  const format = useCachedFormatter();

  // ✅ Адаптация под локаль
  const adaptation = useMemo(() => getComponentAdaptation(locale), [locale]);

  // ✅ Условный рендеринг по культуре
  return (
    <LocalizedWrapper locale={locale} adaptations={tradingAdaptations}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* График - адаптируется под локаль */}
        <div className="lg:col-span-2">
          <LocalizedTradingChart
            data={initialData.chartData}
            locale={locale}
            adaptation={adaptation}
          />
        </div>

        {/* Боковая панель */}
        <div className="space-y-4">
          <ConditionalRender when={{ formal: true }}>
            <WelcomeMessage formal />
          </ConditionalRender>

          <ConditionalRender when={{ formal: false }}>
            <WelcomeMessage informal />
          </ConditionalRender>

          <LocalizedBalanceWidget
            balance={initialData.balance}
            locale={locale}
          />

          <LocalizedOrderBook
            orders={initialData.orders}
            locale={locale}
          />
        </div>
      </div>
    </LocalizedWrapper>
  );
}
```

#### Этап 3: Компонент графика с культурной адаптацией _(15 мин)_

```typescript
// 📁 apps/web/src/components/trading/LocalizedTradingChart.tsx

interface LocalizedTradingChartProps {
  data: ChartData[];
  locale: string;
  adaptation: ComponentAdaptation;
}

export function LocalizedTradingChart({ data, locale, adaptation }: LocalizedTradingChartProps) {
  // TODO: Реализуйте с учетом:

  // ✅ Культурные цвета для роста/падения
  const culturalColors = useMemo(() => {
    // В западной культуре: зеленый = рост, красный = падение
    // В азиатской культуре: красный = рост, зеленый = падение
    const culture = getCultureByLocale(locale);

    return culture === 'eastern' ? {
      positive: '#DC3545', // Красный для роста
      negative: '#28A745', // Зеленый для падения
    } : {
      positive: '#28A745', // Зеленый для роста
      negative: '#DC3545', // Красный для падения
    };
  }, [locale]);

  // ✅ Локализованные подписи осей
  const axisLabels = useMemo(() => ({
    x: t('chart.timeAxis'),
    y: t('chart.priceAxis'),
    volume: t('chart.volumeAxis'),
  }), [t]);

  // ✅ Форматирование чисел для подписей
  const formatPrice = useCallback((price: number) => {
    return format.currency(price, adaptation.currency);
  }, [format, adaptation]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {t('chart.title')}
        </h3>

        {/* Переключатель временных интервалов */}
        <div className="flex space-x-2">
          {['1H', '1D', '1W', '1M'].map(interval => (
            <Button
              key={interval}
              variant="outline"
              size="sm"
              className={adaptation.layout.buttonClass}
            >
              {t(`chart.intervals.${interval.toLowerCase()}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Здесь будет график с библиотекой типа Chart.js или Recharts */}
      <div className="h-96 relative">
        <ResponsiveChart
          data={data}
          colors={culturalColors}
          formatters={{
            price: formatPrice,
            volume: (vol: number) => format.number(vol, { notation: 'compact' }),
            time: (time: Date) => format.date(time, {
              month: 'short',
              day: 'numeric',
              hour: locale === 'en' ? 'numeric' : '2-digit'
            }),
          }}
          labels={axisLabels}
          rtl={adaptation.layout.direction === 'rtl'}
        />
      </div>
    </Card>
  );
}
```

#### Этап 4: Виджет баланса с валютной локализацией _(10 мин)_

```typescript
// 📁 apps/web/src/components/trading/LocalizedBalanceWidget.tsx

interface Balance {
  currency: string;
  amount: number;
  usdValue: number;
}

interface LocalizedBalanceWidgetProps {
  balance: Balance[];
  locale: string;
}

export function LocalizedBalanceWidget({ balance, locale }: LocalizedBalanceWidgetProps) {
  const t = useCachedTranslation('trading.balance');
  const format = useCachedFormatter();

  // TODO: Реализуйте с функциями:

  // ✅ Сортировка валют по предпочтениям локали
  const sortedBalance = useMemo(() => {
    const currencyPriority = getCurrencyPriorityByLocale(locale);

    return [...balance].sort((a, b) => {
      const priorityA = currencyPriority[a.currency] || 999;
      const priorityB = currencyPriority[b.currency] || 999;
      return priorityA - priorityB;
    });
  }, [balance, locale]);

  // ✅ Общий баланс в локальной валюте
  const totalBalance = useMemo(() => {
    const total = balance.reduce((sum, item) => sum + item.usdValue, 0);
    const localCurrency = getLocalCurrencyByLocale(locale);
    return convertCurrency(total, 'USD', localCurrency);
  }, [balance, locale]);

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3">{t('title')}</h4>

      {/* Общий баланс */}
      <div className="mb-4 p-3 bg-muted rounded">
        <div className="text-sm text-muted-foreground">{t('total')}</div>
        <div className="text-xl font-bold">
          {format.currency(totalBalance.amount, totalBalance.currency)}
        </div>
      </div>

      {/* Список валют */}
      <div className="space-y-2">
        {sortedBalance.map(item => (
          <BalanceItem
            key={item.currency}
            balance={item}
            locale={locale}
            format={format}
          />
        ))}
      </div>
    </Card>
  );
}

// Вспомогательные функции
function getCurrencyPriorityByLocale(locale: string): Record<string, number> {
  const priorities = {
    uk: { UAH: 1, BTC: 2, ETH: 3, USDT: 4, USD: 5 },
    en: { USD: 1, BTC: 2, ETH: 3, USDT: 4, EUR: 5 },
    ru: { RUB: 1, USDT: 2, BTC: 3, ETH: 4, USD: 5 },
  };

  return priorities[locale as keyof typeof priorities] || priorities.en;
}
```

#### Этап 5: Тестирование и оптимизация _(10 мин)_

```typescript
// 📁 apps/web/src/__tests__/trading-localization.test.tsx

describe('Trading Panel Localization', () => {
  // TODO: Создайте тесты для:

  test('отображает правильные культурные цвета', () => {
    // Проверьте что восточные локали используют красный для роста
  });

  test('форматирует числа согласно локали', () => {
    // Проверьте форматы: 1,234.56 vs 1 234,56
  });

  test('сортирует валюты по приоритету локали', () => {
    // Проверьте что UAH первая для украинской локали
  });

  test('использует правильную формальность', () => {
    // Проверьте обращение на "ты" vs "вы"
  });

  test('адаптирует layout под направление текста', () => {
    // Проверьте RTL поддержку
  });
});

// Тесты производительности
describe('Trading Panel Performance', () => {
  test('рендерится быстрее 16ms', () => {
    // Измерьте время рендеринга
  });

  test('кеширует переводы эффективно', () => {
    // Проверьте работу кеша
  });
});
```

#### ✅ Критерии оценки (70 баллов):

**Локализационная адаптация (25 баллов):**

- [ ] Культурные цвета и символы (8 баллов)
- [ ] Форматирование чисел и валют (8 баллов)
- [ ] Адаптация layout под язык (9 баллов)

**Функциональность (20 баллов):**

- [ ] Условный рендеринг по локали (7 баллов)
- [ ] Правильная сортировка и приоритеты (6 баллов)
- [ ] Обработка edge cases (7 баллов)

**Производительность (15 баллов):**

- [ ] Мемоизация и оптимизация (8 баллов)
- [ ] Кеширование переводов (7 баллов)

**Тестирование (10 баллов):**

- [ ] Unit тесты для локализации (6 баллов)
- [ ] Performance тесты (4 балла)

#### 🎯 Ожидаемый результат:

**Production-ready торговая панель которая:**

- Адаптируется под культурные особенности каждого рынка
- Правильно форматирует числа и валюты для каждой локали
- Использует подходящие цвета и символы для каждой культуры
- Оптимизирована для производительности с кешированием
- Полностью протестирована на всех локалях

## 📚 Дополнительные материалы

### Best Practices:

- [React Intl Best Practices](https://formatjs.io/docs/react-intl/) - рекомендации по локализации
- [Web Internationalization](https://www.w3.org/International/) - стандарты W3C
- [Unicode CLDR](https://cldr.unicode.org/) - данные локализации

### Инструменты:

- [React Intl](https://formatjs.io/docs/react-intl/) - альтернатива next-intl
- [Linguijs](https://lingui.js.org/) - современная библиотека i18n
- [ttag](https://ttag.js.org/) - минималистичная i18n

---

**🎉 Отлично! Теперь ваши компоненты говорят на языке пользователей.**

В следующем уроке изучим [форматирование дат, чисел и валют](./lesson-7.4-formatting-localization.md) для разных культур.

---

[← Урок 7.2: Переводы и ключи](./lesson-7.2-translations-keys.md) | [Урок 7.4: Форматирование →](./lesson-7.4-formatting-localization.md)
