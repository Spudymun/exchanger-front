import { ThemeProvider } from '@repo/providers';
import { ThemeToggle, layoutStyles, pageStyles, combineStyles } from '@repo/ui';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  modal: React.ReactNode;
}

export default function DashboardLayout({ children, sidebar, modal }: DashboardLayoutProps) {
  return (
    <ThemeProvider>
      <div className={combineStyles(layoutStyles.fullHeight, 'bg-background')}>
        <div className={layoutStyles.dashboard}>
          {/* Parallel Route: Sidebar */}
          <aside className={layoutStyles.sidebar}>{sidebar}</aside>

          {/* Main Content */}
          <main className={layoutStyles.mainContent}>
            <header className={layoutStyles.header}>
              <div className="flex items-center justify-between">
                <h1 className={pageStyles.title.section}>Exchanger Dashboard</h1>
                <ThemeToggle />
              </div>
            </header>
            <div className={layoutStyles.content}>{children}</div>
          </main>
        </div>

        {/* Parallel Route: Modal */}
        {modal}
      </div>
    </ThemeProvider>
  );
}
