# useAuth.ts - Анализ файла

## Краткое назначение

Enhanced Auth Hook с интегрированными уведомлениями и проверкой разрешений - deprecated в пользу локализованных решений.

## Подробное описание

### Основная функциональность

Файл предоставляет `useEnhancedAuth` hook, который обертывает базовый Auth context дополнительной функциональностью:

- Автоматические уведомления для auth операций
- Проверка пользовательских разрешений
- Enhanced error handling с константами

### Ключевые особенности

- **DEPRECATED статус**: Явно помечен как устаревший в комментариях
- **Migration path**: Переход на `useAuthMutations` с локализованными переводами
- **Separation of concerns**: Отдельные helper функции для каждой auth операции
- **Type safety**: Полное типирование с `AuthUser` и `AuthContextType` интерфейсами

### Архитектурные решения

- Использование wrapper pattern для расширения базового auth context
- Интеграция с notification system через `useNotifications`
- Permission-based authorization с ролевой моделью
- Error handling с fallback на константы UI

## Экспортируемые сущности / API

### Основные exports

```typescript
// Главная функция (deprecated)
export function useEnhancedAuth(baseAuth: AuthContextType): EnhancedAuthType;

// Типы
interface AuthUser {
  id: string;
  email: string;
  isVerified: boolean;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Enhanced возможности

- `hasPermission(permission: string): boolean` - проверка разрешений
- `requireAuth(): boolean` - проверка авторизации
- Enhanced login/register/logout с automatic notifications

## Зависимости

### Внутренние зависимости

- `@repo/constants` - UI_NUMERIC_CONSTANTS, BUSINESS_LIMITS
- `../useNotifications` - система уведомлений

### Внешние зависимости

- Нет прямых внешних зависимостей

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/client-hooks.ts` - barrel export
- Упоминается в документации как часть business logic layer

### Использует

- `useNotifications` hook для уведомлений
- Constants для error handling и timeouts

## Возможные улучшения и риски

### Текущие риски

- **DEPRECATED STATUS**: Файл помечен как устаревший
- **Hardcoded messages**: Нелокализованные сообщения в уведомлениях
- **Legacy code**: Используется старый подход без i18n

### Рекомендации по улучшению

1. **Migration completion**: Завершить переход на `useAuthMutations`
2. **Localization**: Все сообщения должны быть локализованы
3. **Documentation**: Обновить docs после завершения миграции
4. **Testing**: Покрыть тестами permission logic

## TODO и планы развития

### Краткосрочные задачи

- [ ] Завершить миграцию на `useAuthMutations`
- [ ] Убрать deprecated код после проверки использования
- [ ] Обновить client-hooks.ts exports

### Долгосрочные задачи

- [ ] Унифицировать permission system с backend
- [ ] Добавить role-based access control (RBAC)
- [ ] Интегрировать с централизованной системой авторизации

## Дополнительные заметки

### Migration context

Файл является частью большой миграции от hardcoded messages к полной локализации. Связанные файлы:

- `useAuthMutations.ts` - новый подход с i18n
- `useNotifications.ts` - также обновлен для локализации

### Permission model

Текущая модель разрешений поддерживает:

- `admin` - административные права
- `verified` - верифицированные пользователи
- `user` - базовые права

### Code quality notes

- Helper functions хорошо разделены для maintainability
- Type safety на высоком уровне
- Error handling с proper fallbacks
- Clear deprecation warnings для developers
