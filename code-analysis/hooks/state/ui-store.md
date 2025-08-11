# ui-store.ts - Анализ файла

## Краткое назначение

Global UI state store для управления app-wide UI состоянием с поддержкой темы, модалов, sidebar и layout preferences.

## Подробное описание

### Основная функциональность

Файл предоставляет централизованный UI store:

- Sidebar visibility management
- Modal state tracking (generic и specific modals)
- Global loading states
- Theme management с localStorage persistence
- Layout preferences configuration
- Factory pattern для action groups

### Ключевые особенности

- **Theme persistence**: Автоматическое сохранение темы в localStorage
- **Modal management**: Dual approach - generic activeModal и specific modal flags
- **Factory actions**: Разделение actions на logical groups
- **SSR safety**: Browser checks для localStorage operations
- **Type safety**: Comprehensive TypeScript typing с constants

### Архитектурные решения

- Modular action creation через factory functions
- Theme initialization от localStorage при startup
- Separation между generic и specific modal management
- Store composition через action spreading

## Экспортируемые сущности / API

### Store interface

```typescript
interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Modals
  activeModal: string | null;
  modals: {
    settings: boolean;
    trade: boolean;
    deposit: boolean;
    withdraw: boolean;
  };
  openModal: (modalId: string) => void;
  closeModal: () => void;
  openSpecificModal: (modal: keyof UIState['modals']) => void;
  closeSpecificModal: (modal: keyof UIState['modals']) => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Layout
  layout: 'default' | 'compact' | 'wide';
  setLayout: (layout: UIState['layout']) => void;
}
```

### Action factories

```typescript
// Internal helper functions
const createSidebarActions = set => ({ toggleSidebar, setSidebarOpen });
const createModalActions = set => ({
  openModal,
  closeModal,
  openSpecificModal,
  closeSpecificModal,
});
const createConfigActions = set => ({ setGlobalLoading, setTheme, setLayout });
```

## Зависимости

### Внутренние зависимости

- `@repo/constants` - THEME_MODES, ThemeMode type
- `@repo/utils` - createStore utility

### Внешние зависимости

- Browser localStorage API

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/state/index.ts` - barrel export как useUIStoreBase
- `packages/hooks/src/useUIStore.ts` - wrapper с enhanced functionality
- `packages/providers/src/theme-provider.tsx` - theme management

### Используется совместно с

- Theme constants для type safety
- Store utilities для creation

## Возможные улучшения и риски

### Текущие риски

- **LocalStorage dependency**: Может fail в некоторых environments
- **Theme initialization**: Race conditions при startup
- **Modal management**: Dual approach может создавать inconsistencies

### Рекомендации по улучшению

1. **Enhanced error handling**: Better localStorage error handling
2. **Modal consolidation**: Choose single modal management approach
3. **Theme system**: More sophisticated theme system
4. **State validation**: Runtime validation для state integrity

## TODO и планы развития

### Краткосрочные задачи

- [ ] Consolidate modal management approaches
- [ ] Add error handling для localStorage
- [ ] Review theme initialization logic

### Долгосрочные задачи

- [ ] Advanced layout system
- [ ] Enhanced theme customization
- [ ] Global state optimization
- [ ] A11y improvements

## Дополнительные заметки

### Store architecture

```typescript
UIStore = {
  // Core state
  sidebar + modals + loading + theme + layout,

  // Composed actions
  ...sidebarActions +
  ...modalActions +
  ...configActions
}
```

### Action factory pattern

Separate factories для logical grouping:

- **createSidebarActions**: Sidebar visibility logic
- **createModalActions**: Modal state management
- **createConfigActions**: Configuration settings

### Modal management duality

Two approaches для modals:

1. **Generic**: `activeModal` string для any modal
2. **Specific**: Boolean flags для known modals

This provides flexibility но может создавать confusion.

### Theme persistence strategy

Two-step theme handling:

1. **Initialization**: Read от localStorage at startup
2. **Persistence**: Subscribe to changes и save

### SSR considerations

LocalStorage code wrapped в browser checks:

```typescript
if (typeof window !== 'undefined') {
  // localStorage operations
}
```

### Theme validation

Only valid theme modes accepted:

```typescript
if (storedTheme && Object.values(THEME_MODES).includes(storedTheme)) {
  // Use stored theme
}
```

### Store composition pattern

Actions spread into main store:

```typescript
{
  // Initial state
  sidebarOpen: true,
  // Composed actions
  ...createSidebarActions(set),
  ...createModalActions(set),
  ...createConfigActions(set),
}
```

### State categories

- **UI layout**: Sidebar, layout preferences
- **Overlay management**: Modals и dialogs
- **System state**: Loading, theme
- **User preferences**: Saved configuration

### Default values

Sensible defaults:

- Sidebar open by default
- System theme mode
- Default layout
- No active modals

### Performance considerations

- Simple state updates minimize re-renders
- LocalStorage access only when needed
- Theme subscription writes только при changes
- Factory functions reused across actions

### Integration patterns

Store designed для:

- Global UI component usage
- Theme provider integration
- Layout component management
- Modal system coordination

### Error handling gaps

Current implementation не handles:

- LocalStorage unavailable
- Invalid theme values в localStorage
- Concurrent theme updates
- State corruption scenarios

### Layout system

Basic layout options:

- 'default': Standard layout
- 'compact': Dense layout для smaller screens
- 'wide': Expanded layout для large displays

### Modal system design

Supports both approaches:

- Generic modal management для dynamic modals
- Specific flags для known application modals
- Consistent API для both approaches

### Theme system integration

Works с theme provider:

- Theme state centralized в store
- Provider subscribes к theme changes
- CSS variables updated automatically
