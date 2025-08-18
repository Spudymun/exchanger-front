'use client';

import * as React from 'react';

import { cn } from '../lib/utils';

import { BaseErrorBoundary } from './error-boundaries';

// ===== ADMIN PANEL COMPOUND COMPONENTS ARCHITECTURE v2.0 =====
// Unified admin composition system extending ExchangeForm/DataTable pattern
// Migrating from Manual Composition (6/10) to Compound Components (9.5/10)

// AdminPanel Context
export interface AdminPanelContextValue {
  currentUser?: { name: string; email: string; role: string };
  theme?: 'light' | 'dark' | 'system';
  sidebarCollapsed?: boolean;
  notifications?: number;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  onSidebarToggle?: () => void;
  onUserAction?: (action: string) => void;
}

const AdminPanelContext = React.createContext<AdminPanelContextValue | undefined>(undefined);

export const useAdminPanelContext = () => {
  return React.useContext(AdminPanelContext);
};

// ===== ROOT COMPONENT =====
export interface AdminPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  currentUser?: { name: string; email: string; role: string };
  theme?: 'light' | 'dark' | 'system';
  sidebarCollapsed?: boolean;
  notifications?: number;
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  onSidebarToggle?: () => void;
  onUserAction?: (action: string) => void;
  children: React.ReactNode;
}

const AdminPanel = React.forwardRef<HTMLDivElement, AdminPanelProps>(
  (
    {
      className,
      children,
      currentUser,
      theme,
      sidebarCollapsed,
      notifications,
      onThemeChange,
      onSidebarToggle,
      onUserAction,
      ...props
    },
    ref
  ) => {
    const contextValue: AdminPanelContextValue = React.useMemo(
      () => ({
        currentUser,
        theme,
        sidebarCollapsed,
        notifications,
        onThemeChange,
        onSidebarToggle,
        onUserAction,
      }),
      [
        currentUser,
        theme,
        sidebarCollapsed,
        notifications,
        onThemeChange,
        onSidebarToggle,
        onUserAction,
      ]
    );

    return (
      <BaseErrorBoundary componentName="AdminPanel">
        <AdminPanelContext.Provider value={contextValue}>
          <div ref={ref} className={cn('min-h-screen bg-background', className)} {...props}>
            {children}
          </div>
        </AdminPanelContext.Provider>
      </BaseErrorBoundary>
    );
  }
);

AdminPanel.displayName = 'AdminPanel';

// ===== LAYOUT COMPONENT =====
export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'full' | 'sidebar' | 'split';
  children: React.ReactNode;
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ className, variant = 'sidebar', children, ...props }, ref) => {
    const getVariantClass = (v: 'full' | 'sidebar' | 'split') => {
      switch (v) {
        case 'full':
          return 'flex flex-col h-screen';
        case 'sidebar':
          return 'flex h-screen';
        case 'split':
          return 'grid grid-cols-1 lg:grid-cols-[240px_1fr] h-screen';
        default:
          return 'flex h-screen';
      }
    };

    return (
      <div ref={ref} className={cn(getVariantClass(variant), className)} {...props}>
        {children}
      </div>
    );
  }
);

Layout.displayName = 'AdminPanel.Layout';

// ===== HEADER COMPONENT =====
export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  showUserMenu?: boolean;
  showNotifications?: boolean;
  children?: React.ReactNode;
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  (
    { className, title, showUserMenu = true, showNotifications = true, children, ...props },
    ref
  ) => {
    const context = useAdminPanelContext();

    return (
      <header
        ref={ref}
        className={cn(
          'bg-card shadow-sm border-b flex items-center justify-between p-4',
          className
        )}
        {...props}
      >
        <div className="flex items-center space-x-4">
          {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
        </div>

        <div className="flex items-center space-x-4">
          {children}

          {showNotifications && context?.notifications && (
            <div className="relative">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs">{context.notifications}</span>
              </div>
            </div>
          )}

          {showUserMenu && context?.currentUser && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{context.currentUser.name}</span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {context.currentUser.name.charAt(0)}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }
);

Header.displayName = 'AdminPanel.Header';

// ===== SIDEBAR COMPONENT =====
export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: 'narrow' | 'default' | 'wide';
  children: React.ReactNode;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, width = 'default', children, ...props }, ref) => {
    const context = useAdminPanelContext();

    const getWidthClass = (w: 'narrow' | 'default' | 'wide') => {
      switch (w) {
        case 'narrow':
          return 'w-16';
        case 'default':
          return context?.sidebarCollapsed ? 'w-16' : 'w-64';
        case 'wide':
          return context?.sidebarCollapsed ? 'w-16' : 'w-80';
        default:
          return 'w-64';
      }
    };

    return (
      <aside
        ref={ref}
        className={cn(
          'bg-card border-r flex flex-col transition-all duration-200',
          getWidthClass(width),
          className
        )}
        {...props}
      >
        {children}
      </aside>
    );
  }
);

Sidebar.displayName = 'AdminPanel.Sidebar';

// ===== MAIN CONTENT AREA =====
export interface MainProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'padded' | 'full';
  children: React.ReactNode;
}

const Main = React.forwardRef<HTMLDivElement, MainProps>(
  ({ className, variant = 'padded', children, ...props }, ref) => {
    const getVariantClass = (v: 'default' | 'padded' | 'full') => {
      switch (v) {
        case 'default':
          return 'flex-1 overflow-y-auto';
        case 'padded':
          return 'flex-1 overflow-y-auto p-6';
        case 'full':
          return 'flex-1 h-full';
        default:
          return 'flex-1 overflow-y-auto p-6';
      }
    };

    return (
      <main ref={ref} className={cn(getVariantClass(variant), className)} {...props}>
        {children}
      </main>
    );
  }
);

Main.displayName = 'AdminPanel.Main';

// ===== STATS GRID COMPONENT =====
const GRID_COLUMNS = {
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  SIX: 6,
} as const;

type GridColumns = (typeof GRID_COLUMNS)[keyof typeof GRID_COLUMNS];

export interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: GridColumns;
  children: React.ReactNode;
}

const StatsGrid = React.forwardRef<HTMLDivElement, StatsGridProps>(
  ({ className, columns = GRID_COLUMNS.FOUR, children, ...props }, ref) => {
    const getColumnsClass = (cols: GridColumns) => {
      switch (cols) {
        case GRID_COLUMNS.TWO:
          return 'grid grid-cols-1 md:grid-cols-2 gap-6';
        case GRID_COLUMNS.THREE:
          return 'grid grid-cols-1 md:grid-cols-3 gap-6';
        case GRID_COLUMNS.FOUR:
          return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';
        case GRID_COLUMNS.SIX:
          return 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6';
        default:
          return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';
      }
    };

    return (
      <div ref={ref} className={cn(getColumnsClass(columns), className)} {...props}>
        {children}
      </div>
    );
  }
);

StatsGrid.displayName = 'AdminPanel.StatsGrid';

// ===== STATS CARD COMPONENT =====
export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  value?: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ className, title, value, description, trend = 'neutral', icon, ...props }, ref) => {
    const getTrendClass = (t: 'up' | 'down' | 'neutral') => {
      switch (t) {
        case 'up':
          return 'text-success';
        case 'down':
          return 'text-destructive';
        case 'neutral':
          return 'text-muted-foreground';
        default:
          return 'text-muted-foreground';
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6',
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between space-y-0 pb-2">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
        </div>

        <div>
          {value && <div className="text-2xl font-bold">{value}</div>}
          {description && <p className={cn('text-xs', getTrendClass(trend))}>{description}</p>}
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'AdminPanel.StatsCard';

// ===== CONTENT SECTION =====
export interface ContentSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  variant?: 'default' | 'card' | 'bordered';
  children: React.ReactNode;
}

const ContentSection = React.forwardRef<HTMLDivElement, ContentSectionProps>(
  ({ className, title, description, variant = 'default', children, ...props }, ref) => {
    const getVariantClass = (v: 'default' | 'card' | 'bordered') => {
      switch (v) {
        case 'default':
          return 'space-y-6';
        case 'card':
          return 'bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6 space-y-6';
        case 'bordered':
          return 'border border-border rounded-lg p-6 space-y-6';
        default:
          return 'space-y-6';
      }
    };

    return (
      <section ref={ref} className={cn(getVariantClass(variant), className)} {...props}>
        {(title || description) && (
          <div className="space-y-1">
            {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
        )}
        {children}
      </section>
    );
  }
);

ContentSection.displayName = 'AdminPanel.ContentSection';

export const AdminPanelCompound = Object.assign(AdminPanel, {
  Layout,
  Header,
  Sidebar,
  Main,
  StatsGrid,
  StatsCard,
  ContentSection,
});

export { AdminPanel as Root, Layout, Header, Sidebar, Main, StatsGrid, StatsCard, ContentSection };
export default AdminPanelCompound;
