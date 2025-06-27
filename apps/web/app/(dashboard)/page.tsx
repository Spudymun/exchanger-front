'use client'

import { Card, CardContent, CardHeader, CardTitle, Button } from "@repo/ui"
import Link from "next/link"

export default function DashboardPage() {
    const stats = [
        {
            title: "Total Balance",
            value: "$12,345.67",
            change: "+5.2%",
            trend: "up"
        },
        {
            title: "Active Trades",
            value: "8",
            change: "+2",
            trend: "up"
        },
        {
            title: "Portfolio Value",
            value: "$45,678.90",
            change: "+12.8%",
            trend: "up"
        },
        {
            title: "24h Volume",
            value: "$1,234.56",
            change: "-3.1%",
            trend: "down"
        },
    ]

    const handleQuickAction = (action: string) => {
        console.log(`${action} functionality will be implemented soon!`)
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Enterprise Dashboard</h2>
                <p className="text-muted-foreground">
                    Welcome to your enterprise trading dashboard. Here&apos;s your overview.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <div className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.trend === 'up' ? '📈' : '📉'}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {stat.change} from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Enterprise Features Showcase */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            ✅ Parallel Routes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Sidebar and modal routes working simultaneously
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            ✅ Zustand State
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Global state management with persistence
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            ✅ tRPC Ready
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            End-to-end type safety configured
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>🎯 Enterprise Roadmap Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>✅ Parallel Routes</span>
                            <span className="text-green-600">Completed</span>
                        </div>
                        <div className="flex justify-between">
                            <span>✅ tRPC Integration</span>
                            <span className="text-green-600">Completed</span>
                        </div>
                        <div className="flex justify-between">
                            <span>✅ Zustand State Management</span>
                            <span className="text-green-600">Completed</span>
                        </div>
                        <div className="flex justify-between">
                            <span>✅ Advanced i18n</span>
                            <span className="text-green-600">Configured</span>
                        </div>
                        <div className="flex justify-between">
                            <span>🚧 CI/CD Pipeline</span>
                            <span className="text-yellow-600">In Progress</span>
                        </div>
                        <div className="flex justify-between">
                            <span>🚧 Monitoring</span>
                            <span className="text-yellow-600">In Progress</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button
                        className="w-full"
                        onClick={() => handleQuickAction('New Trade')}
                    >
                        🚀 Start New Trade
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleQuickAction('View Portfolio')}
                    >
                        💼 View Portfolio
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                        <Link href="/dashboard/settings">⚙️ Open Settings</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
