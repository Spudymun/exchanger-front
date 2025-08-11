### Путь: packages/hooks/src/useTheme.ts

**Краткое назначение (1 предложение)**

Enhanced theme hook с интегрированными уведомлениями и централизованным state management для unified API управления темами.

**Подробное описание (3–6 предложений)**

Модуль предоставляет высокоуровневый интерфейс для управления темами приложения с интеграцией системы уведомлений и централизованного UI состояния. Hook объединяет функциональность переключения тем с пользовательскими уведомлениями о смене режима, обеспечивая лучший UX feedback. Использует типизированные константы из @repo/constants для type-safe работы с темами и предоставляет convenience boolean флаги для проверки текущего режима. Система построена поверх enhanced UI store для централизованного управления состоянием UI и интегрируется с notification системой для информирования пользователей. Архитектура включает мемоизированные callbacks для оптимизации производительности и предотвращения лишних re-renders. Hook предоставляет clean API с JSDoc документацией и примерами использования для разработчиков.

**Экспортируемые сущности / API**

- `export function useTheme()` — Enhanced theme management hook

**Входы (expected inputs) / Параметры**

- Hook не принимает параметры — использует внутренние dependencies

**Выходы / Побочные эффекты**

- Возвращает объект с theme API:
  - `theme: ThemeMode` — текущая тема из store
  - `setTheme: (newTheme: ThemeMode) => void` — функция смены темы с уведомлениями
  - `isLight: boolean` — флаг светлой темы
  - `isDark: boolean` — флаг темной темы
  - `isSystem: boolean` — флаг системной темы
- Побочные эффекты:
  - Обновление UI store при смене темы
  - Показ success уведомления при переключении
  - DOM манипуляции через CSS переменные (через store)
  - localStorage сохранение выбранной темы (через store)

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `packages/hooks/src/client-hooks.ts` — реэкспорт для клиентских компонентов
- `packages/ui/src/components/theme-toggle.tsx` — компонент переключения темы (через @repo/providers)

Файлы, которые импортируются здесь:

- `@repo/constants` — THEME_MODES константы и ThemeMode тип
- `react` — useCallback для мемоизации
- `./useNotifications` — success уведомления
- `./useUIStore` — useUIStoreEnhanced для state management

**Домен данных / типы**

```typescript
// Theme types from constants
type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODES = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
  SYSTEM: 'system' as const,
};

// Hook return type
interface UseThemeReturn {
  theme: ThemeMode;
  setTheme: (newTheme: ThemeMode) => void;
  isLight: boolean;
  isDark: boolean;
  isSystem: boolean;
}

// Theme names mapping for notifications
interface ThemeNames {
  [THEME_MODES.LIGHT]: 'light';
  [THEME_MODES.DARK]: 'dark';
  [THEME_MODES.SYSTEM]: 'system';
}

// Enhanced UI store integration
interface UIStoreThemeAPI {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}
```

**Риски и безопасность**

- **Notification spam**: частое переключение тем может создать много уведомлений
- **Performance impact**: callback creation может вызывать re-renders без мемоизации
- **State consistency**: theme должна синхронизироваться между store и DOM
- **Browser compatibility**: system theme detection зависит от поддержки prefers-color-scheme
- **Accessibility concerns**: автоматические theme переключения могут нарушить пользовательские настройки
- **Flash of unstyled content**: неправильная инициализация темы может вызвать FOUC
- **Memory leaks**: неправильная очистка store subscriptions

**Тесты / рекомендации по покрытию**

- Unit тесты для setTheme: проверка вызова store.setTheme и notifications.success
- Unit тесты для boolean флагов: корректность isLight, isDark, isSystem для всех тем
- Integration тесты: совместная работа с UI store и notification системой
- Callback memoization тесты: проверка что setTheme не пересоздается без изменений dependencies
- Theme transition тесты: плавные переходы между темами
- Accessibility тесты: соответствие пользовательским предпочтениям
- Performance тесты: влияние на re-rendering при частом использовании

**Оценка сложности (low/medium/high)**

**low** — простой wrapper с понятной логикой, но интегрированный с multiple системами.

**TODO / Рефакторинг**

- Добавить debouncing для предотвращения notification spam при быстром переключении
- Рассмотреть добавление transition эффектов для плавного переключения тем
- Добавить настройки пользователя для отключения уведомлений о смене темы
- Реализовать автоматическое переключение темы по времени суток
- Добавить поддержку кастомных цветовых схем помимо standard light/dark
- Рассмотреть интеграцию с CSS-in-JS библиотеками для динамического стилинга
- Добавить аналитику для трекинга предпочтений пользователей по темам
