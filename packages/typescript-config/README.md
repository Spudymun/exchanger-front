# @repo/typescript-config

Централизованные TypeScript конфигурации для всех пакетов и приложений в ExchangeGO монорепозитории.

## 🎯 Обзор

Пакет предоставляет:

- ✅ **Единая точка истины** для TypeScript настроек
- ✅ **Специализированные конфигурации** для разных типов проектов
- ✅ **Strict typing** с современными ES2022 возможностями
- ✅ **Next.js оптимизация** с поддержкой App Router
- ✅ **React library support** для UI пакетов

## 🏗️ Архитектура пакета

### Структура конфигураций

```
packages/typescript-config/
├── base.json           # Базовая конфигурация для всех проектов
├── nextjs.json         # Next.js specific настройки
├── react-library.json  # React библиотеки (packages/ui)
└── package.json       # Метаданные пакета
```

### Иерархия наследования

```
base.json (foundation)
├── nextjs.json (extends base) → apps/web, apps/admin-panel, apps/docs
└── react-library.json (extends base) → packages/ui, packages/*
```

## 🚀 Использование

### В приложениях Next.js

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### В React библиотеках (packages)

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### В Node.js пакетах

```json
{
  "extends": "@repo/typescript-config/base.json",
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 📋 Конфигурации

### base.json

Базовая конфигурация с современными настройками:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "moduleDetection": "force",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": false,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

**Ключевые особенности:**

- **ES2022** target для современного JavaScript
- **NodeNext** module resolution для perfect imports
- **Strict mode** включен полностью
- **noUncheckedIndexedAccess** для безопасности массивов
- **Declaration maps** для лучшего developer experience

### nextjs.json

Специальные настройки для Next.js приложений:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": true,
    "jsx": "preserve",
    "noEmit": true
  }
}
```

**Next.js оптимизации:**

- **Next.js plugin** для App Router поддержки
- **ESNext modules** для bundler optimization
- **allowJs** для migration compatibility
- **jsx: preserve** для Next.js compilation
- **noEmit** так как Next.js компилирует сам

### react-library.json

Настройки для React библиотек и UI компонентов:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

**React library особенности:**

- **react-jsx** для modern JSX transform
- **Declaration generation** включена из base
- **Изоляция модулей** для лучшей tree-shaking

## 🔧 Development

### Валидация конфигураций

```bash
# Проверка корректности JSON
npx tsc --showConfig --project base.json

# Тест Next.js конфигурации
npx tsc --showConfig --project nextjs.json

# Тест React library конфигурации
npx tsc --showConfig --project react-library.json
```

### Обновление конфигураций

При изменении конфигураций:

1. **Обновите base.json** для глобальных изменений
2. **Тестируйте на всех типах проектов**
3. **Проверяйте совместимость** с existing codebase
4. **Документируйте breaking changes**

## 🎯 Best Practices

### ✅ Рекомендуется

```json
// ✅ Используйте соответствующую конфигурацию
{
  "extends": "@repo/typescript-config/nextjs.json" // для Next.js apps
}

// ✅ Добавляйте только необходимые переопределения
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist" // app-specific setting
  }
}

// ✅ Используйте include/exclude правильно
{
  "extends": "@repo/typescript-config/react-library.json",
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.stories.ts"]
}
```

### ❌ Не рекомендуется

```json
// ❌ Не переопределяйте базовые strict настройки
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "strict": false // Нарушает безопасность типов
  }
}

// ❌ Не дублируйте настройки из base
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "target": "ES2022" // Уже в base.json
  }
}
```

## 📈 Performance

### Compilation Speed

- **incremental: false** - предотвращает issues в монорепо
- **skipLibCheck: true** - быстрая проверка типов
- **isolatedModules: true** - параллельная компиляция

### Developer Experience

- **declaration: true** - автоматические .d.ts файлы
- **declarationMap: true** - source maps для definitions
- **noUncheckedIndexedAccess: true** - безопасность runtime

## 🐛 Troubleshooting

### Распространенные проблемы

#### Module Resolution Errors

```bash
# Очистка TypeScript cache
npx tsc --build --clean

# Проверка module resolution
npx tsc --traceResolution
```

#### Next.js Plugin Issues

```bash
# Убедитесь что Next.js plugin установлен
npm ls typescript

# Перезапуск Next.js dev server
npm run dev
```

#### Declaration Generation Problems

```bash
# Проверка declaration settings
npx tsc --showConfig | grep declaration

# Manual declaration generation
npx tsc --declaration --emitDeclarationOnly
```

## 📚 Связанная документация

- **[DEVELOPER_GUIDE.md](../../docs/DEVELOPER_GUIDE.md)** - Общее руководство разработчика
- **[CODE_STYLE_GUIDE.md](../../docs/CODE_STYLE_GUIDE.md)** - Стандарты кода и архитектуры
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - Официальная документация

## 📄 License

Private monorepo package - not for external distribution.

---

Built with ❤️ for ExchangeGO cryptocurrency exchange platform.
