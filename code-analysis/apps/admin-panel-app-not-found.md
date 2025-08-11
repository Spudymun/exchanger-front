### Путь: apps/admin-panel/app/not-found.tsx

**Краткое назначение (1 предложение)**

React компонент для отображения 404 ошибки в административной панели с навигационными опциями.

**Подробное описание (3–6 предложений)**

Файл реализует специализированную 404 страницу для admin-panel приложения согласно Next.js App Router conventions. Компонент отображает пользовательский интерфейс с большим числом "404", локализованными сообщениями на украинском языке и объяснением специфично для административной панели. Предоставляет две навигационные опции: переход на главную страницу админ панели и возврат назад через browser history API. Использует design system проекта с primary цветовой схемой для брендинга и консистентными переходами между состояниями кнопок. Компонент помечен как "use client" для обработки интерактивных событий browser API.

**Экспортируемые сущности / API**

- `export default function NotFound` — React компонент для 404 страницы
  - Props: отсутствуют (статический UI компонент)
  - Возврат: JSX.Element с 404 интерфейсом

**Входы (expected inputs) / Параметры**

- Компонент не принимает props — статический 404 UI

**Выходы / Побочные эффекты**

- Отображение 404 UI с навигационными опциями
- Навигация на `/admin` при клике на соответствующую кнопку
- Вызов `window.history.back()` для возврата на предыдущую страницу
- Использование browser history API для navigation

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые используют этот компонент:

- Next.js App Router автоматически показывает not-found.tsx при 404 errors в `/admin` routes
- Любые несуществующие routes в admin панели
- Программные вызовы `notFound()` функции в admin компонентах

Файлы, которые импортируются здесь:

- Отсутствуют — использует только React, browser APIs и Tailwind CSS

**Домен данных / типы**

```typescript
// Компонент не имеет props
type NotFoundProps = void;

// Возвращаемый тип
type NotFoundComponent = () => JSX.Element;

// Browser History API
interface HistoryAPI {
  back(): void;
  forward(): void;
  go(delta: number): void;
}

// Navigation actions
type NavigationAction =
  | 'home' // переход на /admin
  | 'back'; // window.history.back()
```

**Риски и безопасность**

- **Client-side navigation**: "use client" директива создает client-side dependencies
- **Browser API dependency**: window.history.back() может не работать в некоторых контекстах
- **Security links**: Прямые ссылки могут обходить аутентификацию middleware
- **User experience**: History.back() может привести на внешние сайты
- **SEO impact**: 404 страницы влияют на поисковое ранжирование

**Тесты / рекомендации по покрытию**

- Unit тесты рендеринга компонента
- Integration тесты навигационной функциональности
- Edge case тесты: отсутствие history, disabled JavaScript
- Accessibility тесты для keyboard navigation и screen readers
- Cross-browser тесты browser history API compatibility
- SEO тесты правильности 404 HTTP статуса

**Оценка сложности (low/medium/high)**

**low** — простой UI компонент с базовой навигацией

**TODO / Рефакторинг**

- Добавить проверку существования window.history перед использованием
- Реализовать интернационализацию для поддержки multiple языков
- Добавить breadcrumb навигацию для контекста
- Внедрить поисковую функциональность для admin pages
- Добавить логирование 404 ошибок для аналитики
- Реализовать suggested pages на основе URL similarity
- Добавить возможность report broken link для admin пользователей
