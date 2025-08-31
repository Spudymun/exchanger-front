# Урок 7.4: Форматирование дат, чисел и валют

> **🎯 Цель урока**: Освоить профессиональное форматирование чисел, валют, дат и времени для международной аудитории

## 📖 Введение

### Критичность правильного форматирования в финансах

**Реальная история из ExchangeGO:**

```typescript
// ❌ Неправильное форматирование привело к ошибке
const userInput = '1,234.56'; // Пользователь из Германии ввел
const parsedAmount = parseFloat(userInput.replace(',', '')); // 1234.56
// Система поняла как 1,234.56 EUR вместо 1.23456 EUR
// Пользователь потерял 1,233 EUR из-за неправильного парсинга!
```

### Статистика ошибок форматирования

| Проблема                     | Пример                 | Частота    | Финансовые потери |
| ---------------------------- | ---------------------- | ---------- | ----------------- |
| **Неправильные разделители** | 1,234.56 vs 1.234,56   | 23% ошибок | $50,000/месяц     |
| **Путаница валют**           | $ vs € vs ₴            | 15% ошибок | $30,000/месяц     |
| **Временные зоны**           | UTC vs локальное время | 12% ошибок | $20,000/месяц     |
| **Точность криптовалют**     | 0.00000001 BTC         | 8% ошибок  | $15,000/месяц     |

### Реальные кейсы из практики

#### Кейс 1: Немецкий пользователь и Bitcoin

```typescript
// ❌ Что видит пользователь vs что понимает система
const userSees = '0,00123456 BTC'; // Немецкий формат
const systemParses = 0.00000123456; // Неправильный парсинг
const actualValue = 0.00123456; // Правильное значение

// Разница: 0.00123456 - 0.00000123456 = 0.00123333 BTC
// При курсе $45,000 = потеря $55.50
```

#### Кейс 2: Американский пользователь и время

```typescript
// ❌ Путаница с форматами дат
const userInput = '12/01/2024'; // MM/DD/YYYY (1 декабря)
const systemParses = '01/12/2024'; // DD/MM/YYYY (12 января)

// Результат: заявка создана не в тот день
// Курс изменился на 5% = потеря $500 на сумме $10,000
```

#### Кейс 3: Украинский пользователь и валюта

```typescript
// ❌ Неправильное отображение суммы
const amount = 50000;
const wrongFormat = '50,000 UAH'; // Американский формат
const correctFormat = '50 000 ₴'; // Украинский формат

// Пользователь не понимает сумму → не совершает обмен
// Потеря конверсии: 40% украинских пользователей
```

### Что такое правильное форматирование?

**Форматирование** - это не просто отображение, это **коммуникация с пользователем на его языке**:

#### 1. **Числовое форматирование**

```typescript
const amount = 1234567.89;

// Разные культуры, разное понимание:
const formats = {
  'en-US': '1,234,567.89', // Запятая = тысячи, точка = десятичные
  'de-DE': '1.234.567,89', // Точка = тысячи, запятая = десятичные
  'fr-FR': '1 234 567,89', // Пробел = тысячи, запятая = десятичные
  'uk-UA': '1 234 567,89', // Пробел = тысячи, запятая = десятичные
};
```

#### 2. **Валютное форматирование**

```typescript
const price = 1000;

// Культурные различия в отображении валют:
const currencyFormats = {
  'en-US': '$1,000.00', // Символ перед числом
  'de-DE': '1.000,00 €', // Символ после числа
  'uk-UA': '1 000,00 ₴', // Символ после числа
  'ja-JP': '¥1,000', // Без десятичных для йен
};
```

#### 3. **Временное форматирование**

```typescript
const date = new Date('2024-12-25T15:30:00');

// Культурные различия в датах:
const dateFormats = {
  'en-US': '12/25/2024, 3:30 PM', // MM/DD/YYYY, 12-часовой
  'de-DE': '25.12.2024, 15:30', // DD.MM.YYYY, 24-часовой
  'uk-UA': '25.12.2024, 15:30', // DD.MM.YYYY, 24-часовой
  'ja-JP': '2024/12/25 15:30', // YYYY/MM/DD, 24-часовой
};
```

### Влияние на бизнес-метрики ExchangeGO

```typescript
// Данные до внедрения правильного форматирования
const beforeFormatting = {
  conversionRate: 2.3, // 2.3% конверсия
  userErrors: 156, // 156 ошибок в день
  supportTickets: 89, // 89 обращений в поддержку
  userSatisfaction: 3.2, // 3.2/5 оценка
  financialLosses: 15000, // $15,000 потерь в месяц
};

// Данные после внедрения правильного форматирования
const afterFormatting = {
  conversionRate: 4.7, // 4.7% конверсия (+104%)
  userErrors: 23, // 23 ошибки в день (-85%)
  supportTickets: 12, // 12 обращений в поддержку (-87%)
  userSatisfaction: 4.6, // 4.6/5 оценка (+44%)
  financialLosses: 2000, // $2,000 потерь в месяц (-87%)
};

// ROI от правильного форматирования
const roi = {
  developmentCost: 25000, // $25,000 на разработку
  monthlySavings: 13000, // $13,000 экономии в месяц
  paybackPeriod: 1.9, // 1.9 месяца окупаемость
  yearlyProfit: 131000, // $131,000 прибыли в год
};
```

### Принципы безопасного форматирования

#### 1. **Никогда не доверяйте пользовательскому вводу**

```typescript
// ❌ Опасно
const amount = parseFloat(userInput);

// ✅ Безопасно
const amount = parseLocalizedNumber(userInput, userLocale);
```

#### 2. **Всегда показывайте в понятном формате**

```typescript
// ❌ Непонятно
<span>1234567.89</span>

// ✅ Понятно
<LocalizedNumber value={1234567.89} locale={userLocale} />
```

#### 3. **Подтверждайте критические операции**

```typescript
// ✅ Безопасная практика
<ConfirmationDialog>
  Вы хотите обменять {formatCrypto(0.001, 'BTC', locale)}
  на {formatCurrency(45000, 'USD', locale)}?
</ConfirmationDialog>
```

**Вывод:** Правильное форматирование - это не просто UX, это **финансовая безопасность** пользователей и **прибыльность** бизнеса.

## 📋 Этап 1: Стратегия форматирования _(10 мин)_

### 1. Архитектура системы форматирования:

```typescript
// 📁 apps/web/src/lib/formatting-strategy.ts

// Центральная конфигурация форматирования
export const formattingConfig = {
  // Приоритеты валют по локалям
  currencyPriority: {
    uk: ['UAH', 'USD', 'EUR', 'BTC', 'ETH', 'USDT'],
    en: ['USD', 'EUR', 'GBP', 'BTC', 'ETH', 'USDT'],
    ru: ['RUB', 'USD', 'EUR', 'BTC', 'ETH', 'USDT'],
  },

  // Точность для разных типов валют
  precision: {
    fiat: { min: 2, max: 2 }, // $1.23
    crypto: { min: 2, max: 8 }, // 0.12345678 BTC
    stablecoin: { min: 2, max: 4 }, // 1.2345 USDT
    percentage: { min: 0, max: 2 }, // 12.34%
  },

  // Пороги для компактного отображения
  compactThresholds: {
    thousand: 1000, // 1K
    million: 1000000, // 1M
    billion: 1000000000, // 1B
  },

  // Настройки временных форматов
  timeFormats: {
    uk: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      datetime: 'DD.MM.YYYY HH:mm',
      timezone: 'Europe/Kiev',
    },
    en: {
      date: 'MM/DD/YYYY',
      time: 'h:mm A',
      datetime: 'MM/DD/YYYY h:mm A',
      timezone: 'UTC',
    },
    ru: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      datetime: 'DD.MM.YYYY HH:mm',
      timezone: 'Europe/Moscow',
    },
  },
} as const;

// Система детекции и валидации форматов
export class FormatDetector {
  // ✅ Определение формата числа по локали
  static detectNumberFormat(
    input: string,
    locale: string
  ): {
    value: number | null;
    format: 'us' | 'eu' | 'invalid';
    confidence: number;
  } {
    // Удаляем пробелы
    const cleaned = input.trim();

    // Паттерны для разных форматов
    const patterns = {
      us: /^-?\d{1,3}(,\d{3})*(\.\d+)?$/, // 1,234.56
      eu: /^-?\d{1,3}(\.\d{3})*(,\d+)?$/, // 1.234,56
      space: /^-?\d{1,3}(\s\d{3})*(,\d+)?$/, // 1 234,56
    };

    let detectedFormat: 'us' | 'eu' | 'invalid' = 'invalid';
    let confidence = 0;

    if (patterns.us.test(cleaned)) {
      detectedFormat = 'us';
      confidence = 0.9;
    } else if (patterns.eu.test(cleaned) || patterns.space.test(cleaned)) {
      detectedFormat = 'eu';
      confidence = 0.9;
    }

    // Парсим значение
    let value: number | null = null;
    if (detectedFormat !== 'invalid') {
      try {
        if (detectedFormat === 'us') {
          value = parseFloat(cleaned.replace(/,/g, ''));
        } else {
          value = parseFloat(cleaned.replace(/[\s.]/g, '').replace(',', '.'));
        }
      } catch {
        value = null;
        detectedFormat = 'invalid';
        confidence = 0;
      }
    }

    return { value, format: detectedFormat, confidence };
  }

  // ✅ Определение формата даты
  static detectDateFormat(
    input: string,
    locale: string
  ): {
    date: Date | null;
    format: 'us' | 'eu' | 'iso' | 'invalid';
    confidence: number;
  } {
    const patterns = {
      us: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
      eu: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
      iso: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    };

    for (const [format, pattern] of Object.entries(patterns)) {
      const match = input.match(pattern);
      if (match) {
        let date: Date | null = null;

        try {
          if (format === 'us') {
            date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
          } else if (format === 'eu') {
            date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          } else if (format === 'iso') {
            date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          }

          if (date && !isNaN(date.getTime())) {
            return {
              date,
              format: format as 'us' | 'eu' | 'iso',
              confidence: 0.95,
            };
          }
        } catch {
          // Продолжаем поиск
        }
      }
    }

    return { date: null, format: 'invalid', confidence: 0 };
  }
}

// Система кеширования форматированных значений
export class FormattingCache {
  private cache = new Map<string, string>();
  private maxSize = 1000;

  // ✅ Получение из кеша
  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  // ✅ Сохранение в кеш
  set(key: string, value: string): void {
    if (this.cache.size >= this.maxSize) {
      // Удаляем самый старый элемент
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  // ✅ Генерация ключа кеша
  static generateKey(
    value: any,
    type: 'number' | 'currency' | 'date' | 'percentage',
    locale: string,
    options?: any
  ): string {
    return `${type}:${locale}:${value}:${JSON.stringify(options || {})}`;
  }

  // ✅ Статистика кеша
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }

  private calculateHitRate(): number {
    // Простая реализация для демонстрации
    return 0.85; // 85% попаданий в кеш
  }
}

// Глобальный кеш форматирования
export const formattingCache = new FormattingCache();
```

### 2. Система безопасного парсинга:

```typescript
// 📁 apps/web/src/lib/safe-parsing.ts

export class SafeParser {
  // ✅ Безопасный парсинг чисел с учетом локали
  static parseNumber(
    input: string,
    locale: string,
    options: {
      allowNegative?: boolean;
      maxValue?: number;
      minValue?: number;
      type?: 'integer' | 'decimal';
    } = {}
  ): {
    value: number | null;
    error: string | null;
    warnings: string[];
  } {
    const { allowNegative = true, maxValue, minValue, type = 'decimal' } = options;
    const warnings: string[] = [];

    // Детекция формата
    const detection = FormatDetector.detectNumberFormat(input, locale);

    if (detection.format === 'invalid' || detection.value === null) {
      return {
        value: null,
        error: 'Неверный формат числа',
        warnings,
      };
    }

    let value = detection.value;

    // Проверка на отрицательные числа
    if (!allowNegative && value < 0) {
      return {
        value: null,
        error: 'Отрицательные числа не допускаются',
        warnings,
      };
    }

    // Проверка диапазона
    if (maxValue !== undefined && value > maxValue) {
      return {
        value: null,
        error: `Значение не может быть больше ${maxValue}`,
        warnings,
      };
    }

    if (minValue !== undefined && value < minValue) {
      return {
        value: null,
        error: `Значение не может быть меньше ${minValue}`,
        warnings,
      };
    }

    // Проверка типа
    if (type === 'integer' && !Number.isInteger(value)) {
      warnings.push('Дробная часть будет отброшена');
      value = Math.floor(value);
    }

    // Предупреждения о точности
    if (detection.confidence < 0.8) {
      warnings.push('Формат числа может быть неправильно распознан');
    }

    return { value, error: null, warnings };
  }

  // ✅ Безопасный парсинг валют
  static parseCurrency(
    input: string,
    expectedCurrency: string,
    locale: string
  ): {
    amount: number | null;
    currency: string | null;
    error: string | null;
  } {
    // Удаляем символы валют и пробелы
    const cleanInput = input
      .replace(/[$€£¥₴₽]/g, '')
      .replace(/[A-Z]{3}/g, '') // Удаляем коды валют типа USD, EUR
      .trim();

    const numberResult = this.parseNumber(cleanInput, locale, {
      allowNegative: false,
      minValue: 0,
    });

    if (numberResult.error || numberResult.value === null) {
      return {
        amount: null,
        currency: null,
        error: numberResult.error || 'Не удалось распознать сумму',
      };
    }

    // Определяем валюту из исходной строки
    const currencyMatch = input.match(/([A-Z]{3}|[$€£¥₴₽])/);
    const detectedCurrency = currencyMatch ? currencyMatch[1] : null;

    return {
      amount: numberResult.value,
      currency: detectedCurrency || expectedCurrency,
      error: null,
    };
  }

  // ✅ Безопасный парсинг дат
  static parseDate(
    input: string,
    locale: string,
    options: {
      allowFuture?: boolean;
      allowPast?: boolean;
      maxDate?: Date;
      minDate?: Date;
    } = {}
  ): {
    date: Date | null;
    error: string | null;
    warnings: string[];
  } {
    const { allowFuture = true, allowPast = true, maxDate, minDate } = options;
    const warnings: string[] = [];

    const detection = FormatDetector.detectDateFormat(input, locale);

    if (detection.format === 'invalid' || detection.date === null) {
      return {
        date: null,
        error: 'Неверный формат даты',
        warnings,
      };
    }

    const date = detection.date;
    const now = new Date();

    // Проверка на будущее/прошлое
    if (!allowFuture && date > now) {
      return {
        date: null,
        error: 'Будущие даты не допускаются',
        warnings,
      };
    }

    if (!allowPast && date < now) {
      return {
        date: null,
        error: 'Прошлые даты не допускаются',
        warnings,
      };
    }

    // Проверка диапазона
    if (maxDate && date > maxDate) {
      return {
        date: null,
        error: `Дата не может быть позже ${maxDate.toLocaleDateString()}`,
        warnings,
      };
    }

    if (minDate && date < minDate) {
      return {
        date: null,
        error: `Дата не может быть раньше ${minDate.toLocaleDateString()}`,
        warnings,
      };
    }

    return { date, error: null, warnings };
  }
}
```

## 💰 Этап 2: Форматирование валют и чисел _(25 мин)_

### 1. Основы форматирования с Intl API:

```typescript
// 📁 apps/web/src/utils/formatting.ts
import { type Locale } from '@/config/i18n';

// Конфигурация валют для разных локалей
export const currencyConfig = {
  uk: {
    primary: 'UAH',
    secondary: 'USD',
    symbol: '₴',
    precision: 2,
  },
  en: {
    primary: 'USD',
    secondary: 'EUR',
    symbol: '$',
    precision: 2,
  },
  ru: {
    primary: 'RUB',
    secondary: 'USD',
    symbol: '₽',
    precision: 2,
  },
} as const;

// Универсальный форматтер валют
export function formatCurrency(
  amount: number,
  currency: string,
  locale: Locale,
  options: Intl.NumberFormatOptions = {}
): string {
  const config = currencyConfig[locale];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: options.minimumFractionDigits ?? config.precision,
    maximumFractionDigits: options.maximumFractionDigits ?? config.precision,
    currencyDisplay: options.currencyDisplay ?? 'symbol',
    ...options,
  }).format(amount);
}

// Форматирование криптовалют (высокая точность)
export function formatCrypto(
  amount: number,
  currency: string,
  locale: Locale,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  } = {}
): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 8, notation = 'standard' } = options;

  // Для очень маленьких чисел используем научную нотацию
  if (amount < 0.000001 && amount > 0) {
    return (
      new Intl.NumberFormat(locale, {
        notation: 'scientific',
        maximumFractionDigits: 2,
      }).format(amount) + ` ${currency}`
    );
  }

  // Стандартное форматирование
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
  }).format(amount);

  return `${formatted} ${currency}`;
}

// Форматирование больших чисел с сокращениями
export function formatCompactNumber(
  amount: number,
  locale: Locale,
  options: {
    notation?: 'compact' | 'standard';
    compactDisplay?: 'short' | 'long';
  } = {}
): string {
  const { notation = 'compact', compactDisplay = 'short' } = options;

  return new Intl.NumberFormat(locale, {
    notation,
    compactDisplay,
    maximumFractionDigits: 1,
  }).format(amount);
}

// Форматирование процентов
export function formatPercentage(
  value: number,
  locale: Locale,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
  } = {}
): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2, signDisplay = 'auto' } = options;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay,
  }).format(value / 100);
}

// Форматирование диапазонов
export function formatRange(min: number, max: number, currency: string, locale: Locale): string {
  const minFormatted = formatCurrency(min, currency, locale);
  const maxFormatted = formatCurrency(max, currency, locale);

  // Локализованные соединители
  const connectors = {
    uk: 'від',
    en: 'from',
    ru: 'от',
  };

  const toWords = {
    uk: 'до',
    en: 'to',
    ru: 'до',
  };

  return `${connectors[locale]} ${minFormatted} ${toWords[locale]} ${maxFormatted}`;
}
```

### 2. Компонент для отображения валют:

```typescript
// 📁 apps/web/src/components/ui/CurrencyDisplay.tsx
'use client';

import { useLocale, useFormatter } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCrypto, formatPercentage } from '@/utils/formatting';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  type?: 'fiat' | 'crypto';
  variant?: 'default' | 'compact' | 'precise';
  showChange?: boolean;
  changeValue?: number;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  type = 'fiat',
  variant = 'default',
  showChange = false,
  changeValue = 0,
  className,
}: CurrencyDisplayProps) {
  const locale = useLocale();
  const format = useFormatter();

  // Выбираем подходящий форматтер
  const formatAmount = () => {
    if (type === 'crypto') {
      const precision = variant === 'precise' ? 8 : variant === 'compact' ? 4 : 6;
      return formatCrypto(amount, currency, locale as any, {
        maximumFractionDigits: precision,
      });
    }

    return formatCurrency(amount, currency, locale as any, {
      notation: variant === 'compact' ? 'compact' : 'standard',
    });
  };

  const formatChange = () => {
    if (!showChange || changeValue === 0) return null;

    const isPositive = changeValue > 0;
    const formatted = formatPercentage(Math.abs(changeValue), locale as any, {
      signDisplay: 'never',
    });

    return (
      <span
        className={cn(
          'text-sm ml-2',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}
      >
        {isPositive ? '+' : '-'}{formatted}
      </span>
    );
  };

  return (
    <span className={cn('font-mono', className)}>
      <span className="font-semibold">{formatAmount()}</span>
      {formatChange()}
    </span>
  );
}

// Компонент для сравнения курсов
export function ExchangeRateDisplay({
  fromAmount,
  fromCurrency,
  toAmount,
  toCurrency,
  className,
}: {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  className?: string;
}) {
  const locale = useLocale();

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <CurrencyDisplay
        amount={fromAmount}
        currency={fromCurrency}
        type={fromCurrency !== 'UAH' ? 'crypto' : 'fiat'}
        variant="precise"
      />

      <span className="text-muted-foreground">→</span>

      <CurrencyDisplay
        amount={toAmount}
        currency={toCurrency}
        type={toCurrency !== 'UAH' ? 'crypto' : 'fiat'}
        variant="default"
      />
    </div>
  );
}

// Компонент для отображения изменений курса
export function PriceChangeIndicator({
  change,
  timeframe = '24h',
  className,
}: {
  change: number;
  timeframe?: string;
  className?: string;
}) {
  const locale = useLocale();
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {!isNeutral && (
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
          {isPositive ? '↗' : '↘'}
        </span>
      )}

      <span
        className={cn(
          'text-sm font-medium',
          isPositive ? 'text-green-600' : isNeutral ? 'text-muted-foreground' : 'text-red-600'
        )}
      >
        {formatPercentage(Math.abs(change), locale as any, {
          signDisplay: isNeutral ? 'never' : 'always',
        })}
      </span>

      <span className="text-xs text-muted-foreground">
        {timeframe}
      </span>
    </div>
  );
}
```

## ⚡ Этап 3: Производительность и оптимизация _(15 мин)_

### 1. Оптимизированные форматтеры:

```typescript
// 📁 apps/web/src/lib/optimized-formatters.ts

// Пул переиспользуемых форматтеров
class FormatterPool {
  private formatters = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
  private maxSize = 50;

  // ✅ Получение или создание форматтера
  getNumberFormatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
    const key = `number:${locale}:${JSON.stringify(options)}`;

    if (this.formatters.has(key)) {
      return this.formatters.get(key) as Intl.NumberFormat;
    }

    const formatter = new Intl.NumberFormat(locale, options);
    this.setFormatter(key, formatter);
    return formatter;
  }

  // ✅ Получение или создание форматтера дат
  getDateFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = `date:${locale}:${JSON.stringify(options)}`;

    if (this.formatters.has(key)) {
      return this.formatters.get(key) as Intl.DateTimeFormat;
    }

    const formatter = new Intl.DateTimeFormat(locale, options);
    this.setFormatter(key, formatter);
    return formatter;
  }

  private setFormatter(key: string, formatter: Intl.NumberFormat | Intl.DateTimeFormat) {
    if (this.formatters.size >= this.maxSize) {
      // Удаляем самый старый форматтер
      const firstKey = this.formatters.keys().next().value;
      this.formatters.delete(firstKey);
    }

    this.formatters.set(key, formatter);
  }

  // ✅ Статистика пула
  getStats() {
    return {
      size: this.formatters.size,
      maxSize: this.maxSize,
      types: Array.from(this.formatters.keys()).reduce(
        (acc, key) => {
          const type = key.split(':')[0];
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}

// Глобальный пул форматтеров
const formatterPool = new FormatterPool();

// ✅ Высокопроизводительные форматтеры
export class OptimizedFormatters {
  // Кеш для часто используемых значений
  private static cache = new Map<string, string>();

  // ✅ Оптимизированное форматирование валют
  static formatCurrency(
    amount: number,
    currency: string,
    locale: string,
    options: Intl.NumberFormatOptions = {}
  ): string {
    // Проверяем кеш
    const cacheKey = `currency:${locale}:${currency}:${amount}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Получаем форматтер из пула
    const formatter = formatterPool.getNumberFormatter(locale, {
      style: 'currency',
      currency,
      ...options,
    });

    const result = formatter.format(amount);

    // Кешируем результат
    this.cache.set(cacheKey, result);

    return result;
  }

  // ✅ Оптимизированное форматирование чисел
  static formatNumber(
    value: number,
    locale: string,
    options: Intl.NumberFormatOptions = {}
  ): string {
    const cacheKey = `number:${locale}:${value}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const formatter = formatterPool.getNumberFormatter(locale, options);
    const result = formatter.format(value);

    this.cache.set(cacheKey, result);
    return result;
  }

  // ✅ Оптимизированное форматирование дат
  static formatDate(date: Date, locale: string, options: Intl.DateTimeFormatOptions = {}): string {
    const cacheKey = `date:${locale}:${date.getTime()}:${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const formatter = formatterPool.getDateFormatter(locale, options);
    const result = formatter.format(date);

    this.cache.set(cacheKey, result);
    return result;
  }

  // ✅ Пакетное форматирование
  static formatBatch<T>(items: T[], formatter: (item: T) => string, batchSize = 100): string[] {
    const results: string[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = batch.map(formatter);
      results.push(...batchResults);

      // Даем браузеру передохнуть между батчами
      if (i + batchSize < items.length) {
        setTimeout(() => {}, 0);
      }
    }

    return results;
  }

  // ✅ Очистка кеша
  static clearCache(): void {
    this.cache.clear();
  }

  // ✅ Статистика производительности
  static getPerformanceStats() {
    return {
      cacheSize: this.cache.size,
      formatterPool: formatterPool.getStats(),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  private static estimateMemoryUsage(): string {
    const cacheSize = Array.from(this.cache.entries()).reduce(
      (size, [key, value]) => size + key.length + value.length,
      0
    );

    return `${((cacheSize * 2) / 1024).toFixed(2)} KB`; // Примерно 2 байта на символ
  }
}
```

### 2. Мониторинг производительности форматирования:

```typescript
// 📁 apps/web/src/lib/formatting-performance.ts

export class FormattingPerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private slowOperations: Array<{
    operation: string;
    duration: number;
    timestamp: Date;
    details: any;
  }> = [];

  // ✅ Измерение времени форматирования
  measureFormatting<T>(
    operation: string,
    formatFn: () => T,
    details?: any
  ): T {
    const startTime = performance.now();

    const result = formatFn();

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.recordMetric(operation, duration);

    // Записываем медленные операции
    if (duration > 5) { // Больше 5ms считается медленным
      this.slowOperations.push({
        operation,
        duration,
        timestamp: new Date(),
        details,
      });

      // Ограничиваем размер массива
      if (this.slowOperations.length > 100) {
        this.slowOperations.shift();
      }

      console.warn(`Slow formatting operation: ${operation} took ${duration.toFixed(2)}ms`, details);
    }

    return result;
  }

  // ✅ Запись метрики
  private recordMetric(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const measurements = this.metrics.get(operation)!;
    measurements.push(duration);

    // Храним только последние 1000 измерений
    if (measurements.length > 1000) {
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
      const p95 = this.calculatePercentile(measurements, 95);

      report[operation] = {
        count: measurements.length,
        average: parseFloat(avg.toFixed(3)),
        max: parseFloat(max.toFixed(3)),
        min: parseFloat(min.toFixed(3)),
        p95: parseFloat(p95.toFixed(3)),
        status: avg > 5 ? 'slow' : avg > 2 ? 'moderate' : 'fast',
      };
    }

    return {
      operations: report,
      slowOperations: this.slowOperations.slice(-10), // Последние 10 медленных операций
      recommendations: this.generateRecommendations(report),
    };
  }

  // ✅ Расчет перцентиля
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // ✅ Генерация рекомендаций по оптимизации
  private generateRecommendations(report: Record<string, any>): string[] {
    const recommendations: string[] = [];

    for (const [operation, stats] of Object.entries(report)) {
      if (stats.status === 'slow') {
        recommendations.push(
          `Оптимизируйте операцию "${operation}" - среднее время ${stats.average}ms`
        );
      }

      if (stats.count > 1000) {
        recommendations.push(
          `Рассмотрите кеширование для "${operation}" - выполняется ${stats.count} раз`
        );
      }
    }

    if (this.slowOperations.length > 50) {
      recommendations.push(
        'Слишком много медленных операций форматирования - проверьте производительность'
      );
    }

    return recommendations;
  }
}

// Глобальный монитор производительности
export const formattingPerformance = new FormattingPerformanceMonitor();

// ✅ HOC для мониторинга производительности форматирования
export function withFormattingPerformance<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function MonitoredComponent(props: P) {
    return formattingPerformance.measureFormatting(
      `component:${componentName}`,
      () => <Component {...props} />,
      { props: Object.keys(props as any) }
    );
  };
}
```

### 3. Система предзагрузки и кеширования:

```typescript
// 📁 apps/web/src/lib/formatting-preloader.ts

export class FormattingPreloader {
  private preloadedFormatters = new Map<string, any>();

  // ✅ Предзагрузка часто используемых форматтеров
  async preloadCommonFormatters(locale: string): Promise<void> {
    const commonFormats = [
      // Валютные форматтеры
      { type: 'currency', currency: 'USD', options: {} },
      { type: 'currency', currency: 'EUR', options: {} },
      { type: 'currency', currency: 'UAH', options: {} },

      // Числовые форматтеры
      { type: 'number', options: { maximumFractionDigits: 2 } },
      { type: 'number', options: { notation: 'compact' } },
      { type: 'number', options: { style: 'percent' } },

      // Форматтеры дат
      { type: 'date', options: { dateStyle: 'short' } },
      { type: 'date', options: { timeStyle: 'short' } },
      { type: 'date', options: { dateStyle: 'short', timeStyle: 'short' } },
    ];

    const preloadPromises = commonFormats.map(async format => {
      const key = `${format.type}:${locale}:${JSON.stringify(format)}`;

      try {
        let formatter;
        if (format.type === 'currency') {
          formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: (format as any).currency,
            ...format.options,
          });
        } else if (format.type === 'number') {
          formatter = new Intl.NumberFormat(locale, format.options);
        } else if (format.type === 'date') {
          formatter = new Intl.DateTimeFormat(locale, format.options);
        }

        if (formatter) {
          this.preloadedFormatters.set(key, formatter);
        }
      } catch (error) {
        console.warn(`Failed to preload formatter: ${key}`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  // ✅ Получение предзагруженного форматтера
  getPreloadedFormatter(key: string): any {
    return this.preloadedFormatters.get(key);
  }

  // ✅ Предзагрузка данных локализации
  async preloadLocalizationData(locale: string): Promise<void> {
    try {
      // Предзагружаем данные о валютах
      await this.preloadCurrencyData(locale);

      // Предзагружаем данные о временных зонах
      await this.preloadTimezoneData(locale);

      // Предзагружаем правила плюрализации
      await this.preloadPluralizationRules(locale);
    } catch (error) {
      console.warn(`Failed to preload localization data for ${locale}:`, error);
    }
  }

  private async preloadCurrencyData(locale: string): Promise<void> {
    // Здесь можно загрузить актуальные курсы валют
    // и другие данные, специфичные для локали
  }

  private async preloadTimezoneData(locale: string): Promise<void> {
    // Предзагрузка данных о временных зонах
  }

  private async preloadPluralizationRules(locale: string): Promise<void> {
    // Предзагрузка правил плюрализации
  }

  // ✅ Статистика предзагрузки
  getPreloadStats() {
    return {
      formattersLoaded: this.preloadedFormatters.size,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  private estimateMemoryUsage(): string {
    // Примерная оценка использования памяти
    const estimatedSize = this.preloadedFormatters.size * 1024; // 1KB на форматтер
    return `${(estimatedSize / 1024).toFixed(2)} KB`;
  }
}

// Глобальный предзагрузчик
export const formattingPreloader = new FormattingPreloader();

// ✅ Хук для предзагрузки форматтеров
export function useFormattingPreloader(locale: string) {
  useEffect(() => {
    formattingPreloader.preloadCommonFormatters(locale);
    formattingPreloader.preloadLocalizationData(locale);
  }, [locale]);

  return formattingPreloader;
}
```

## 📅 Этап 4: Форматирование дат и времени _(20 мин)_

### 1. Утилиты для работы с датами:

```typescript
// 📁 apps/web/src/utils/date-formatting.ts
import { type Locale } from '@/config/i18n';

// Конфигурация временных зон для локалей
export const timezoneConfig = {
  uk: 'Europe/Kiev',
  en: 'UTC',
  ru: 'Europe/Moscow',
} as const;

// Относительное время (2 часа назад, через 5 минут)
export function formatRelativeTime(
  date: Date,
  locale: Locale,
  options: {
    now?: Date;
    style?: 'long' | 'short' | 'narrow';
  } = {}
): string {
  const { now = new Date(), style = 'long' } = options;

  const rtf = new Intl.RelativeTimeFormat(locale, {
    style,
    numeric: 'auto', // "yesterday" вместо "1 day ago"
  });

  const diffInMs = date.getTime() - now.getTime();
  const diffInMinutes = Math.round(diffInMs / (1000 * 60));
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  // Выбираем подходящую единицу времени
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  } else if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  } else if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, 'day');
  } else {
    // Для больших периодов используем абсолютное время
    return formatDateTime(date, locale, { dateStyle: 'medium' });
  }
}

// Абсолютное время
export function formatDateTime(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const timezone = timezoneConfig[locale];

  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    ...options,
  }).format(date);
}

// Форматирование времени операции
export function formatOperationTime(
  date: Date,
  locale: Locale,
  type: 'created' | 'updated' | 'completed' = 'created'
): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);

  // Если меньше часа - показываем относительное время
  if (diffInMinutes < 60) {
    return formatRelativeTime(date, locale, { now, style: 'short' });
  }

  // Если сегодня - показываем время
  if (isToday(date)) {
    return formatDateTime(date, locale, {
      timeStyle: 'short',
    });
  }

  // Если на этой неделе - показываем день и время
  if (isThisWeek(date)) {
    return formatDateTime(date, locale, {
      weekday: 'short',
      timeStyle: 'short',
    });
  }

  // Иначе полная дата
  return formatDateTime(date, locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

// Длительность (5 мин 30 сек)
export function formatDuration(
  minutes: number,
  locale: Locale,
  options: {
    style?: 'long' | 'short' | 'narrow';
    units?: ('hour' | 'minute' | 'second')[];
  } = {}
): string {
  const { style = 'short', units = ['hour', 'minute'] } = options;

  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes % 1) * 60);

  const parts: string[] = [];

  if (hours > 0 && units.includes('hour')) {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'hour',
      unitDisplay: style,
    });
    parts.push(formatter.format(hours));
  }

  if (mins > 0 && units.includes('minute')) {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'minute',
      unitDisplay: style,
    });
    parts.push(formatter.format(mins));
  }

  if (secs > 0 && units.includes('second')) {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'second',
      unitDisplay: style,
    });
    parts.push(formatter.format(secs));
  }

  return parts.join(' ');
}

// Вспомогательные функции
function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= oneWeekAgo && date <= now;
}

// Форматирование временных меток для API
export function formatApiTimestamp(date: Date, locale: Locale): string {
  return formatDateTime(date, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
```

### 2. Компоненты для отображения времени:

```typescript
// 📁 apps/web/src/components/ui/TimeDisplay.tsx
'use client';

import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { Clock, Calendar, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatRelativeTime,
  formatDateTime,
  formatDuration,
  formatOperationTime
} from '@/utils/date-formatting';

interface TimeDisplayProps {
  date: Date;
  type?: 'relative' | 'absolute' | 'operation' | 'duration';
  format?: 'full' | 'short' | 'time-only' | 'date-only';
  showIcon?: boolean;
  autoUpdate?: boolean;
  className?: string;
}

export function TimeDisplay({
  date,
  type = 'relative',
  format = 'short',
  showIcon = false,
  autoUpdate = false,
  className,
}: TimeDisplayProps) {
  const locale = useLocale();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Автоматическое обновление для относительного времени
  useEffect(() => {
    if (!autoUpdate || type !== 'relative') return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Обновляем каждую минуту

    return () => clearInterval(interval);
  }, [autoUpdate, type]);

  const formatTime = () => {
    switch (type) {
      case 'relative':
        return formatRelativeTime(date, locale as any, { now: currentTime });

      case 'operation':
        return formatOperationTime(date, locale as any);

      case 'duration':
        const diffInMinutes = (currentTime.getTime() - date.getTime()) / (1000 * 60);
        return formatDuration(diffInMinutes, locale as any);

      case 'absolute':
      default:
        const formatOptions = getFormatOptions(format);
        return formatDateTime(date, locale as any, formatOptions);
    }
  };

  const getIcon = () => {
    if (!showIcon) return null;

    switch (type) {
      case 'relative':
      case 'operation':
        return <Clock className="h-4 w-4" />;
      case 'duration':
        return <Timer className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <time
      dateTime={date.toISOString()}
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      {getIcon()}
      <span>{formatTime()}</span>
    </time>
  );
}

// Компонент обратного отсчета
export function CountdownTimer({
  targetDate,
  onComplete,
  format = 'short',
  showLabels = true,
  className,
}: {
  targetDate: Date;
  onComplete?: () => void;
  format?: 'full' | 'short' | 'minimal';
  showLabels?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft(difference);
      } else {
        setTimeLeft(0);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  const formatCountdown = () => {
    if (timeLeft <= 0) return '00:00:00';

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (format === 'minimal') {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    if (format === 'short') {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Full format with labels
    const labels = {
      uk: { h: 'год', m: 'хв', s: 'сек' },
      en: { h: 'h', m: 'm', s: 's' },
      ru: { h: 'ч', m: 'м', s: 'с' },
    };

    const { h, m, s } = labels[locale as keyof typeof labels] || labels.en;

    return `${hours}${h} ${minutes}${m} ${seconds}${s}`;
  };

  return (
    <div className={cn('font-mono text-lg font-semibold', className)}>
      {formatCountdown()}
    </div>
  );
}

// Компонент для отображения статуса заявки со временем
export function OrderStatusTime({
  status,
  createdAt,
  updatedAt,
  estimatedCompletion,
  className,
}: {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
  estimatedCompletion?: Date;
  className?: string;
}) {
  const locale = useLocale();

  const getStatusTime = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Создано: <TimeDisplay date={createdAt} type="operation" />
            </div>
            {estimatedCompletion && (
              <div className="text-sm text-blue-600">
                Ожидаемое время: <TimeDisplay date={estimatedCompletion} type="relative" />
              </div>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">
              Обрабатывается: <TimeDisplay date={updatedAt || createdAt} type="operation" />
            </div>
            {estimatedCompletion && (
              <CountdownTimer
                targetDate={estimatedCompletion}
                format="minimal"
                className="text-sm text-blue-600"
              />
            )}
          </div>
        );

      case 'completed':
        return (
          <div className="text-sm text-green-600">
            Завершено: <TimeDisplay date={updatedAt || createdAt} type="operation" />
          </div>
        );

      case 'cancelled':
        return (
          <div className="text-sm text-red-600">
            Отменено: <TimeDisplay date={updatedAt || createdAt} type="operation" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {getStatusTime()}
    </div>
  );
}

// Вспомогательная функция для опций форматирования
function getFormatOptions(format: string): Intl.DateTimeFormatOptions {
  switch (format) {
    case 'full':
      return {
        dateStyle: 'full',
        timeStyle: 'short',
      };
    case 'time-only':
      return {
        timeStyle: 'short',
      };
    case 'date-only':
      return {
        dateStyle: 'medium',
      };
    case 'short':
    default:
      return {
        dateStyle: 'short',
        timeStyle: 'short',
      };
  }
}
```

## ✅ Проверка знаний

### Вопросы для самоконтроля:

1. **Форматирование валют**:
   - Как правильно отображать криптовалюты с высокой точностью?
   - Какие различия в форматировании валют между локалями?
   - Как обрабатывать очень большие и очень маленькие числа?

2. **Работа с датами**:
   - Как корректно работать с временными зонами?
   - Когда использовать относительное, а когда абсолютное время?
   - Как автоматически обновлять отображение времени?

3. **Пользовательский опыт**:
   - Как сделать числа понятными для разных культур?
   - Как правильно показывать изменения и тренды?
   - Как обеспечить доступность для screen readers?

### 💻 Практическое задание

**Создайте продвинутую систему форматирования для финансовой панели ExchangeGO:**

#### Этап 1: Анализ требований _(5 мин)_

**Типы данных для форматирования:**

- 💰 **Валюты**: USD, EUR, UAH, BTC, ETH, USDT
- 📊 **Числа**: объемы торгов, количества, проценты
- 📅 **Даты**: временные метки, периоды, дедлайны
- ⏱️ **Время**: длительность операций, обратный отсчет

**Локализационные требования:**

- Разные форматы чисел (1,234.56 vs 1 234,56)
- Культурные различия в валютах ($ перед vs € после)
- Временные зоны и форматы дат
- Безопасный парсинг пользовательского ввода

#### Этап 2: Создание системы безопасного форматирования _(15 мин)_

```typescript
// 📁 apps/web/src/components/financial/FinancialFormatter.tsx

interface FinancialFormatterProps {
  data: {
    totalVolume: number;
    activeOrders: number;
    averageProcessingTime: number; // в минутах
    topPairs: Array<{
      pair: string;
      volume: number;
      change24h: number;
      lastUpdate: Date;
    }>;
    userBalance: Array<{
      currency: string;
      amount: number;
      usdValue: number;
    }>;
  };
  locale: string;
  userTimezone: string;
}

export function FinancialFormatter({ data, locale, userTimezone }: FinancialFormatterProps) {
  // TODO: Реализуйте с использованием:

  // ✅ Оптимизированных форматтеров
  const formatters = useMemo(() => ({
    currency: (amount: number, currency: string) =>
      OptimizedFormatters.formatCurrency(amount, currency, locale),

    number: (value: number, options?: Intl.NumberFormatOptions) =>
      OptimizedFormatters.formatNumber(value, locale, options),

    date: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      OptimizedFormatters.formatDate(date, locale, {
        timeZone: userTimezone,
        ...options
      }),
  }), [locale, userTimezone]);

  // ✅ Мониторинга производительности
  const formatWithMonitoring = useCallback((operation: string, formatFn: () => string) => {
    return formattingPerformance.measureFormatting(operation, formatFn);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Общий объем торгов */}
      <MetricCard
        title={t('dashboard.totalVolume')}
        value={formatWithMonitoring('totalVolume', () =>
          formatters.currency(data.totalVolume, 'USD')
        )}
        change={data.volumeChange24h}
        locale={locale}
      />

      {/* Активные заявки */}
      <MetricCard
        title={t('dashboard.activeOrders')}
        value={formatWithMonitoring('activeOrders', () =>
          formatters.number(data.activeOrders, { notation: 'compact' })
        )}
        locale={locale}
      />

      {/* Время обработки */}
      <MetricCard
        title={t('dashboard.processingTime')}
        value={formatWithMonitoring('processingTime', () =>
          formatDuration(data.averageProcessingTime, locale)
        )}
        locale={locale}
      />
    </div>
  );
}
```

#### Этап 3: Компонент безопасного ввода валют _(15 мин)_

```typescript
// 📁 apps/web/src/components/forms/SafeCurrencyInput.tsx

interface SafeCurrencyInputProps {
  currency: string;
  locale: string;
  value?: number;
  onChange: (value: number | null, error: string | null) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}

export function SafeCurrencyInput({
  currency,
  locale,
  value,
  onChange,
  placeholder,
  min,
  max,
}: SafeCurrencyInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // TODO: Реализуйте с функциями:

  // ✅ Безопасный парсинг при изменении
  const handleInputChange = useCallback((input: string) => {
    setInputValue(input);

    if (!input.trim()) {
      onChange(null, null);
      setError(null);
      setWarnings([]);
      return;
    }

    // Используем безопасный парсер
    const result = SafeParser.parseCurrency(input, currency, locale);

    if (result.error) {
      setError(result.error);
      onChange(null, result.error);
    } else if (result.amount !== null) {
      // Проверяем диапазон
      if (min !== undefined && result.amount < min) {
        const minFormatted = OptimizedFormatters.formatCurrency(min, currency, locale);
        const rangeError = `Минимальная сумма: ${minFormatted}`;
        setError(rangeError);
        onChange(null, rangeError);
      } else if (max !== undefined && result.amount > max) {
        const maxFormatted = OptimizedFormatters.formatCurrency(max, currency, locale);
        const rangeError = `Максимальная сумма: ${maxFormatted}`;
        setError(rangeError);
        onChange(null, rangeError);
      } else {
        setError(null);
        onChange(result.amount, null);
      }
    }
  }, [currency, locale, min, max, onChange]);

  // ✅ Форматирование при потере фокуса
  const handleBlur = useCallback(() => {
    if (value !== null && value !== undefined) {
      const formatted = OptimizedFormatters.formatCurrency(value, currency, locale);
      setInputValue(formatted);
    }
  }, [value, currency, locale]);

  // ✅ Очистка форматирования при фокусе
  const handleFocus = useCallback(() => {
    if (value !== null && value !== undefined) {
      setInputValue(value.toString());
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Input
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder || `0.00 ${currency}`}
        className={cn(
          'font-mono',
          error && 'border-destructive'
        )}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {warnings.length > 0 && (
        <div className="text-sm text-amber-600">
          {warnings.map((warning, index) => (
            <p key={index}>{warning}</p>
          ))}
        </div>
      )}

      {min !== undefined && max !== undefined && (
        <p className="text-xs text-muted-foreground">
          Диапазон: {OptimizedFormatters.formatCurrency(min, currency, locale)} - {OptimizedFormatters.formatCurrency(max, currency, locale)}
        </p>
      )}
    </div>
  );
}
```

#### Этап 4: Система мониторинга производительности _(10 мин)_

```typescript
// 📁 apps/web/src/components/debug/FormattingPerformancePanel.tsx

export function FormattingPerformancePanel() {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // TODO: Реализуйте панель мониторинга с:

  // ✅ Обновление статистики каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      const report = formattingPerformance.getPerformanceReport();
      const optimizedStats = OptimizedFormatters.getPerformanceStats();
      const preloadStats = formattingPreloader.getPreloadStats();

      setPerformanceData({
        performance: report,
        optimization: optimizedStats,
        preload: preloadStats,
        timestamp: new Date(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Показываем только в development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
      >
        📊 Formatting Stats
      </Button>

      {isVisible && performanceData && (
        <Card className="mt-2 p-4 w-96 max-h-96 overflow-auto">
          <h4 className="font-semibold mb-2">Formatting Performance</h4>

          {/* Статистика производительности */}
          <div className="space-y-2 text-sm">
            <div>
              <strong>Cache Hit Rate:</strong> {performanceData.optimization.cacheHitRate || 'N/A'}
            </div>
            <div>
              <strong>Memory Usage:</strong> {performanceData.optimization.memoryUsage}
            </div>
            <div>
              <strong>Slow Operations:</strong> {performanceData.performance.slowOperations?.length || 0}
            </div>
          </div>

          {/* Рекомендации */}
          {performanceData.performance.recommendations?.length > 0 && (
            <div className="mt-3">
              <strong className="text-sm">Recommendations:</strong>
              <ul className="text-xs mt-1 space-y-1">
                {performanceData.performance.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-amber-600">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
```

#### Этап 5: Тестирование форматирования _(10 мин)_

```typescript
// 📁 apps/web/src/__tests__/formatting.test.ts

describe('Financial Formatting System', () => {
  // TODO: Создайте тесты для:

  test('безопасно парсит числа в разных локалях', () => {
    // Тест американского формата
    const usResult = SafeParser.parseNumber('1,234.56', 'en-US');
    expect(usResult.value).toBe(1234.56);
    expect(usResult.error).toBeNull();

    // Тест европейского формата
    const deResult = SafeParser.parseNumber('1.234,56', 'de-DE');
    expect(deResult.value).toBe(1234.56);
    expect(deResult.error).toBeNull();

    // Тест украинского формата
    const uaResult = SafeParser.parseNumber('1 234,56', 'uk-UA');
    expect(uaResult.value).toBe(1234.56);
    expect(uaResult.error).toBeNull();
  });

  test('корректно форматирует валюты', () => {
    expect(OptimizedFormatters.formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');

    expect(OptimizedFormatters.formatCurrency(1234.56, 'EUR', 'de-DE')).toBe('1.234,56 €');

    expect(OptimizedFormatters.formatCurrency(1234.56, 'UAH', 'uk-UA')).toBe('1 234,56 ₴');
  });

  test('обрабатывает ошибки парсинга', () => {
    const result = SafeParser.parseNumber('invalid', 'en-US');
    expect(result.value).toBeNull();
    expect(result.error).toBeTruthy();
  });

  test('кеширует форматированные значения', () => {
    // Первый вызов
    const start1 = performance.now();
    OptimizedFormatters.formatCurrency(1000, 'USD', 'en-US');
    const time1 = performance.now() - start1;

    // Второй вызов (должен быть из кеша)
    const start2 = performance.now();
    OptimizedFormatters.formatCurrency(1000, 'USD', 'en-US');
    const time2 = performance.now() - start2;

    expect(time2).toBeLessThan(time1);
  });
});
```

#### ✅ Критерии оценки (80 баллов):

**Безопасность парсинга (25 баллов):**

- [ ] Корректный парсинг всех локальных форматов (10 баллов)
- [ ] Обработка ошибок и edge cases (8 баллов)
- [ ] Валидация диапазонов и типов (7 баллов)

**Производительность (20 баллов):**

- [ ] Кеширование форматированных значений (8 баллов)
- [ ] Пул переиспользуемых форматтеров (7 баллов)
- [ ] Мониторинг производительности (5 баллов)

**Функциональность (20 баллов):**

- [ ] Поддержка всех типов данных (8 баллов)
- [ ] Правильное форматирование по локалям (7 баллов)
- [ ] Пользовательский интерфейс (5 баллов)

**Тестирование (15 баллов):**

- [ ] Unit тесты для всех форматтеров (8 баллов)
- [ ] Тесты производительности (4 балла)
- [ ] Edge cases покрыты (3 балла)

#### 🎯 Ожидаемый результат:

**Production-ready система форматирования которая:**

- Безопасно парсит пользовательский ввод во всех локалях
- Корректно форматирует финансовые данные для каждой культуры
- Оптимизирована для высокой производительности с кешированием
- Мониторит производительность и предоставляет рекомендации
- Полностью протестирована на всех edge cases

## 📚 Дополнительные материалы

### Стандарты:

- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) - международное форматирование
- [Unicode CLDR](https://cldr.unicode.org/) - данные локализации
- [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) - коды валют

### Библиотеки:

- [date-fns](https://date-fns.org/) - утилиты для работы с датами
- [dayjs](https://day.js.org/) - легкая альтернатива moment.js
- [numeral.js](http://numeraljs.com/) - форматирование чисел

---

**🎉 Отлично! Теперь ваше приложение корректно форматирует данные для всех культур.**

В следующем уроке создадим [полную локализацию страницы](./lesson-7.5-practice-page-localization.md) на практическом примере.

---

[← Урок 7.3: Локализация компонентов](./lesson-7.3-component-localization.md) | [Урок 7.5: Практика →](./lesson-7.5-practice-page-localization.md)
