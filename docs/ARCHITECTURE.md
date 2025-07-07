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
- `packages/constants/src/index.ts` - Business constants and configuration
- `apps/web/server/trpc.ts` - API definition
- `packages/hooks/src/state/` - Global state

## 📦 Constants Package Usage

### Business Constants

```typescript
import { ORDER_STATUSES, USER_ROLES, HTTP_STATUS } from '@repo/constants'

// In API handlers
if (response.status === HTTP_STATUS.OK) {
  // Handle success
}

// In components
if (order.status === ORDER_STATUSES.PENDING) {
  return <PendingOrderBadge />
}

// In authorization
if (user.role === USER_ROLES.ADMIN) {
  return <AdminPanel />
}
```

### Types

```typescript
import { CurrencyType, OrderStatus, UserRole, TradingPair } from '@repo/exchange-core';

// In API handlers
function processOrder(order: OrderStatus) {
  // Type-safe order processing
}

// In components
interface UserProps {
  role: UserRole;
  tradingPair: TradingPair;
}
```

### Utils

```typescript
import { formatCurrency, validateEmail, debounce, formatDate } from '@repo/utils'

// In components
function PriceDisplay({ amount, currency }: Props) {
  return <span>{formatCurrency(amount, currency)}</span>
}

// In forms
const isValidEmail = validateEmail(email)
```

### UI Components

```typescript
import { Button, Modal, DataTable, Alert, Badge } from '@repo/ui'

// In pages
function TradingPage() {
  return (
    <div>
      <Button variant="primary" onClick={handleTrade}>
        Execute Trade
      </Button>
      <DataTable data={orders} columns={columns} />
    </div>
  )
}
```

### Hooks and State

```typescript
import { useUIStore, useTradingStore, useAuthStore } from '@repo/hooks'

// In components
function TradingPanel() {
  const { portfolio, currentPair, setTradingPair } = useTradingStore()
  const { user, isAuthenticated } = useAuthStore()

  return (
    <div>
      <h2>Portfolio: {formatCurrency(portfolio.balance)}</h2>
      <p>Current Pair: {currentPair}</p>
    </div>
  )
}
```

### Design Tokens

```typescript
import { colors, typography, spacing, breakpoints } from '@repo/design-tokens';

// In styled components or CSS-in-JS
const Button = styled.button`
  background: ${colors.primary[500]};
  font-size: ${typography.fontSize.md};
  padding: ${spacing[4]};

  @media (min-width: ${breakpoints.md}) {
    padding: ${spacing[6]};
  }
`;
```

### API Client

```typescript
import { trpc } from '@repo/api-client'

// In components
function UserList() {
  const { data: users, isLoading } = trpc.users.getAll.useQuery()
  const createUser = trpc.users.create.useMutation()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

### UI Configuration

```typescript
import { ORDER_STATUS_CONFIG, ALERT_VARIANTS } from '@repo/constants'

// Polymorphic components with configuration
function OrderStatusBadge({ status }: Props) {
  const config = ORDER_STATUS_CONFIG[status]

  return (
    <Badge variant={config.color}>
      <Icon name={config.icon} className="mr-2" />
      {config.label}
    </Badge>
  )
}

// Alert variants
<Alert variant={ALERT_VARIANTS.SUCCESS}>
  Order created successfully!
</Alert>
```
