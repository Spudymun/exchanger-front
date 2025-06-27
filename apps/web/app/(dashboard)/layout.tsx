import { ThemeProvider } from "@repo/providers"
import { ThemeToggle } from "@repo/ui"

interface DashboardLayoutProps {
    children: React.ReactNode
    sidebar: React.ReactNode
    modal: React.ReactNode
}

export default function DashboardLayout({
    children,
    sidebar,
    modal,
}: DashboardLayoutProps) {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-background">
                <div className="flex h-screen">
                    {/* Parallel Route: Sidebar */}
                    <aside className="w-64 border-r bg-muted/10">
                        {sidebar}
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 overflow-auto">
                        <header className="border-b px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold">Exchanger Dashboard</h1>
                                <ThemeToggle />
                            </div>
                        </header>
                        <div className="p-6">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Parallel Route: Modal */}
                {modal}
            </div>
        </ThemeProvider>
    )
}
