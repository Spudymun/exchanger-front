# План реализации новой страницы Exchange

**Задача:** Создание НОВОЙ страницы «Обмен USDT (TRC-20) на Банк. карта UAH»  
**Основа:** `docs/exchange-usdt-trc20-to-uah-card-acceptance-criteria-FINAL.md`  
**Архитектура:** Next.js 15 + shadcn/ui + Security-Enhanced Validation + Mobile-First  
**Создан:** 20 августа 2025

---

## 🎯 **ОБЗОР ЭТАПОВ**

Оптимизированный план для поэтапной реализации без потери контекста между сессиями.

---

## **🎯 ЭТАП 1: Архитектурная подготовка**

_Время: 2-3 часа | Готовность к кодированию_

### 1.1 **Создание валидационных схем** _(45 мин)_

- **СОЗДАТЬ:** `packages/utils/src/validation/enhanced-exchange-schemas.ts`
- **РАСШИРИТЬ:** `card-validation.ts` (уже создан) функциями Luhn + BIN detection
- **ИНТЕГРАЦИЯ:** Security-enhanced схема для новой формы обмена
- **ОСНОВА:** Существующие `securityEnhancedCreateExchangeOrderSchema` + card validation

### 1.2 **Расширение констант** _(30 мин)_

- **РАСШИРИТЬ:** `packages/constants/src/exchange-currencies.ts` поддержкой token standards
- **РАСШИРИТЬ:** `packages/constants/src/banks.ts` для UAH банков с лимитами
- **ПРОВЕРИТЬ:** Совместимость с существующими `CRYPTOCURRENCIES`, `FIAT_CURRENCIES`

### 1.3 **Создание типов** _(30 мин)_

- **ОБНОВИТЬ:** Существующий `ExchangeFormData` в `packages/hooks/src/state/exchange-store.ts`
- **ДОБАВИТЬ:** `TokenStandard`, `BankId` типы в constants
- **ИНТЕГРАЦИЯ:** С существующими типами из `types/order.ts`, `types/currency.ts`

## **🎯 ЭТАП 2: UI Foundation + Core Logic**

_Время: 3-4 часа | Полная форма без интеграции_

### 2.1 **Основная страница** _(60 мин)_

- **СОЗДАТЬ:** `apps/web/app/[locale]/exchange/page.tsx`
- **LAYOUT:** Two-column responsive структура по документации
- **METADATA:** Dynamic SEO с query params support
- **ROUTING:** next-intl integration + query params handling

### 2.2 **Основные компоненты формы** _(90 мин)_

- **СОЗДАТЬ:** `apps/web/app/[locale]/exchange/components/ExchangeContainer.tsx`
- **СОЗДАТЬ:** `CurrencyPairSection.tsx` (Send/Receive columns)
- **СОЗДАТЬ:** `PersonalDataSection.tsx` (Email + Card fields)
- **СОЗДАТЬ:** `SecuritySection.tsx` (Captcha + Agreements)

### 2.3 **Хук формы и валидация** _(60 мин)_

- **СОЗДАТЬ:** `useAdvancedExchangeForm.ts` на базе `useFormWithNextIntl`
- **ИНТЕГРАЦИЯ:** Security-enhanced validation schemas
- **ЛОГИКА:** Real-time валидация с debouncing
- **ПАТТЕРН:** По образцу `useHeroExchangeForm.ts`

### 2.4 **Переводы** _(30 мин)_

- **РАСШИРИТЬ:** `apps/web/messages/ru.json` секция `AdvancedExchangeForm`
- **СТРУКТУРА:** По примеру существующих form namespaces
- **VALIDATION:** Переводы ошибок валидации

**✅ Критерии готовности:** Форма отображается, валидация работает, переводы применяются

---

## **🎯 ЭТАП 3: Business Logic Integration**

_Время: 2-3 часа | Живые данные и вычисления_

### 3.1 **Exchange rates integration** _(60 мин)_

- **ИНТЕГРАЦИЯ:** Существующий `trpc.exchange.getRate.useQuery`
- **ЛОГИКА:** Real-time обновление каждые 30 секунд
- **СОСТОЯНИЕ:** Loading/Error states для курсов

### 3.2 **Bank data integration** _(45 мин)_

- **ИСПОЛЬЗОВАНИЕ:** `getBanksForCurrency('UAH')` из `@repo/constants`
- **ЛИМИТЫ:** Dynamic bank limits через tRPC (если есть endpoint)
- **ПРИОРИТЕТЫ:** Сортировка банков по priority

### 3.3 **Amount calculations** _(45 мин)_

- **ЛОГИКА:** Real-time расчет `cryptoAmount * exchangeRate`
- **DEBOUNCING:** 300ms для performance
- **ВАЛИДАЦИЯ:** Лимиты по валютам и банкам

### 3.4 **Card validation integration** _(30 мин)_

- **ИНТЕГРАЦИЯ:** `card-validation.ts` утилиты
- **VISUAL:** Payment system icons при valid BIN
- **FORMATTING:** Auto-formatting номера карты

**✅ Критерии готовности:** Live данные загружаются, расчеты работают, карты валидируются

---

## **🎯 ЭТАП 4: UX Enhancements + Mobile**

_Время: 2-3 часа | Полировка интерфейса_

### 4.1 **Mobile-first optimization** _(60 мин)_

- **ПРИМЕНЕНИЕ:** Mobile Adaptation Guidelines
- **TOUCH TARGETS:** `min-h-[44px]` для всех интерактивных элементов
- **SPACING:** Правильные responsive gaps и padding
- **INPUT MODES:** `inputMode="numeric"` для numeric inputs

### 4.2 **Loading states & animations** _(45 мин)_

- **СКЕЛЕТОНЫ:** Для exchange rates и bank data
- **TRANSITIONS:** Smooth transitions между состояниями
- **FEEDBACK:** Visual feedback для валидации

### 4.3 **Error handling** _(45 мин)_

- **ERROR BOUNDARIES:** Component-level error isolation
- **NETWORK ERRORS:** Retry mechanisms
- **VALIDATION ERRORS:** Field-level + form-level feedback

### 4.4 **Accessibility** _(30 мин)_

- **ARIA:** Proper labels и descriptions
- **FOCUS:** Keyboard navigation
- **SCREEN READERS:** Semantic HTML структура

**✅ Критерии готовности:** Mobile адаптация корректна, UX polished, ошибки обработаны

---

## **🎯 ЭТАП 5: Integration + Production**

_Время: 2-3 часа | Production готовность_

### 5.1 **tRPC integration** _(60 мин)_

- **ENDPOINT:** `exchange.createOrder` mutation
- **SUCCESS:** Redirect to order tracking page
- **ERROR HANDLING:** Локализованные сообщения об ошибках

### 5.2 **State management** _(45 мин)_

- **ZUSTAND:** Exchange store integration
- **PERSISTENCE:** Optional card data persistence
- **CACHE:** React Query optimization

### 5.3 **Performance optimization** _(45 мин)_

- **LAZY LOADING:** Heavy components
- **CODE SPLITTING:** Mobile-specific chunks
- **MEMOIZATION:** Expensive calculations

### 5.4 **Final integration** _(30 мин)_

- **NAVIGATION:** Links от главной страницы
- **SEO:** Final metadata optimization
- **PRODUCTION:** Final checks и deployment readiness

**✅ Критерии готовности:** Заказы создаются, состояние синхронизируется, production ready

---

## 📋 **ОБЩИЕ ПРИНЦИПЫ РЕАЛИЗАЦИИ**

### **Архитектурные стандарты:**

- **CSS Architecture v3.0:** Semantic classes из `@repo/tailwind-preset/globals.css`
- **Mobile-First:** Touch-friendly интерфейс согласно Mobile Adaptation Guidelines
- **Security-Enhanced Validation:** Multi-layer validation с XSS protection
- **Component Architecture:** Standard form components с shadcn/ui foundation
- **State Management:** Zustand + React Query integration через `@repo/hooks`

### **Базовые технологии:**

- **Form Management:** `useFormWithNextIntl` из `@repo/hooks`
- **Validation:** Security-enhanced schemas из `@repo/utils`
- **UI Components:** shadcn/ui через `@repo/ui`
- **Internationalization:** `next-intl` с namespace `AdvancedExchangeForm`
- **API Integration:** tRPC с type-safe endpoints

### **Качество кода:**

- **TypeScript:** Strict типизация
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** Debounced validation, lazy loading, мemoization
- **Error Handling:** Graceful degradation, retry mechanisms

---

## 🚀 **ГОТОВ К ДЕТАЛЬНОМУ ПЛАНИРОВАНИЮ**

Этот план основан на 100% фактических данных проекта и оптимизирован для поэтапной реализации без потери контекста между сессиями.

**Следующий шаг:** Детальные планы реализации каждого этапа с конкретными файлами и кодом.
