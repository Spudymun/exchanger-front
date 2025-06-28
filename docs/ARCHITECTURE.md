# 🏗️ Architecture Guide

## 📁 Project Structure

```
exchanger-front/
├── apps/                           # Applications
│   ├── web/                       # Main Next.js app (localhost:3000)
│   ├── admin-panel/               # Admin dashboard (localhost:3002)
│   └── docs/                      # Documentation (localhost:3001)
├── packages/                      # Shared packages
│   ├── ui/                        # UI components (shadcn/ui)
│   ├── api-client/                # tRPC client/server setup
│   ├── providers/                 # React providers
│   ├── hooks/                     # Shared hooks + Zustand stores
│   ├── design-tokens/             # Design system tokens
│   └── utils/                     # Utility functions
└── tests/                         # E2E tests (Playwright)
```

## 🔧 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand + React Query
- **API:** tRPC (end-to-end typesafe)
- **Testing:** Jest + Playwright + Storybook
- **Build:** Turborepo monorepo

## 🎯 Development Workflow

### Adding New Features

1. **UI Components** → `packages/ui/src/components/`
2. **API Endpoints** → `apps/web/server/trpc.ts`
3. **State Management** → `packages/hooks/src/state/`
4. **Pages** → `apps/web/app/[locale]/`

### Code Guidelines

- **Components:** Use shadcn/ui patterns
- **State:** Zustand for UI, React Query for server state
- **Styling:** Tailwind utility classes
- **Types:** Export from package entry points

## 🚨 Common Issues

**Problem:** Build fails
**Solution:** Run `npm run check-types` to find TypeScript errors

**Problem:** UI looks broken  
**Solution:** Check CSS variables in globals.css

**Problem:** State not syncing
**Solution:** Use correct Zustand store from `@repo/hooks`

## 🔗 Important Files

- `turbo.json` - Build configuration
- `packages/ui/src/index.ts` - UI exports
- `apps/web/server/trpc.ts` - API definition
- `packages/hooks/src/state/` - Global state

## 📋 Development Examples

### Storybook Usage
```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

Component story example:
```typescript
// packages/ui/src/stories/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from '../components/MyComponent'

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
}
```

### Playwright Testing
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test admin-panel

# Run with UI
npx playwright test --ui

# Generate test report
npx playwright show-report
```

Test example:
```typescript
// tests/admin-panel.spec.ts
import { test, expect } from '@playwright/test'

test('admin dashboard loads correctly', async ({ page }) => {
  await page.goto('/admin')
  
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByTestId('stats-card')).toHaveCount(4)
})
```

### Jest Unit Testing
```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

Test example:
```typescript
// packages/hooks/src/state/__tests__/ui-store.test.ts
import { renderHook, act } from '@testing-library/react'
import { useUIStore } from '../ui-store'

describe('UIStore', () => {
  it('should toggle sidebar', () => {
    const { result } = renderHook(() => useUIStore())
    
    act(() => {
      result.current.toggleSidebar()
    })
    
    expect(result.current.sidebarOpen).toBe(true)
  })
})
```

### State Management Examples
```typescript
// Using UI Store
import { useUIStore } from '@repo/hooks/state'

function MyComponent() {
  const { sidebarOpen, toggleSidebar, showModal } = useUIStore()
  
  return (
    <div>
      <button onClick={toggleSidebar}>
        {sidebarOpen ? 'Close' : 'Open'} Sidebar
      </button>
      <button onClick={() => showModal('settings')}>
        Open Settings
      </button>
    </div>
  )
}

// Using Trading Store
import { useTradingStore } from '@repo/hooks/state'

function TradingView() {
  const { portfolio, currentPair, setTradingPair } = useTradingStore()
  
  return (
    <div>
      <h2>Portfolio: ${portfolio.balance}</h2>
      <p>Current Pair: {currentPair}</p>
      <button onClick={() => setTradingPair('BTC/USD')}>
        Switch to BTC/USD
      </button>
    </div>
  )
}
```

### tRPC API Examples
```typescript
// apps/web/server/trpc.ts - Adding new procedure
export const appRouter = router({
  // ...existing procedures...
  
  createUser: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      // Your logic here
      return { id: '1', ...input }
    }),
})

// Using in components
import { trpc } from '../lib/trpc'

function UserList() {
  const { data: users, isLoading } = trpc.getUsers.useQuery()
  const createUser = trpc.createUser.useMutation()
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => createUser.mutate({ name: 'John', email: 'john@example.com' })}>
        Add User
      </button>
    </div>
  )
}
```

## Code Quality

### Linting & Formatting

The project uses comprehensive linting and formatting tools:

#### JavaScript/TypeScript
- **ESLint**: Static analysis and code quality
- **Prettier**: Code formatting
- **TypeScript**: Type checking

#### CSS/Styles  
- **Stylelint**: CSS/SCSS linting with Tailwind CSS support
- **Prettier**: CSS formatting
- **Tailwind CSS**: Utility-first CSS framework

#### Available Commands

```bash
# Lint all code (JS/TS + CSS)
npm run lint

# Lint only JavaScript/TypeScript
turbo run lint

# Lint only CSS/SCSS files
npm run lint:styles

# Format all code
npm run format

# Format only CSS/SCSS files  
npm run format:styles

# Type checking
npm run check-types
```

#### Pre-commit Hooks

Husky automatically runs before each commit:
- ESLint with auto-fix for JS/TS files
- Stylelint with auto-fix for CSS/SCSS files
- Prettier formatting for all supported files

#### Stylelint Configuration

The project uses:
- `stylelint-config-standard`: Standard CSS rules
- `stylelint-config-tailwindcss`: Tailwind CSS specific rules
- `stylelint-order`: Property ordering rules
- Custom rules for Tailwind directives (`@apply`, `@layer`, etc.)
