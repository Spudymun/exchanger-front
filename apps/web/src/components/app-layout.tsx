import { ThemeProvider } from '@repo/providers';

import { TRPCProvider } from '../../lib/trpc-provider';

import { AppFooter } from './app-footer';
import { AppHeader } from './app-header';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <TRPCProvider>
        <div className={`min-h-screen flex flex-col ${className || ''}`}>
          <AppHeader />
          <main className="flex-1" role="main">
            {children}
          </main>
          <AppFooter />
        </div>
      </TRPCProvider>
    </ThemeProvider>
  );
}
