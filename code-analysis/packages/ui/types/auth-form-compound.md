# @repo/ui/types/auth-form-compound

Централизованные TypeScript типы для AuthFormCompound системы, обеспечивающие type safety и консистентность API при работе с аутентификационными формами в compound components архитектуре.

## 📋 Экспортируемые типы

### Component Props

- **`AuthFormProviderProps`** - пропсы для корневого AuthForm провайдера
- **`FormWrapperProps`** - пропсы для HTML form обертки
- **`FieldWrapperProps`** - пропсы для field контейнера с spacing
- **`ActionsWrapperProps`** - пропсы для actions контейнера с layout

### Context Types

- **`AuthFormContextValue`** - типизированный интерфейс AuthForm контекста

## 🔗 Зависимости

### Internal Dependencies

- `../components/auth-form-compound` - импорт компонентных типов
- `../lib/auth-helpers` - импорт context типов

### Type Sources

Типы импортируются из их source файлов для избежания дублирования согласно Rule 20 проекта.

## 📖 Использование

```typescript
import type {
  AuthFormProviderProps,
  FormWrapperProps,
  FieldWrapperProps,
  ActionsWrapperProps,
  AuthFormContextValue,
} from '@repo/ui/types/auth-form-compound';

// Создание custom компонента с правильной типизацией
const CustomAuthWrapper: React.FC<AuthFormProviderProps> = ({ children, ...props }) => {
  return <AuthForm {...props}>{children}</AuthForm>;
};

// Типизация custom hooks
function useCustomAuthLogic(): AuthFormContextValue {
  const context = useAuthFormContext();
  // ... custom logic
  return context;
}
```

## 🎯 Архитектурные принципы

- **No Duplication**: Все типы импортируются из source файлов
- **Centralized Exports**: Единая точка импорта для всех auth-form типов
- **Type Safety**: Полная типизация всех auth compound компонентов
- **Consistency**: Соответствие проектным конвенциям типизации
