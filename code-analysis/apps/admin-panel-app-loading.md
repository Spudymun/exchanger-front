### Путь: apps/admin-panel/app/loading.tsx

**Краткое назначение (1 предложение)**

React Suspense loading компонент для отображения состояния загрузки административной панели.

**Подробное описание (3–6 предложений)**

Файл реализует специализированный loading UI для admin-panel приложения согласно Next.js App Router conventions с поддержкой React Suspense. Компонент отображает центрированный спиннер с анимацией вращения и локализованными сообщениями на украинском языке для admin пользователей. Использует design system проекта с primary цветовой схемой для брендинга и neutral цвета для текста, обеспечивая консистентность с остальной админ панелью. Структура включает визуальный индикатор загрузки (rotating border spinner) и информативные сообщения для улучшения пользовательского опыта во время ожидания. Компонент автоматически отображается Next.js во время server-side рендеринга или при использовании Suspense boundaries.

**Экспортируемые сущности / API**

- `export default function Loading` — React компонент loading состояния
  - Props: отсутствуют (статический UI компонент)
  - Возврат: JSX.Element с loading интерфейсом

**Входы (expected inputs) / Параметры**

- Компонент не принимает props — статический loading UI

**Выходы / Побочные эффекты**

- Отображение loading UI с анимированным спиннером
- Показ локализованных сообщений о загрузке
- Занимает полную высоту экрана для immersive loading experience
- Отсутствие side effects или state mutations

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые используют этот компонент:

- Next.js App Router автоматически показывает loading.tsx при загрузке routes в `/admin`
- React Suspense boundaries в admin панели
- Server-side рендеринг процесс для страниц admin панели

Файлы, которые импортируются здесь:

- Отсутствуют — использует только React JSX и Tailwind CSS классы

**Домен данных / типы**

```typescript
// Компонент не имеет props
type LoadingProps = void;

// Возвращаемый тип
type LoadingComponent = () => JSX.Element;

// CSS классы для spinner анимации
interface SpinnerClasses {
  container: 'animate-spin rounded-full';
  sizing: 'h-16 w-16';
  borders: 'border-4 border-primary-200 border-t-primary-600';
}

// Локализованные тексты
interface LoadingTexts {
  title: 'Загрузка панели администратора...';
  subtitle: 'Пожалуйста, подождите';
}
```

**Риски и безопасность**

- **User experience**: Длительное отображение может указывать на проблемы производительности
- **Accessibility**: Отсутствие ARIA атрибутов для screen readers
- **Performance**: CSS анимации могут влиять на производительность слабых устройств
- **Localization**: Хардкодированные тексты на украинском языке
- **Design consistency**: Изменения в design tokens могут нарушить стилинг

**Тесты / рекомендации по покрытию**

- Unit тесты рендеринга компонента
- Visual regression тесты анимации спиннера
- Accessibility тесты для screen readers и keyboard navigation
- Performance тесты анимации на различных устройствах
- Integration тесты с Next.js Suspense системой
- Cross-browser тесты корректности отображения

**Оценка сложности (low/medium/high)**

**low** — простой статический UI компонент с CSS анимацией

**TODO / Рефакторинг**

- Добавить ARIA атрибуты для accessibility (aria-label, role="status")
- Реализовать интернационализацию для поддержки multiple языков
- Добавить возможность показа progress индикатора для длительных операций
- Внедрить skeleton loading для более детального UI placeholder
- Добавить timeout для показа дополнительной информации при долгой загрузке
- Реализовать reduced motion вариант для пользователей с motion sensitivity
- Добавить возможность отмены загрузки через escape key
