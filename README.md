# Exchanger Monorepo

Современный монорепозиторий с использованием Turborepo, Next.js, TypeScript и Tailwind CSS.

## Структура проекта

### Корневые файлы
- `turbo.json`: Конфигурация Turborepo.
- `package.json`: Зависимости и скрипты.
- `tsconfig.json`: Общая конфигурация TypeScript.
- `tailwind.config.js`: Конфигурация Tailwind CSS с интеграцией Design Tokens.
- `postcss.config.js`: Конфигурация PostCSS.
- `.gitignore`: Игнорируемые файлы.

### Приложения (`apps/`)
- `web/`: Основное Next.js-приложение (http://localhost:3000).
- `docs/`: Документация (http://localhost:3001).
- `admin-panel/`: Панель администратора (http://localhost:3002).

### Пакеты (`packages/`)
- `ui/`: Общая UI-библиотека.
- `design-tokens/`: Цветовые схемы, типографика и spacing для Tailwind CSS.
- `hooks/`: Переиспользуемые хуки.
- `api-client/`: Клиенты для API.
- `utils/`: Утилиты.
- `eslint-config/`: Конфигурация ESLint.
- `typescript-config/`: Конфигурация TypeScript.

## Технологии

- **Turborepo**: Монорепозиторий с оптимизацией сборки
- **Next.js 15**: React-фреймворк с App Router
- **TypeScript**: Типизация
- **Tailwind CSS 4**: Utility-first CSS фреймворк
- **Design Tokens**: Централизованная система дизайна
- **PostCSS**: CSS постпроцессор

## Скрипты

### Основные команды
- `npm run build`: Сборка всех приложений и пакетов.
- `npm run dev`: Запуск приложений в режиме разработки.
- `npm run lint`: Линтинг кода.
- `npm run format`: Форматирование файлов.
- `npm run check-types`: Проверка типов.

## Как работать с проектом

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Запустите разработку:
   ```bash
   npm run dev
   ```
   
   Приложения будут доступны по адресам:
   - Web: http://localhost:3000
   - Docs: http://localhost:3001
   - Admin Panel: http://localhost:3002

3. Сборка проекта:
   ```bash
   npm run build
   ```

4. Линтинг:
   ```bash
   npm run lint
   ```

5. Проверка типов:
   ```bash
   npm run check-types
   ```

## Design Tokens

Проект использует централизованную систему дизайна с Design Tokens в пакете `@repo/design-tokens`. Все токены автоматически интегрированы в Tailwind CSS.

### Доступные токены:
- **Цвета**: `primary`, `secondary`, `success`, `warning`, `error`, `neutral`
- **Типографика**: семейства шрифтов, размеры, веса, межстрочные расстояния
- **Spacing**: отступы, размеры, радиусы скругления
- **Тени**: наборы теней для элементов

### Использование в коде:
```tsx
// Использование цветов
<div className="bg-primary-500 text-white">
  <h1 className="text-neutral-900 font-semibold">
    Заголовок
  </h1>
</div>

// Использование spacing и radius
<div className="p-6 m-4 rounded-2xl shadow-lg">
  Контент
</div>
```

## Разработка

### Добавление новых компонентов
Создавайте переиспользуемые компоненты в пакете `packages/ui/`:

```bash
# Пример структуры
packages/ui/
├── button/
│   ├── index.tsx
│   └── button.module.css
└── index.tsx
```

### Модификация Design Tokens
Все токены находятся в `packages/design-tokens/`:
- `colors.js` - цветовые схемы
- `typography.js` - настройки типографики  
- `spacing.js` - отступы и размеры

После изменения токенов они автоматически применяются во всех приложениях через Tailwind CSS.

## Статус проекта

✅ Настроен монорепозиторий с Turborepo  
✅ Созданы базовые приложения (web, docs, admin-panel)  
✅ Настроены общие пакеты (ui, design-tokens, typescript-config)  
✅ Интегрирован Tailwind CSS с Design Tokens  
✅ Настроена система сборки и разработки  

### Следующие шаги:
- [ ] Создание UI-компонентов в пакете `ui`
- [ ] Настройка тестирования (Jest, Playwright)
- [ ] Интеграция Storybook для документации компонентов
- [ ] Настройка CI/CD
- [ ] Добавление линтера для стилей
- [ ] Настройка мониторинга и аналитики
