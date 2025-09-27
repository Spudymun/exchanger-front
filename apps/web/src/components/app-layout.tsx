import { ThemeProvider } from '@repo/providers';
import { LayoutErrorBoundary } from '@repo/ui';

import { TRPCProvider } from '../../lib/trpc-provider';

import { AppFooter } from './app-footer';
import { AppHeader } from './app-header';
import { GlobalLoadingOverlay } from './global-loading-overlay';
import { NotificationDisplay } from './notification-display';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <LayoutErrorBoundary componentName="AppLayout">
      <ThemeProvider>
        <TRPCProvider>
          <div className={`min-h-screen flex flex-col overflow-x-hidden ${className || ''}`}>
            <AppHeader />
            <main className="flex-1 overflow-x-hidden" role="main">
              {children}
            </main>
            <AppFooter />
            <NotificationDisplay />
          </div>
          <GlobalLoadingOverlay />
        </TRPCProvider>
      </ThemeProvider>
    </LayoutErrorBoundary>
  );
}
