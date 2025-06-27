'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    DataTable,
    type Column,
    TreeView,
    type TreeNode,
    ThemeToggle
} from '@repo/ui'
import { Users, CreditCard, TrendingUp, Settings } from 'lucide-react'

// Sample data for DataTable
interface User {
    id: number
    name: string
    email: string
    role: string
    status: 'active' | 'inactive'
    lastLogin: string
}

const users: User[] = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
        status: 'active',
        lastLogin: '2024-01-15',
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'User',
        status: 'active',
        lastLogin: '2024-01-14',
    },
    {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'User',
        status: 'inactive',
        lastLogin: '2024-01-10',
    },
]

const columns: Column<User>[] = [
    {
        key: 'id',
        header: 'ID',
        sortable: true,
    },
    {
        key: 'name',
        header: 'Name',
        sortable: true,
        filterable: true,
    },
    {
        key: 'email',
        header: 'Email',
        sortable: true,
        filterable: true,
    },
    {
        key: 'role',
        header: 'Role',
        sortable: true,
        filterable: true,
    },
    {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (value: string) => (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}
            >
                {value}
            </span>
        ),
    },
    {
        key: 'lastLogin',
        header: 'Last Login',
        sortable: true,
    },
]

// Sample data for TreeView
const treeData: TreeNode[] = [
    {
        id: '1',
        label: 'Administration',
        children: [
            {
                id: '2',
                label: 'User Management',
                children: [
                    {
                        id: '3',
                        label: 'Users',
                    },
                    {
                        id: '4',
                        label: 'Roles',
                    },
                ],
            },
            {
                id: '5',
                label: 'System Settings',
                children: [
                    {
                        id: '6',
                        label: 'Configuration',
                    },
                    {
                        id: '7',
                        label: 'Security',
                    },
                ],
            },
        ],
    },
    {
        id: '8',
        label: 'Financial',
        children: [
            {
                id: '9',
                label: 'Transactions',
            },
            {
                id: '10',
                label: 'Reports',
            },
        ],
    },
]

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card shadow-sm border-b" role="banner">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-foreground">
                                Admin Panel
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <span className="text-sm text-muted-foreground">
                                Добро пожаловать, Администратор
                            </span>
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center" role="img" aria-label="Аватар администратора">
                                <span className="text-primary-foreground text-sm font-medium">A</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
                {/* Stats Grid */}
                <section aria-labelledby="stats-heading" className="mb-8">
                    <h2 id="stats-heading" className="sr-only">Статистика системы</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card role="region" aria-labelledby="users-stat">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle id="users-stat" className="text-sm font-medium">
                                    Пользователи
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1,234</div>
                                <p className="text-xs text-muted-foreground">
                                    +10% от прошлого месяца
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Транзакции
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">5,678</div>
                                <p className="text-xs text-muted-foreground">
                                    +15% от прошлого месяца
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Доходы
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">$12,345</div>
                                <p className="text-xs text-muted-foreground">
                                    +8% от прошлого месяца
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Системные события
                                </CardTitle>
                                <Settings className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">23</div>
                                <p className="text-xs text-muted-foreground">
                                    Требуют внимания
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation Tree */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Навигация</CardTitle>
                            <CardDescription>
                                Быстрый доступ к разделам
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TreeView
                                data={treeData}
                                onSelect={(node) => console.log('Selected:', node)}
                                defaultExpandAll={true}
                            />
                        </CardContent>
                    </Card>

                    {/* Users Table */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Пользователи</CardTitle>
                            <CardDescription>
                                Управление пользователями системы
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                data={users}
                                columns={columns}
                                onRowClick={(user) => {
                                    console.log('User clicked:', user)
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <Button variant="outline">
                        Экспорт данных
                    </Button>
                    <Button>
                        Создать пользователя
                    </Button>
                </div>
            </main>
        </div>
    )
}
