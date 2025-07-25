# Technology Stack & Build System

## Core Technologies

### Framework & Runtime

- **Next.js 15** - React framework with App Router
- **TypeScript 5.8.2** - Strict mode enabled for type safety
- **Node.js >=18** - Runtime requirement
- **React 19** - UI library with latest features

### Monorepo Management

- **Turborepo 2.5.4** - Build system and task orchestration
- **npm workspaces** - Package management
- **Package manager**: npm@10.9.2

### Styling & UI

- **Tailwind CSS 3.4.16** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI
- **Centralized CSS Variables** - Design tokens in `packages/tailwind-preset/globals.css`
- **PostCSS** - CSS processing

### State Management & API

- **tRPC 11.4.3** - End-to-end typesafe APIs
- **Zustand 5.0.6** - Client state management
- **React Query 5.81.5** - Server state management
- **Zod 3.25.67** - Schema validation

### Internationalization

- **next-intl 4.3.1** - Type-safe internationalization
- **Supported locales**: English (en), Russian (ru)

### Testing & Quality

- **Jest 30.0.3** - Unit testing
- **Playwright 1.53.1** - E2E testing
- **Storybook 9.0.14** - Component documentation
- **ESLint** - Code linting with custom configuration
- **Prettier 3.6.0** - Code formatting
- **Stylelint 16.21.0** - CSS linting
- **Husky 9.1.7** - Git hooks

## Build System Commands

### Development

```bash
# Start all applications in development mode
npm run dev

# Start specific application
npm run dev --filter=@repo/web
npm run dev --filter=@repo/admin-panel
npm run dev --filter=@repo/docs
```

### Building

```bash
# Build all packages and applications
npm run build

# Clean build (removes cache)
npm run build:clean

# Force rebuild (ignores cache)
npm run build:force

# Rebuild from scratch
npm run build:rebuild

# Build with bundle analysis
npm run build:analyze
```

### Testing

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Code Quality

```bash
# Lint and fix all files
npm run lint

# Check linting without fixing
npm run lint:check

# Lint and fix CSS/SCSS files
npm run lint:styles

# Format all files
npm run format

# Check TypeScript types
npm run check-types
```

### Storybook

```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

### Style Analysis

```bash
# Scan and analyze component styles
npm run scan-styles

# Verbose style scanning
npm run scan-styles:verbose

# Quick style scan
npm run scan-styles:quick

# Dry run style scan
npm run scan-styles:dry
```

## Package Architecture

### Build Strategies

Different packages use different build strategies based on their purpose:

1. **Compiled packages** (`constants`) - TypeScript compiled to dist/
2. **TS-Direct packages** (`utils`, `ui`) - Direct TypeScript imports
3. **Types-Only packages** (`exchange-core`) - Mainly TypeScript definitions
4. **Application packages** (`web`, `admin-panel`, `docs`) - Next.js managed builds

### Internal Dependencies

Use `"*"` for internal package dependencies:

```json
{
  "dependencies": {
    "@repo/constants": "*",
    "@repo/ui": "*",
    "@repo/utils": "*"
  }
}
```

## Development Workflow

### Pre-commit Hooks

Automatically run on every commit:

- ESLint with auto-fix
- Prettier formatting
- Stylelint for CSS
- TypeScript type checking
- Unit tests

### Port Allocation

- **Web App**: http://localhost:3000
- **Documentation**: http://localhost:3001
- **Admin Panel**: http://localhost:3002
- **Storybook**: http://localhost:6006

### Environment Requirements

- Node.js >= 18
- npm >= 10.9.2
- Git (for hooks and version control)

## Performance Considerations

- Turborepo caching for faster builds
- Lazy loading in ESLint configuration
- Incremental TypeScript compilation
- Bundle analysis tools for optimization
