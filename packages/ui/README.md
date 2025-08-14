# @repo/ui

Modern React UI component library for ExchangeGO cryptocurrency exchange built with TypeScript, Tailwind CSS, and shadcn/ui foundation. Implements Compound Components Pattern v2.0 for maximum flexibility and developer experience.

## 📦 Overview

This package provides a comprehensive collection of React components for building modern, accessible, and responsive user interfaces in the ExchangeGO monorepo. Built with strict TypeScript, Tailwind CSS utilities, and following established design patterns.

### 🎯 **Key Features**

- ✅ **Compound Components Pattern v2.0** - Flexible, context-aware composition
- ✅ **shadcn/ui Foundation** - Industry-standard accessible primitives
- ✅ **TypeScript-first** - Full type safety and IntelliSense support
- ✅ **Tailwind CSS Integration** - Utility-first styling with design system
- ✅ **SSR Compatible** - Works seamlessly with Next.js App Router
- ✅ **Tree-shakeable** - Optimized bundle size with proper exports
- ✅ **Storybook Documentation** - Interactive component playground
- ✅ **Test Coverage** - Jest and Testing Library integration

## 🏗️ Architecture

### Component Hierarchy

```
packages/ui/src/
├── components/
│   ├── ui/                     # 🔧 Primitive Components (shadcn/ui)
│   │   ├── button.tsx         # Button with variants
│   │   ├── input.tsx          # Form inputs
│   │   ├── card.tsx           # Container cards
│   │   ├── dialog.tsx         # Modal dialogs
│   │   ├── table.tsx          # Basic tables
│   │   ├── dropdown-menu.tsx  # Dropdown menus
│   │   ├── form.tsx          # Form components
│   │   ├── label.tsx         # Form labels
│   │   ├── select.tsx        # Select dropdowns
│   │   ├── textarea.tsx      # Text areas
│   │   ├── spinner.tsx       # Loading spinners
│   │   ├── notification.tsx  # Notification components
│   │   └── math-captcha.tsx  # Math CAPTCHA component
│   │
│   ├── auth/                   # 🔐 Domain Components
│   │   ├── AuthEmailField.tsx
│   │   ├── AuthPasswordField.tsx
│   │   ├── AuthConfirmPasswordField.tsx
│   │   ├── AuthCaptchaField.tsx
│   │   ├── AuthSubmitButton.tsx
│   │   ├── AuthSwitchButton.tsx
│   │   ├── AuthFormLayout.tsx
│   │   └── index.ts           # Barrel export
│   │
│   ├── tree-view/             # 🌳 Sub-components
│   │   └── TreeNodeItem.tsx   # Internal tree node
│   │
│   ├── data-table-compound.tsx    # 📊 Compound Components
│   ├── header-compound.tsx        # 🧭 Layout compounds
│   ├── footer-compound.tsx        # 🦶 Layout compounds
│   ├── admin-panel-compound.tsx   # 🎛️  Business compounds
│   ├── exchange-form.tsx          # 💱 Business logic
│   ├── tree-view.tsx              # 🌳 Complex UI
│   ├── adaptive-container.tsx     # 📱 Responsive containers
│   ├── floating-action-button.tsx # 🎯 FAB component
│   ├── theme-toggle.tsx           # 🌙 Theme switching
│   └── index.ts                   # Main exports
│
├── lib/                       # 🛠️ Utilities & Helpers
│   ├── utils.ts              # Tailwind merge utilities
│   ├── shared-styles.ts      # Centralized CSS classes
│   ├── header-helpers.tsx    # Context enhancement
│   ├── header-types.ts       # TypeScript definitions
│   └── useMathCaptchaLocal.ts # Local CAPTCHA logic
│
├── stories/                   # 📚 Storybook Documentation
│   ├── Button.stories.tsx
│   ├── Card.stories.tsx
│   ├── DataTable.stories.tsx
│   ├── Dialog.stories.tsx
│   ├── DropdownMenu.stories.tsx
│   ├── Footer.stories.tsx
│   ├── Form.stories.tsx
│   ├── Input.stories.tsx
│   ├── Label.stories.tsx
│   ├── Notification.stories.tsx
│   ├── Select.stories.tsx
│   ├── Spinner.stories.tsx
│   ├── Table.stories.tsx
│   ├── Textarea.stories.tsx
│   ├── TreeView.stories.tsx
│   ├── design-tokens/        # Design system demos
│   └── ...
│
├── styles/                    # 🎨 Stylesheets
│   ├── globals.css           # UI-specific global styles
│   └── adaptive-container.css # Component styles
│
├── types/                     # 📋 Type Definitions
│   ├── auth-fields.ts        # Auth-related types
│   └── jest.d.ts             # Test types
│
└── __tests__/                # 🧪 Unit Tests
    ├── Button.test.tsx
    └── DataTable.test.tsx
```

### Design Patterns

#### **1. Compound Components Pattern v2.0**

```tsx
// ✅ Modern approach with context enhancement
<DataTable data={users} isLoading={loading} searchTerm={search}>
  <DataTable.Container>
    <DataTable.Header title="Users" description="Manage team members" />
    <DataTable.Filters /> {/* Auto-enhanced with search */}
    <DataTable.Content>
      <DataTable.TableWrapper>{/* Your table content */}</DataTable.TableWrapper>
    </DataTable.Content>
    <DataTable.Pagination /> {/* Auto-enhanced with data */}
  </DataTable.Container>
</DataTable>
```

#### **2. Domain-Based Organization**

```tsx
// Auth components grouped by domain
import { AuthEmailField, AuthPasswordField, AuthCaptchaField, AuthSubmitButton } from '@repo/ui';

// Clean, semantic form composition
<form>
  <AuthEmailField form={form} />
  <AuthPasswordField form={form} />
  <AuthCaptchaField form={form} isLoading={isLoading} t={t} />
  <AuthSubmitButton isLoading={isLoading} t={t} />
</form>;
```

#### **3. Hierarchical Sub-components**

```tsx
// Main component imports sub-components
// tree-view.tsx
import { TreeNodeItem } from './tree-view/TreeNodeItem';

// Clean public API
<TreeView data={treeData} onSelect={handleSelect}>
  {/* TreeNodeItem used internally */}
</TreeView>;
```

## 🚀 Installation

This package is automatically available in the monorepo workspace:

```json
{
  "dependencies": {
    "@repo/ui": "*"
  }
}
```

## 📖 Usage

### Basic Components

```tsx
import { Button, Input, Card } from '@repo/ui';

function MyComponent() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Login Form</Card.Title>
      </Card.Header>
      <Card.Content>
        <Input placeholder="Email address" />
        <Button>Sign In</Button>
      </Card.Content>
    </Card>
  );
}
```

### Compound Components

```tsx
import { Header, DataTable, AdminPanel } from '@repo/ui';

// Header with automatic context enhancement
function AppHeader() {
  return (
    <Header currentLocale="en" isAuthenticated={user.isAuth} onLocaleChange={handleLocaleChange}>
      <Header.Container>
        <Header.Logo />
        <Header.Navigation />
        <Header.Actions>
          <Header.LanguageSwitcher /> {/* Auto-enhanced */}
          <Header.UserMenu /> {/* Auto-enhanced */}
        </Header.Actions>
      </Header.Container>
    </Header>
  );
}

// Data table with flexible composition
function UsersTable() {
  return (
    <DataTable data={users} isLoading={loading}>
      <DataTable.Container>
        <DataTable.Header title="Team Members" />
        <DataTable.Filters showSearch={true} />
        <DataTable.Content>
          <DataTable.TableWrapper>{/* Your table rows */}</DataTable.TableWrapper>
        </DataTable.Content>
        <DataTable.Pagination showInfo={true} />
      </DataTable.Container>
    </DataTable>
  );
}

// Admin panel layout
function Dashboard() {
  return (
    <AdminPanel>
      <AdminPanel.Layout>
        <AdminPanel.Header title="Dashboard" />
        <AdminPanel.Sidebar>
          <TreeView data={navigationData} />
        </AdminPanel.Sidebar>
        <AdminPanel.Main>
          <AdminPanel.StatsGrid>
            <AdminPanel.StatsCard title="Users" value="1,234" />
            <AdminPanel.StatsCard title="Orders" value="5,678" />
          </AdminPanel.StatsGrid>
        </AdminPanel.Main>
      </AdminPanel.Layout>
    </AdminPanel>
  );
}
```

### Authentication Components

```tsx
import {
  AuthEmailField,
  AuthPasswordField,
  AuthCaptchaField,
  AuthSubmitButton,
  AuthFormLayout,
} from '@repo/ui';
import { useFormWithNextIntl } from '@repo/hooks/src/client-hooks';
import { useTranslations } from 'next-intl';

function LoginForm() {
  const form = useFormWithNextIntl(loginSchema);
  const t = useTranslations('auth');

  return (
    <AuthFormLayout title={t('signIn')} description={t('welcome')}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AuthEmailField form={form} />
        <AuthPasswordField form={form} />
        <AuthCaptchaField form={form} isLoading={isLoading} t={t} />
        <AuthSubmitButton isLoading={isLoading} t={t}>
          {t('signIn')}
        </AuthSubmitButton>
      </form>
    </AuthFormLayout>
  );
}
```

### Tree View with Complex Data

```tsx
import { TreeView, type TreeNode } from '@repo/ui';

const navigationData: TreeNode[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <HomeIcon />,
    children: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'reports', label: 'Reports' },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: <UsersIcon />,
    children: [
      { id: 'all-users', label: 'All Users' },
      { id: 'roles', label: 'Roles & Permissions' },
    ],
  },
];

function Navigation() {
  return (
    <TreeView
      data={navigationData}
      defaultExpanded={['dashboard']}
      showLines={true}
      onSelect={handleNavigation}
    />
  );
}
```

### Custom Styling with Shared Styles

```tsx
import { combineStyles, cardStyles, textStyles } from '@repo/ui';

function CustomCard() {
  return (
    <div className={combineStyles(cardStyles.base, cardStyles.hover, 'custom-class')}>
      <h3 className={textStyles.heading.lg}>Title</h3>
      <p className={textStyles.body.md}>Description</p>
    </div>
  );
}
```

## 🎨 Styling System

### Tailwind CSS Integration

All components use Tailwind CSS with semantic design tokens:

```tsx
// ✅ Semantic classes from @repo/tailwind-preset
className = 'bg-card text-foreground border-border';

// ✅ Component variants with class-variance-authority
const buttonVariants = cva('inline-flex items-center justify-center rounded-md', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      outline: 'border border-input bg-background',
    },
  },
});
```

### Shared Styles Utilities

```tsx
import { cardStyles, textStyles, statusStyles, combineStyles } from '@repo/ui';

// Centralized style definitions
const cardClass = cardStyles.base; // "rounded-lg border bg-white p-4"
const titleClass = textStyles.heading.lg; // "text-xl font-semibold text-gray-900"
const successClass = statusStyles.success; // "text-green-600 bg-green-50"
```

## 🧪 Testing

### Running Tests

```bash
# Run all UI tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Examples

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@repo/ui';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
});

test('handles click events', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## 📚 Storybook

Interactive component documentation and playground:

```bash
# Start Storybook (from monorepo root)
npm run storybook

# Build Storybook
npm run build-storybook
```

Components are organized by categories:

- **UI/Components** - Basic primitives (Button, Input, Card)
- **Complex** - Compound components (DataTable, Header, AdminPanel)
- **Design Tokens** - Colors, Typography, Spacing demos

## 🔧 Development

### Adding New Components

#### 1. Basic UI Component (shadcn/ui style)

```tsx
// packages/ui/src/components/ui/my-component.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const myComponentVariants = cva('base-styles', {
  variants: {
    variant: {
      default: 'default-styles',
      outline: 'outline-styles',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {
  children?: React.ReactNode;
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(myComponentVariants({ variant }), className)} {...props}>
        {children}
      </div>
    );
  }
);

MyComponent.displayName = 'MyComponent';
```

#### 2. Compound Component

```tsx
// packages/ui/src/components/my-compound.tsx
import React, { createContext, useContext } from 'react';

// Context for sharing state
interface MyCompoundContextValue {
  isLoading?: boolean;
  variant?: string;
}

const MyCompoundContext = createContext<MyCompoundContextValue>({});

// Main component
export function MyCompound({ children, isLoading, variant = 'default' }: MyCompoundProps) {
  return (
    <MyCompoundContext.Provider value={{ isLoading, variant }}>
      <div className="my-compound-container">{children}</div>
    </MyCompoundContext.Provider>
  );
}

// Sub-components
function Header({ children }: { children: React.ReactNode }) {
  const { variant } = useContext(MyCompoundContext);
  return <div className={`header-${variant}`}>{children}</div>;
}

function Content({ children }: { children: React.ReactNode }) {
  const { isLoading } = useContext(MyCompoundContext);
  if (isLoading) return <div>Loading...</div>;
  return <div>{children}</div>;
}

// Compound export
export const MyCompoundComponent = Object.assign(MyCompound, {
  Header,
  Content,
});
```

#### 3. Export in index.ts

```tsx
// packages/ui/src/components/index.ts
export { MyComponent, type MyComponentProps } from './ui/my-component';
export { MyCompoundComponent as MyCompound, type MyCompoundProps } from './my-compound';
```

#### 4. Add Storybook Story

```tsx
// packages/ui/src/stories/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from '../components/ui/my-component';

const meta: Meta<typeof MyComponent> = {
  title: 'UI/Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Hello World',
  },
};
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run check-types

# Style linting
npm run lint:styles
```

## 📋 Component Categories

### 🔧 **UI Primitives** (`components/ui/`)

- `Button` - Action buttons with variants
- `Input` - Form input fields
- `Card` - Container cards with header/content/footer
- `Dialog` - Modal dialogs and overlays
- `Table` - Basic table structures
- `Form` - Form field components
- `Select` - Dropdown selections
- `Spinner` - Loading indicators
- `Notification` - Alert messages

### 🔐 **Auth Components** (`components/auth/`)

- `AuthEmailField` - Email input with validation
- `AuthPasswordField` - Password input with toggle
- `AuthCaptchaField` - Math CAPTCHA integration
- `AuthSubmitButton` - Form submission handling
- `AuthFormLayout` - Consistent auth layouts

### 📊 **Compound Components** (`components/`)

- `DataTable` - Flexible data tables with search/pagination
- `Header` - Application headers with navigation
- `Footer` - Application footers with links
- `AdminPanel` - Dashboard layouts with sidebar
- `ExchangeForm` - Cryptocurrency exchange forms
- `TreeView` - Hierarchical navigation trees

### 🛠️ **Utilities** (`lib/`)

- `utils.ts` - Tailwind merge helpers
- `shared-styles.ts` - Centralized CSS classes
- `header-helpers.tsx` - Context enhancement utilities
- `useMathCaptchaLocal.ts` - Local CAPTCHA state management

## 🔗 Dependencies

### Production Dependencies

```json
{
  "@radix-ui/react-*": "^2.x", // Accessible primitives
  "@repo/constants": "*", // Shared constants
  "@repo/providers": "*", // Context providers
  "class-variance-authority": "^0.7", // Variant management
  "clsx": "^2.1", // Conditional classes
  "lucide-react": "^0.525", // Icon library
  "tailwind-merge": "^3.3", // Tailwind utilities
  "tailwindcss-animate": "^1.0" // Animation utilities
}
```

### Development Dependencies

```json
{
  "@repo/eslint-config": "*", // ESLint rules
  "@repo/typescript-config": "*", // TypeScript config
  "@testing-library/react": "^16.3", // Testing utilities
  "@types/jest": "^30.0", // Jest types
  "tailwindcss": "^3.4.16", // Styling framework
  "typescript": "5.8.2" // Type checking
}
```

## 📈 Performance

### Bundle Optimization

- **Tree-shakeable exports** - Import only what you use
- **Code splitting** - Automatic with Next.js
- **SSR compatible** - Works with server-side rendering
- **Tailwind purging** - Unused styles removed in production

### Best Practices

```tsx
// ✅ Tree-shakeable imports
import { Button, Card } from '@repo/ui';

// ❌ Avoid importing everything
import * as UI from '@repo/ui';

// ✅ Conditional imports for large components
const DataTable = lazy(() => import('@repo/ui').then(m => ({ default: m.DataTable })));
```

## 🚀 Migration from Legacy

### Compound Components Migration

```tsx
// ❌ Legacy approach
import { DataTable, DataTableHeader, DataTableBody, DataTablePagination } from '@repo/ui';

<DataTable data={data} loading={loading}>
  <DataTableHeader sortBy={sortBy} onSort={onSort} />
  <DataTableBody data={data} loading={loading} />
  <DataTablePagination data={data} page={page} onPageChange={onPageChange} />
</DataTable>;

// ✅ Modern approach
import { DataTable } from '@repo/ui';

<DataTable data={data} isLoading={loading} sortBy={sortBy} onSort={onSort}>
  <DataTable.Container>
    <DataTable.Header /> {/* Auto-enhanced from context */}
    <DataTable.Content>
      <DataTable.TableWrapper>{/* Your content */}</DataTable.TableWrapper>
    </DataTable.Content>
    <DataTable.Pagination /> {/* Auto-enhanced from context */}
  </DataTable.Container>
</DataTable>;
```

## 🐛 Troubleshooting

### Common Issues

#### TypeScript Errors

```bash
# Clear TypeScript cache
npx tsc --build --clean

# Check types
npm run check-types
```

#### Styling Issues

```bash
# Rebuild Tailwind
npm run build

# Check Tailwind config
npx tailwindcss --init --dry-run
```

#### Import Errors

```tsx
// ✅ Correct imports
import { Button } from '@repo/ui';
import { useUIStore } from '@repo/hooks/src/client-hooks';

// ❌ Incorrect imports
import { Button } from '@repo/ui/src/components/ui/button';
```

## 📞 Support

- **Documentation**: [Storybook](http://localhost:6006) (when running)
- **Architecture Guide**: `docs/ARCHITECTURE.md`
- **Migration Guide**: `docs/COMPOUND_COMPONENTS_MIGRATION_GUIDE.md`
- **Style Guide**: `docs/CODE_STYLE_GUIDE.md`

## 📄 License

Private monorepo package - not for external distribution.

---

Built with ❤️ for ExchangeGO cryptocurrency exchange platform.
