# Project Structure & Organization

## Monorepo Architecture

The project follows a monorepo structure with clear separation between applications and shared packages.

```
exchanger-monorepo/
├── apps/                    # Deployable applications
│   ├── web/                # Main exchange platform (Next.js)
│   ├── admin-panel/        # Administrative dashboard (Next.js)
│   └── docs/               # Documentation site (Next.js)
├── packages/               # Shared libraries and utilities
│   ├── ui/                 # React components (shadcn/ui)
│   ├── constants/          # Business constants and configuration
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom hooks and Zustand stores
│   ├── providers/          # React providers and context
│   ├── exchange-core/      # Core business logic and types
│   ├── design-tokens/      # Design system tokens
│   ├── tailwind-preset/    # Centralized CSS variables and config
│   ├── eslint-config/      # ESLint configuration modules
│   └── typescript-config/  # TypeScript configurations
├── docs/                   # Project documentation
├── tests/                  # E2E tests (Playwright)
└── scripts/                # Build and utility scripts
```

## Applications (`apps/`)

### Web App (`apps/web/`)

Main customer-facing cryptocurrency exchange platform.

**Key directories:**

- `app/[locale]/` - Next.js App Router pages with i18n
- `src/i18n/` - Internationalization configuration
- `src/server/` - tRPC API routes and server logic
- `messages/` - Translation files (en.json, ru.json)
- `lib/` - Application-specific utilities
- `public/` - Static assets

### Admin Panel (`apps/admin-panel/`)

Administrative dashboard for exchange management.

**Key directories:**

- `app/` - Admin-specific pages and layouts
- Similar structure to web app but focused on admin functionality

### Documentation (`apps/docs/`)

Technical documentation and guides.

**Key directories:**

- `app/` - Documentation pages and navigation
- `public/` - Documentation assets

## Shared Packages (`packages/`)

### UI Components (`packages/ui/`)

Reusable React components built on shadcn/ui.

**Structure:**

- `src/components/ui/` - Base shadcn/ui components (button, input, etc.)
- `src/components/` - Composite components (data-table, forms, etc.)
- `src/lib/` - Component utilities (cn function, etc.)
- `src/stories/` - Storybook stories
- `src/__tests__/` - Component tests

### Constants (`packages/constants/`)

Centralized business constants and configuration.

**Structure:**

- `src/api.ts` - API endpoints and HTTP status codes
- `src/business.ts` - Business logic constants (order statuses, user roles)
- `src/ui.ts` - UI configuration and lookup tables
- `src/validation.ts` - Validation rules and limits
- `dist/` - Compiled JavaScript output

### Utilities (`packages/utils/`)

Pure utility functions without side effects.

**Structure:**

- `src/` - TypeScript utility functions
- Direct imports (no compilation step)

### Hooks (`packages/hooks/`)

Custom React hooks and Zustand state stores.

**Structure:**

- `src/state/` - Zustand stores (ui-store, user-store, etc.)
- `src/hooks/` - Custom React hooks
- Direct imports from TypeScript source

### Exchange Core (`packages/exchange-core/`)

Core business logic, types, and interfaces.

**Structure:**

- `src/types/` - TypeScript type definitions
- `src/utils/` - Core business utilities
- `src/data/` - Data management logic
- Mainly types and interfaces, minimal runtime code

### Design Tokens (`packages/design-tokens/`)

Design system tokens and CSS utilities.

**Structure:**

- `colors.js` - Color palette definitions
- `typography.js` - Font and text styling
- `spacing.js` - Spacing and sizing tokens
- `components.js` - Component-specific styling patterns

### Tailwind Preset (`packages/tailwind-preset/`)

Centralized CSS variables and Tailwind configuration.

**Key files:**

- `globals.css` - **Single source of truth** for all CSS variables
- `preset.js` - Tailwind preset configuration
- Auto-imported into all applications

### Configuration Packages

- `eslint-config/` - Modular ESLint configuration with lazy loading
- `typescript-config/` - Shared TypeScript configurations

## File Naming Conventions

### Components

- **PascalCase** for component files: `Button.tsx`, `DataTable.tsx`
- **kebab-case** for shadcn/ui components: `button.tsx`, `input.tsx`

### Utilities and Hooks

- **camelCase** for utility files: `formatCurrency.ts`, `validateEmail.ts`
- **kebab-case** for store files: `user-store.ts`, `ui-store.ts`

### Constants

- **kebab-case** for constant files: `api-endpoints.ts`, `order-status.ts`
- **SCREAMING_SNAKE_CASE** for constant values: `ORDER_STATUSES`, `HTTP_STATUS`

## Import Patterns

### Internal Package Imports

```typescript
// From constants package
import { ORDER_STATUSES, API_ENDPOINTS } from '@repo/constants';

// From UI package
import { Button, DataTable, Alert } from '@repo/ui';

// From utils package
import { formatCurrency, validateEmail } from '@repo/utils';

// From hooks package
import { useUIStore, useUserStore } from '@repo/hooks';
```

### Relative Imports (within packages)

```typescript
// Within a package, use relative imports
import { cn } from '../lib/utils';
import { Button } from './ui/button';
```

## Dependency Flow

The dependency flow follows a clear hierarchy:

```
Applications (web, admin-panel, docs)
    ↓
UI Components (packages/ui)
    ↓
Hooks & State (packages/hooks)
    ↓
Business Logic (packages/exchange-core)
    ↓
Constants & Utils (packages/constants, packages/utils)
```

**Rules:**

- Higher-level packages can depend on lower-level ones
- Lower-level packages should NOT depend on higher-level ones
- UI components should not contain business logic
- Constants package has no dependencies on other internal packages

## Configuration Files

### Root Level

- `turbo.json` - Turborepo build configuration
- `package.json` - Root package with workspaces
- `tsconfig.json` - Base TypeScript configuration
- `eslint.config.mjs` - Centralized ESLint configuration
- `tailwind.config.cjs` - Root Tailwind configuration

### Application Level

Each app has its own:

- `package.json` - App-specific dependencies
- `next.config.js` - Next.js configuration
- `tsconfig.json` - App-specific TypeScript config
- `tailwind.config.js` - App-specific Tailwind config

### Package Level

Each package has:

- `package.json` - Package dependencies and exports
- `tsconfig.json` - Package-specific TypeScript config (if needed)

## Best Practices

### Adding New Components

1. Create in appropriate package (`packages/ui/` for reusable, app-specific for single-use)
2. Export from package index file
3. Add Storybook story if reusable
4. Write tests for complex components

### Adding New Utilities

1. Place in `packages/utils/` for pure functions
2. Place in `packages/exchange-core/` for business logic
3. Export from package index
4. Write unit tests

### Adding New Constants

1. Add to appropriate file in `packages/constants/src/`
2. Use TypeScript `as const` for type safety
3. Export from package index
4. Replace magic strings/numbers in codebase

### Modifying Shared Packages

1. Consider impact on all consuming applications
2. Maintain backward compatibility when possible
3. Update documentation and examples
4. Run full test suite before committing
