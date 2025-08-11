# Constants Package Analysis

Анализ пакета `packages/constants/` - централизованного источника бизнес-констант и конфигурации.

## Архитектурная роль

**Уровень 1** в архитектуре проекта - базовый слой без зависимостей на другие internal packages.
Единый источник истины для всех магических значений, статусов и конфигураций.

## Файлы для анализа

- [api.ts](./api.md) - API endpoints и HTTP константы
- [business.ts](./business.md) - Бизнес-домен константы
- [ui.ts](./ui.md) - UI компоненты и темизация
- [auth.ts](./auth.md) - Аутентификация и авторизация
- [exchange.ts](./exchange.md) - Обменные операции
- [validation.ts](./validation.md) - Правила валидации
- [user.ts](./user.md) - Пользовательские константы
- [index.ts](./index.md) - Экспорты пакета

## Принципы пакета

1. **DRY (Don't Repeat Yourself)** - единственный источник констант
2. **Type Safety** - все константы типизированы через `as const`
3. **Semantic Naming** - понятные имена без магических значений
4. **Centralization** - все константы в одном месте
5. **Zero Dependencies** - не зависит от других internal packages

---

_Основано на ARCHITECTURE.md и CODE_STYLE_GUIDE.md_
