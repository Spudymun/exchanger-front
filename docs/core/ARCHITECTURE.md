# 🏗️ Architecture Guide

## 📁 Project Structure

```
exchanger-front/
├── apps/                           # Applications
│   ├── web/                       # Main Next.js app (localhost:3000)
│   ├── admin-panel/               # Admin dashboard (localhost:3002)
│   └── docs/                      # Documentation (localhost:3001)
├── packages/                      # Shared packages
│   ├── constants/                 # Business constants, enums, configs
│   ├── design-tokens/             # Design system tokens & typography
│   ├── eslint-config/             # Centralized ESLint configurations
│   ├── exchange-core/             # Core business logic & types
│   ├── hooks/                     # Shared hooks + Zustand stores
│   ├── providers/                 # React providers + Query Client setup
│   ├── style-scanner/             # CLI tool for style documentation
│   ├── tailwind-preset/           # Centralized CSS variables + config
│   ├── typescript-config/         # TypeScript configurations
│   ├── ui/                        # UI components (shadcn/ui)
│   └── utils/                     # Utility functions + security-enhanced validation
└── tests/                         # E2E tests (Playwright)
```

## 🔧 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui + Centralized CSS Architecture
- **State:** Zustand + React Query
- **API:** tRPC (end-to-end typesafe)
- **Testing:** Jest + Playwright + Storybook
- **Build:** Turborepo monorepo

## 🎨 CSS Architecture v3.0 - Centralized System

- **Single Source of Truth:** Все CSS переменные в `packages/tailwind-preset/globals.css`
- **Auto Import:** `@import '@repo/tailwind-preset/globals.css'` в каждом приложении
- **Zero Duplication:** CSS переменные определены только в одном месте
- **Semantic Classes:** `bg-card`, `text-foreground`, `border-border`
- **Theme Support:** Автоматическая поддержка light/dark режимов

**Детали:** См. [SEMANTIC_DESIGN_SYSTEM.md](SEMANTIC_DESIGN_SYSTEM.md)

## 🔗 API Architecture

### tRPC v11 Structure

```
apps/web/src/server/trpc/
├── routers/              # API namespace routers
│   ├── auth.ts          # Authentication & registration
│   ├── exchange.ts      # Crypto exchange operations
│   ├── user/            # User namespace (orders, profile, security)
│   ├── operator.ts      # Operator role functions
│   └── support.ts       # Support role functions
├── middleware/          # Security & authentication
│   ├── auth.ts         # Role-based access (OPERATOR/SUPPORT/ADMIN)
│   └── rateLimit.ts    # Rate limiting per endpoint
└── context.ts          # tRPC context & session
```

**Принципы:** Namespace composition, роле-основанный доступ, rate limiting

**Детали:** См. [API_DOCS.md](API_DOCS.md)

## 🔐 Security-Enhanced Validation

Комплексная система защиты от XSS, SQL injection и CSRF атак:

**Расположение:** `packages/utils/src/validation/`
**Принцип:** Все пользовательские данные проходят санитизацию
**Интеграция:** Автоматическое использование в tRPC роутерах

**Детали:** См. [SECURITY_ENHANCED_VALIDATION_GUIDE.md](SECURITY_ENHANCED_VALIDATION_GUIDE.md)

## 📦 Package Architecture

### Core Packages

- **exchange-core** - Бизнес-логика обменника (типы, managers, валидация)
- **design-tokens** - Система дизайн-токенов и типографика
- **utils** - Утилиты и security-enhanced валидация
- **style-scanner** - CLI для автоматической документации стилей

### Support Packages

- **constants** - Бизнес-константы (роли, статусы, конфигурации)
- **hooks** - Zustand stores и React hooks
- **ui** - shadcn/ui компоненты
- **providers** - React Query и контекст провайдеры

**Детали:** См. README файлы пакетов и [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

## 🔧 Build Strategies

Проект использует **5 различных стратегий сборки** в зависимости от типа пакета:

1. **Dual Export (tsup)** - `constants` с CommonJS/ESM совместимостью
2. **TS-Direct** - `utils`, `ui` используют исходники напрямую
3. **Business Logic** - `exchange-core` с runtime зависимостями
4. **CLI Tools** - `style-scanner` как executable
5. **Next.js Apps** - приложения управляются фреймворком

**Детали:** См. секцию Build Strategies в текущем файле

## 🎯 Development Workflow

### Adding New Features

1. **UI Components** → `packages/ui/src/components/`
2. **API Endpoints** → `apps/web/src/server/trpc/routers/`
3. **State Management** → `packages/hooks/src/state/`
4. **Pages** → `apps/web/app/[locale]/`

### Code Guidelines

- **Components:** Use shadcn/ui patterns + Centralized CSS variables
- **CSS:** Use semantic classes from `packages/tailwind-preset/globals.css`
- **State:** Zustand for UI, React Query for server state
- **API:** Security-enhanced schemas for all user inputs
- **Types:** Export from package entry points

## 🚨 Common Issues

**Problem:** Build fails
**Solution:** Run `npm run check-types` to find TypeScript errors

**Problem:** UI looks broken  
**Solution:** Check `@import '@repo/tailwind-preset/globals.css'` and use semantic CSS classes

**Problem:** CSS variables not working
**Solution:** Ensure proper @import order in globals.css files

**Problem:** State not syncing
**Solution:** Use correct Zustand store from `@repo/hooks`

## 🔗 Important Files

- `turbo.json` - Monorepo build configuration
- `packages/ui/src/index.ts` - UI components exports
- `packages/constants/src/index.ts` - Business constants and configuration
- `packages/exchange-core/src/index.ts` - Core business logic & types
- `packages/utils/src/validation/` - Security-enhanced validation schemas
- `packages/design-tokens/` - Design system tokens & typography
- `apps/web/src/server/trpc/` - tRPC API architecture
- `packages/hooks/src/state/` - Zustand global state
- `packages/style-scanner/` - CLI for automated style documentation

---

## 📚 Detailed Documentation Cross-References

Данная архитектурная документация дополняется специализированными руководствами:

### 🔧 **Implementation Guides**

- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Полное руководство разработчика (2,281 строк) с примерами всех технологий
- **[TASK_IMPLEMENTATION_GUIDE.md](TASK_IMPLEMENTATION_GUIDE.md)** - Универсальные чек-листы и шаблоны для реализации задач
- **[API_DOCS.md](API_DOCS.md)** - Полная tRPC API документация с примерами и middleware

### 🔒 **Security & Validation**

- **[SECURITY_ENHANCED_VALIDATION_GUIDE.md](SECURITY_ENHANCED_VALIDATION_GUIDE.md)** - Руководство по security-enhanced схемам валидации
- **[VALIDATION_ARCHITECTURE_GUIDE.md](VALIDATION_ARCHITECTURE_GUIDE.md)** - Архитектурные принципы системы валидации
- **[ROLES_ARCHITECTURE.md](ROLES_ARCHITECTURE.md)** - Permission-based access control и роли

### 🎨 **Design System**

- **[SEMANTIC_DESIGN_SYSTEM.md](SEMANTIC_DESIGN_SYSTEM.md)** - CSS Architecture v3.0 с semantic design tokens
- **[packages/design-tokens/README.md](../../packages/design-tokens/README.md)** - Детальная документация Design Tokens (398 строк)
- **[packages/style-scanner/README.md](../../packages/style-scanner/README.md)** - CLI инструмент стилизации (611 строк)

### 🔧 **Code Quality**

- **[CENTRALIZED_ESLINT_ARCHITECTURE.md](CENTRALIZED_ESLINT_ARCHITECTURE.md)** - Централизованная ESLint архитектура с lazy loading
- **[CODE_STYLE_GUIDE.md](CODE_STYLE_GUIDE.md)** - Правила стиля кода и архитектурные паттерны

### 🏗️ **Package Documentation**

- **[packages/exchange-core/README.md](../../packages/exchange-core/README.md)** - Бизнес-логика обменника (440 строк)
- **[packages/utils/README.md](../../packages/utils/README.md)** - Утилиты и валидация (526 строк)

### 📋 **Complete Documentation Catalog**

См. **[docs/README.md](../README.md)** для навигации по всем 35+ специализированным руководствам проекта.
