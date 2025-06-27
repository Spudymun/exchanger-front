'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui"
import Link from "next/link"

export default function Sidebar() {
    const navigationItems = [
        { href: "/dashboard", key: "overview", label: "Overview", icon: "📊" },
        { href: "/dashboard/trading", key: "trading", label: "Trading", icon: "💱" },
        { href: "/dashboard/portfolio", key: "portfolio", label: "Portfolio", icon: "💼" },
        { href: "/dashboard/transactions", key: "transactions", label: "Transactions", icon: "📋" },
        { href: "/dashboard/settings", key: "settings", label: "Settings", icon: "⚙️" },
    ]

    return (
        <div className="p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {navigationItems.map((item) => (
                        <Button
                            key={item.href}
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                        >
                            <Link href={item.href}>
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </Link>
                        </Button>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Enterprise Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                        ✅ Parallel Routes<br />
                        ✅ tRPC Integration<br />
                        ✅ Zustand State<br />
                        ✅ i18n Ready<br />
                        🚧 CI/CD Pipeline<br />
                        🚧 Monitoring
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
