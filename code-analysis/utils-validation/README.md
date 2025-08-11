# Utils & Validation Package Analysis

Анализ пакета `packages/utils/` - базового слоя утилит и валидации.

## Архитектурная роль

**Уровень 2** в архитектуре проекта - базовый слой утилит, от которого зависят UI и Hooks.
Содержит чистые функции, валидацию, форматирование и вспомогательные утилиты.

## Структура анализа

### 📁 Основные файлы

- [index.ts](./index.md) - Экспорты пакета
- [calculations.ts](./calculations.md) - Числовые расчеты и проценты
- [env.ts](./env.md) - Типобезопасный доступ к env
- [formatting.ts](./formatting.md) - Форматирование значений для UI
- [input-validation.ts](./input-validation.md) - Числовые/крипто-валидации
- [next-intl-validation.ts](./next-intl-validation.md) - Адаптер валидации для next-intl
- [order-status.ts](./order-status.md) - Операции со статусами
- [order-utils.ts](./order-utils.md) - Утилиты заказов
- [scroll-utils.ts](./scroll-utils.md) - Скролл-утилиты
- [store-factory.ts](./store-factory.md) - Фабрики стора (Zustand helpers)
- [trpc-errors.ts](./trpc-errors.md) - Генерация tRPC ошибок
- [validation-helpers.ts](./validation-helpers.md) - Утилиты валидации
- [validation-schemas.ts](./validation-schemas.md) - Zod схемы

### 📁 Validation подсистема

- [validation/index.ts](./validation-index.md) - Экспорты валидации
- [validation/constants.ts](./validation-constants.md) - Константы валидации
- [validation/core.ts](./validation-core.md) - Ядро валидации
- [validation/field-validation.ts](./validation-field-validation.md) - Валидация полей
- [validation/handlers.ts](./validation-handlers.md) - Обработчики валидации
- [validation/hooks.ts](./validation-hooks.md) - Хуки валидации
- [validation/schema-helpers.ts](./validation-schema-helpers.md) - Помощники схем
- [validation/schemas-basic.ts](./validation-schemas-basic.md) - Базовые схемы
- [validation/schemas-composed.ts](./validation-schemas-composed.md) - Составные схемы
- [validation/schemas-crypto.ts](./validation-schemas-crypto.md) - Крипто схемы
- [validation/schemas-utils.ts](./validation-schemas-utils.md) - Утилиты схем
- [validation/single-field.ts](./validation-single-field.md) - Одиночные поля
- [validation/schemas/basic.ts](./validation-schemas-basic-nested.md) - Вложенные базовые схемы

## Принципы пакета

1. **Pure Functions** - функции без побочных эффектов
2. **Type Safety** - строгая типизация всех утилит
3. **Zod Integration** - интеграция с Zod для валидации
4. **Next-intl Support** - поддержка интернационализации
5. **Centralized Validation** - единая система валидации

## Зависимости

- **Импортирует**: @repo/constants (активно используется)
- **Экспортируется в**: @repo/ui, @repo/hooks, @repo/exchange-core, apps/\*

---

_Анализ основан на документации: DEVELOPER_GUIDE.md, PROJECT_CODEBASE_CATALOG.md, I18N_VALIDATION_ARCHITECTURE_REPORT.md_
