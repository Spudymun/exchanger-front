### Путь: apps/admin-panel/app/layout.tsx

**Краткое назначение (1 предложение)**

Root layout компонент Next.js для административной панели с настройкой провайдеров, темизации и базового HTML шаблона.

**Подробное описание (3–6 предложений)**

Файл реализует главный layout компонент для admin-panel приложения согласно Next.js App Router conventions. Настраивает базовую HTML структуру с поддержкой темной и светлой темы через suppressHydrationWarning для предотвращения hydration mismatch. Интегрирует централизованные провайдеры из shared пакета @repo/providers включая ThemeProvider с системной темой по умолчанию и Providers для состояния приложения. Включает правильное подключение стилей из UI библиотеки и локальных глобальных стилей. Конфигурирует metadata для SEO оптимизации и viewport для адаптивного дизайна административной панели.

**Экспортируемые сущности / API**

- `export const metadata: Metadata` — метаданные страницы для SEO и браузера
- `export const viewport` — настройки viewport для responsive дизайна
- `export default function RootLayout` — основной layout компонент
  - Props: `{ children: React.ReactNode }` — дочерние компоненты страниц

**Входы (expected inputs) / Параметры**

- `children: React.ReactNode` — страницы и компоненты admin панели для рендеринга внутри layout

**Выходы / Побочные эффекты**

- HTML документ с правильной структурой для admin панели
- Инициализация глобальных провайдеров состояния
- Настройка системы темизации (light/dark/system)
- Подключение глобальных стилей и шрифтов
- SEO метаданные для поисковой оптимизации

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые используют этот layout:

- Все страницы в `apps/admin-panel/app/` автоматически wrapped этим layout
- `page.tsx`, `loading.tsx`, `not-found.tsx` и другие route файлы

Файлы, которые импортируются здесь:

- `@repo/providers` — централизованные провайдеры (Providers, ThemeProvider)
- `@repo/ui/styles` — глобальные стили UI системы
- `./globals.css` — локальные стили admin панели
- `next` — типы метаданных (Metadata)

**Домен данных / типы**

```typescript
// Next.js метаданные
interface Metadata {
  title: string;
  description: string;
  keywords: string;
}

// Viewport конфигурация
interface ViewportConfig {
  width: string;
  initialScale: number;
}

// Layout Props
interface RootLayoutProps {
  children: React.ReactNode;
}

// HTML атрибуты
interface HTMLAttributes {
  lang: string;
  suppressHydrationWarning: boolean;
}
```

**Риски и безопасность**

- **Hydration issues**: suppressHydrationWarning скрывает важные предупреждения
- **Global state**: Неправильная настройка провайдеров может влиять на всю панель
- **Theme security**: Системная тема может раскрыть информацию о пользователе
- **SEO exposure**: Метаданные могут раскрыть информацию о admin панели
- **CSS conflicts**: Порядок импортов стилей может влиять на отображение

**Тесты / рекомендации по покрытию**

- Unit тесты рендеринга layout с различными children
- Integration тесты работы провайдеров в admin контексте
- Visual regression тесты для light/dark тем
- SEO тесты метаданных и viewport настроек
- Accessibility тесты базовой HTML структуры
- Performance тесты загрузки стилей и провайдеров

**Оценка сложности (low/medium/high)**

**low** — стандартный Next.js layout без сложной логики

**TODO / Рефакторинг**

- Добавить мониторинг hydration errors вместо suppressHydrationWarning
- Реализовать admin-специфичные провайдеры (auth, permissions)
- Добавить интернационализацию для поддержки multiple языков
- ✅ Реализовано: внедрен LayoutErrorBoundary на layout уровне
- Добавить analytics провайдеры для admin активности
- Реализовать feature flags провайдер для A/B тестирования
- Добавить security headers через Next.js middleware
