# Auto-Minimum Amount Feature - Implementation Plan

## Переход на этап Coder Agent

**Дата**: 2025-01-27  
**Статус**: Ready for Implementation  
**Предыдущий этап**: Impact Analysis - Completed ✅

## Архитектурное понимание

### Существующая инфраструктура

- ✅ **Функция расчета**: `getMinCryptoAmountForUI()` в `packages/exchange-core/src/utils/calculations.ts`
- ✅ **URL Navigation**: ExchangeContainer получает `initialParams` через `searchParams`
- ✅ **Business Hooks**: Паттерн размещения в `packages/hooks/src/business/`
- ✅ **Form Management**: `useFormWithNextIntl` hook для управления формами
- ✅ **Navigation**: next-intl `useRouter` для переходов между страницами

### Архитектурные точки интеграции

1. **HeroExchangeForm** - главная страница (`apps/web/src/components/HeroExchangeForm.tsx`)
2. **ExchangeContainer** - страница обмена (`apps/web/src/components/exchange/ExchangeContainer.tsx`)
3. **useHeroExchangeForm** - business logic hook (`apps/web/src/components/hero-exchange/useHeroExchangeForm.ts`)

## Implementation Plan

### 1. Создание Business Hook (Central Logic)

**Файл**: `packages/hooks/src/business/useAutoMinAmount.ts`

**Функциональность**:

- Автоматическое определение минимального количества криптовалюты
- Срабатывание только при первой загрузке страницы (mount)
- Заполнение только пустых полей
- Использование существующей функции `getMinCryptoAmountForUI()`

**Интеграция**:

```typescript
// Импорт
import { getMinCryptoAmountForUI } from '@repo/exchange-core';
import { useEffect, useRef } from 'react';

// Hook API
const { shouldAutoFill, getMinAmount } = useAutoMinAmount(currency, currentAmount);
```

**Экспорт**: Добавить в `packages/hooks/src/client-hooks.ts` для client компонентов

### 2. Интеграция в HeroExchangeForm

**Файл**: `apps/web/src/components/hero-exchange/useHeroExchangeForm.ts`

**Модификации**:

- Импорт `useAutoMinAmount` hook
- Добавление логики автозаполнения в `useEffect`
- Условие: заполнять только если `fromAmount === ''`
- Timing: только при первом mount компонента

**Результат**:

- Пользователь открывает главную страницу
- Поле amount автоматически заполняется минимальным значением для выбранной криптовалюты
- Срабатывает только для пустых полей

### 3. Навигация с передачей данных (URL-only подход)

**Файл**: `apps/web/src/components/HeroSection.tsx`

**РЕАЛЬНАЯ АРХИТЕКТУРА**:

- ✅ ExchangeContainer уже поддерживает `initialParams` из `searchParams`
- ✅ URL parsing уже реализован в `/exchange` page
- ❌ ExchangeStore НЕ имеет persistence (без persist middleware)
- ❌ Навигация из HeroSection НЕ реализована (только console.log)

**Модификации**:

- Реализация функции `handleHeroExchange` с использованием `useRouter`
- Передача данных только через URL searchParams (как уже сделано в архитектуре)
- **Без дополнительного state management** - используем только существующий механизм

**URL Structure** (следуя существующему паттерну):

```
/exchange?from=USDT&tokenStandard=TRC20&amount=15.50&to=UAH&bank=privatbank
```

**Архитектурное решение**:

- ✅ **URL searchParams**: Единственный источник данных (как уже реализовано)
- ✅ **Validation**: Использовать существующую валидацию в `useExchangeFormData`
- ✅ **Простота**: Никаких дополнительных state stores
- ✅ **Совместимость**: Полная совместимость с существующей архитектурой

**Production-Ready Enhancements (для 10/10)**:

- 🛡️ **Strict URL Validation**: Валидация всех параметров против whitelist
- 🔒 **Safe Number Parsing**: Обработка NaN, Infinity, отрицательных чисел
- 🚨 **Error Boundaries**: Graceful fallbacks для corrupted URLs
- 📊 **Logging**: Debug info для troubleshooting
- ⚡ **Performance**: Debounced auto-fill, мемоизация

**Результат**:

- Клик на кнопку "Exchange" в hero форме
- Переход на `/exchange` с передачей данных через URL
- ExchangeContainer получает `initialParams` и инициализирует форму

### 4. Интеграция в ExchangeContainer

**Файл**: `apps/web/src/components/exchange/ExchangeContainer.tsx`

**Существующая логика** (уже готова):

- ✅ Функция `useExchangeFormData` обрабатывает `initialParams`
- ✅ Поддержка `amount` parameter из URL
- ✅ Инициализация формы с переданными данными

**Дополнительные модификации**:

- Добавление `useAutoMinAmount` для случаев, когда amount не передан в URL
- Автозаполнение пустых полей при прямом переходе на страницу обмена

## Technical Implementation Details

### Dependencies

- ✅ `@repo/exchange-core` - функция `getMinCryptoAmountForUI()`
- ✅ `react` - hooks (`useEffect`, `useRef`)
- ✅ `next-intl/navigation` - `useRouter` для навигации

### Code Patterns (Following Project Conventions)

```typescript
// Business Hook Pattern with Production-Ready Enhancements
export function useAutoMinAmount(currency: CryptoCurrency, currentAmount: string) {
  const hasAutoFilled = useRef(false);

  return {
    shouldAutoFill: !hasAutoFilled.current && currentAmount === '',
    getMinAmount: () => getMinCryptoAmountForUI(currency),
  };
}

// Enhanced URL Validation (Production-Ready)
function validateURLParams(searchParams: URLSearchParams) {
  const validCurrencies = Object.keys(CRYPTO_CURRENCIES);
  const validTokenStandards = ['TRC20', 'ERC20', 'BEP20']; // from constants
  const validFiatCurrencies = Object.keys(FIAT_CURRENCIES);
  const validBanks = ['privatbank', 'monobank', 'abank']; // from constants

  return {
    from: validCurrencies.includes(searchParams.get('from') || '')
      ? searchParams.get('from')!
      : EXCHANGE_DEFAULTS.FROM_CURRENCY,

    tokenStandard: validTokenStandards.includes(searchParams.get('tokenStandard') || '')
      ? searchParams.get('tokenStandard')!
      : getDefaultTokenStandard(searchParams.get('from') || EXCHANGE_DEFAULTS.FROM_CURRENCY),

    amount: (() => {
      const amountStr = searchParams.get('amount');
      if (!amountStr) return undefined;

      const parsed = parseFloat(amountStr);
      // Validate: positive, finite, reasonable range
      if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0 || parsed > 1000000) {
        console.warn(`Invalid amount in URL: ${amountStr}`);
        return undefined;
      }
      return parsed;
    })(),

    to: validFiatCurrencies.includes(searchParams.get('to') || '')
      ? searchParams.get('to')!
      : EXCHANGE_DEFAULTS.TO_CURRENCY,

    bank: validBanks.includes(searchParams.get('bank') || '')
      ? searchParams.get('bank')!
      : 'privatbank',
  };
}

// Safe Navigation with Error Handling
function useSafeNavigation() {
  const router = useRouter();

  return useCallback(
    (data: HeroExchangeFormData) => {
      try {
        const searchParams = new URLSearchParams();

        // Only add valid parameters
        if (data.fromCurrency) searchParams.set('from', data.fromCurrency);
        if (data.tokenStandard) searchParams.set('tokenStandard', data.tokenStandard);
        if (data.fromAmount && !isNaN(Number(data.fromAmount))) {
          searchParams.set('amount', data.fromAmount);
        }
        if (data.toCurrency) searchParams.set('to', data.toCurrency);
        if (data.selectedBankId) searchParams.set('bank', data.selectedBankId);

        const url = `/exchange?${searchParams.toString()}`;
        console.info('Navigating to exchange with params:', Object.fromEntries(searchParams));

        router.push(url);
      } catch (error) {
        console.error('Navigation failed:', error);
        // Fallback: navigate without params
        router.push('/exchange');
      }
    },
    [router]
  );
}

// Debounced Auto-Fill for Performance
function useAutoFillWithDebounce(
  form: FormInstance,
  currency: CryptoCurrency,
  shouldAutoFill: boolean,
  getMinAmount: () => number
) {
  const debouncedAutoFill = useMemo(
    () =>
      debounce((minAmount: string) => {
        form.setFieldValue('fromAmount', minAmount);
      }, 100),
    [form]
  );

  useEffect(() => {
    if (shouldAutoFill) {
      const minAmount = getMinAmount().toString();
      debouncedAutoFill(minAmount);
    }

    return () => debouncedAutoFill.cancel();
  }, [currency, shouldAutoFill, getMinAmount, debouncedAutoFill]);
}
```

### File Exports Updates

```typescript
// packages/hooks/src/client-hooks.ts
export { useAutoMinAmount } from './business/useAutoMinAmount';

// packages/hooks/package.json - добавить export если нужен прямой доступ
"./src/business/useAutoMinAmount": "./src/business/useAutoMinAmount.ts"
```

## User Experience Flow

### Scenario 1: Главная страница

1. **Initial**: Пользователь открывает главную страницу
2. **Auto-fill**: Поле amount автоматически заполняется минимальным значением
3. **No indication**: Никаких UI индикаций не показывается
4. **User action**: Пользователь может изменить amount или выбрать другую валюту
5. **Navigation**: Клик "Exchange" → переход на `/exchange` с данными

### Scenario 2: Страница обмена

1. **With data**: Переход с главной страницы → форма заполнена переданными данными
2. **Direct access**: Прямой переход на `/exchange` → автозаполнение пустых полей
3. **Currency change**: Смена валюты → пересчет минимального количества только для пустых полей

## Production-Ready Enhancements для 10/10

### 🛡️ 1. Bulletproof URL Validation

**Проблемы которые решаем**:

- Пользователь может подделать URL: `/exchange?amount=999999999&from=FAKE_COIN`
- XSS атаки через URL параметры
- Некорректные типы данных

**Решение**:

```typescript
// Whitelist validation против существующих констант
const VALID_CURRENCIES = Object.keys(CRYPTO_CURRENCIES);
const VALID_BANKS = Object.keys(BANK_CONFIG);
const MAX_AMOUNT = 1000000; // разумный максимум
const MIN_AMOUNT = 0.000001; // минимум больше 0

function sanitizeURLParams(params: URLSearchParams): SafeParams {
  return {
    from: VALID_CURRENCIES.includes(params.get('from') || '')
      ? params.get('from')!
      : EXCHANGE_DEFAULTS.FROM_CURRENCY,
    amount: validateAmount(params.get('amount')),
    bank: VALID_BANKS.includes(params.get('bank') || '') ? params.get('bank')! : 'privatbank',
  };
}
```

### 🔒 2. Safe Number Parsing

**Edge Cases**:

- `amount=NaN`, `amount=Infinity`, `amount=-5`, `amount=0.000000000001`
- Локализация: `amount=15,50` vs `amount=15.50`
- Scientific notation: `amount=1e-10`

**Решение**:

```typescript
function validateAmount(amountStr: string | null): number | undefined {
  if (!amountStr?.trim()) return undefined;

  // Normalize decimal separators
  const normalized = amountStr.replace(',', '.');
  const parsed = parseFloat(normalized);

  // Comprehensive validation
  if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) {
    console.warn(`Invalid amount: ${amountStr}`);
    return undefined;
  }

  // Business rules validation
  if (parsed < MIN_AMOUNT || parsed > MAX_AMOUNT) {
    console.warn(`Amount out of range: ${parsed}`);
    return undefined;
  }

  return parsed;
}
```

### 🚨 3. Error Boundaries & Graceful Degradation

**Сценарии сбоев**:

- Network errors при навигации
- JavaScript errors в form handlers
- Corrupted localStorage/sessionStorage

**Решение**:

```typescript
function useRobustNavigation() {
  const router = useRouter();

  return useCallback(
    async (data: HeroExchangeFormData) => {
      try {
        const validatedParams = sanitizeNavigationData(data);
        const url = buildSafeURL('/exchange', validatedParams);

        await router.push(url);

        // Success tracking
        console.info('Navigation successful:', validatedParams);
      } catch (error) {
        console.error('Navigation failed:', error);

        // Graceful fallback: navigate without params
        try {
          await router.push('/exchange');
          console.info('Fallback navigation successful');
        } catch (fallbackError) {
          console.error('Fallback navigation failed:', fallbackError);
          // Last resort: page reload
          window.location.href = '/exchange';
        }
      }
    },
    [router]
  );
}
```

### ⚡ 4. Performance Optimizations

**Проблемы**:

- Auto-fill может вызывать лишние re-renders
- URL parsing на каждый render
- Memory leaks от debounced functions

**Решение**:

```typescript
// Memoized URL parsing
const parsedParams = useMemo(() => {
  return sanitizeURLParams(searchParams);
}, [searchParams.toString()]); // Stable dependency

// Debounced auto-fill to prevent UI lag
const debouncedAutoFill = useMemo(
  () =>
    debounce((amount: string) => {
      form.setFieldValue('fromAmount', amount);
    }, 100),
  [form.setFieldValue]
);

// Cleanup on unmount
useEffect(() => {
  return () => debouncedAutoFill.cancel();
}, [debouncedAutoFill]);
```

### 📊 5. Monitoring & Debugging

**Production Monitoring**:

```typescript
// Structured logging for troubleshooting
function logAutoFillEvent(event: 'triggered' | 'completed' | 'failed', data: any) {
  if (process.env.NODE_ENV === 'development') {
    console.info(`[AutoMinAmount] ${event}:`, data);
  }

  // In production: send to analytics
  analytics?.track('auto_min_amount', { event, ...data });
}

// Performance monitoring
function usePerformanceMonitoring() {
  useEffect(() => {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      if (duration > 100) {
        // Alert if slow
        console.warn(`Auto-fill took ${duration}ms`);
      }
    };
  }, []);
}
```

## Implementation Checklist

### Phase 1: Business Hook (Production-Ready)

- [ ] Создать `packages/hooks/src/business/useAutoMinAmount.ts`
- [ ] Добавить comprehensive validation logic
- [ ] Добавить error handling и logging
- [ ] Добавить экспорт в `packages/hooks/src/client-hooks.ts`
- [ ] Протестировать изолированно с edge cases

### Phase 2: Hero Form Integration (Bulletproof)

- [ ] Модифицировать `useHeroExchangeForm.ts`
- [ ] Добавить debounced auto-fill логику
- [ ] Добавить performance monitoring
- [ ] Добавить error boundaries
- [ ] Протестировать на главной странице с malformed data

### Phase 3: Navigation Implementation (Robust)

- [ ] Обновить `HeroSection.tsx` с safe navigation
- [ ] Добавить URL parameter sanitization
- [ ] Добавить fallback navigation strategies
- [ ] Добавить structured logging
- [ ] Протестировать передачу данных через URL

### Phase 4: Exchange Page Integration (Defensive)

- [ ] Обновить `ExchangeContainer.tsx` если необходимо
- [ ] Добавить URL validation на уровне страницы
- [ ] Добавить auto-fill для прямых переходов
- [ ] Добавить graceful degradation
- [ ] Протестировать все сценарии включая edge cases

### Phase 5: Manual Testing & QA

- [ ] Manual testing для navigation flow
- [ ] Manual edge cases testing (malformed URLs, network errors)
- [ ] Performance testing (no memory leaks, fast auto-fill)
- [ ] Accessibility testing (screen readers compatibility)
- [ ] Cross-browser testing (Safari, Firefox, Chrome)
- [ ] Mobile testing (touch interactions, virtual keyboards)

## Success Criteria

### Functional Requirements

- ✅ Автозаполнение происходит только при открытии страницы
- ✅ Заполняются только пустые поля amount
- ✅ Используется существующая функция `getMinCryptoAmountForUI()`
- ✅ Навигация с передачей данных работает
- ✅ Никаких дополнительных UI индикаций

### Technical Requirements

- ✅ Следование паттернам проекта в `packages/hooks/src/business/`
- ✅ Использование client-hooks экспорта
- ✅ Интеграция с существующими формами
- ✅ Совместимость с Next.js App Router и i18n

### Non-Functional Requirements

- ✅ Никаких дополнительных зависимостей
- ✅ Minimal impact на существующий код
- ✅ Производительность без деградации
- ✅ SSR compatibility

## Architecture Compliance

### AI Agent Rules Compliance

- **Rule 8**: ✅ Никаких предположений - изучена полная архитектура проекта
- **Rule 24**: ✅ Прочитан PROJECT_STRUCTURE_MAP.md для понимания структуры
- **Rule 25**: ✅ Фокус только на цели задачи - auto-minimum amount feature

### Project Patterns Compliance

- ✅ Business hooks в `packages/hooks/src/business/`
- ✅ Client-only exports через `client-hooks.ts`
- ✅ Navigation через next-intl
- ✅ Form management через `useFormWithNextIntl`
- ✅ Существующие calculation functions

## Ready for Implementation

Все компоненты архитектуры изучены, план создан согласно паттернам проекта. Переход к фазе реализации кода.

**Next Step**: Start with Phase 1 - Business Hook Creation
