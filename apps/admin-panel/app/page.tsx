'use client';

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
  ThemeToggle,
} from '@repo/ui';
import { Users, CreditCard, TrendingUp, Settings } from 'lucide-react';

// Sample data for DataTable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface User extends Record<string, any> {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

interface AdminHeaderProps {
  userName?: string;
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavigationTreeProps {
  data: TreeNode[];
  onSelect: (node: TreeNode) => void;
}

interface UsersTableProps {
  users: User[];
  columns: Array<Column<User>>;
  onRowClick: (user: User) => void;
}

interface ActionButtonsProps {
  onExport: () => void;
  onCreateUser: () => void;
}

const MAGIC_NUMBER_THREE = 3;

const ADMIN_USERS_DATA: User[] = [
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
    id: MAGIC_NUMBER_THREE,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
    lastLogin: '2024-01-10',
  },
];

const ADMIN_COLUMNS: Array<Column<User>> = [
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
    render: (user: User) => {
      const status = user.status;
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    key: 'lastLogin',
    header: 'Last Login',
    sortable: true,
  },
];

// Sample data for TreeView
const ADMIN_TREE_DATA: TreeNode[] = [
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
];

function AdminHeader({ userName = 'Администратор' }: AdminHeaderProps) {
  return (
    <header className="bg-card shadow-sm border-b" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <AdminHeaderTitle />
          <AdminHeaderActions userName={userName} />
        </div>
      </div>
    </header>
  );
}

function AdminHeaderTitle() {
  return (
    <div className="flex items-center">
      <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
    </div>
  );
}

function AdminHeaderActions({ userName }: { userName: string }) {
  return (
    <div className="flex items-center space-x-4">
      <ThemeToggle />
      <span className="text-sm text-muted-foreground">Добро пожаловать, {userName}</span>
      <AdminAvatar />
    </div>
  );
}

function AdminAvatar() {
  return (
    <div
      className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
      role="img"
      aria-label="Аватар администратора"
    >
      <span className="text-primary-foreground text-sm font-medium">A</span>
    </div>
  );
}

function StatsCard({ title, value, description, icon: Icon }: StatsCardProps) {
  return (
    <Card role="region" aria-labelledby={`${title.toLowerCase()}-stat`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle id={`${title.toLowerCase()}-stat`} className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatsGrid() {
  const statsData = [
    {
      title: 'Пользователи',
      value: '1,234',
      description: '+10% от прошлого месяца',
      icon: Users,
    },
    {
      title: 'Транзакции',
      value: '5,678',
      description: '+15% от прошлого месяца',
      icon: CreditCard,
    },
    {
      title: 'Доходы',
      value: '$12,345',
      description: '+8% от прошлого месяца',
      icon: TrendingUp,
    },
    {
      title: 'Системные события',
      value: '23',
      description: 'Требуют внимания',
      icon: Settings,
    },
  ];

  return (
    <section aria-labelledby="stats-heading" className="mb-8">
      <h2 id="stats-heading" className="sr-only">
        Статистика системы
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsData.map(stat => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>
    </section>
  );
}

function NavigationTree({ data, onSelect }: NavigationTreeProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Навигация</CardTitle>
        <CardDescription>Быстрый доступ к разделам</CardDescription>
      </CardHeader>
      <CardContent>
        <TreeView data={data} onSelect={onSelect} defaultExpanded={data.map(item => item.id)} />
      </CardContent>
    </Card>
  );
}

function UsersTable({ users, columns, onRowClick }: UsersTableProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Пользователи</CardTitle>
        <CardDescription>Управление пользователями системы</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable data={users} columns={columns} onRowClick={onRowClick} />
      </CardContent>
    </Card>
  );
}

function ActionButtons({ onExport, onCreateUser }: ActionButtonsProps) {
  return (
    <div className="flex justify-end space-x-4 mt-8">
      <Button variant="outline" onClick={onExport}>
        Экспорт данных
      </Button>
      <Button onClick={onCreateUser}>Создать пользователя</Button>
    </div>
  );
}

export default function AdminDashboard() {
  const handleTreeSelect = (node: TreeNode) => {
    // TODO: Implement navigation functionality
    void node;
  };

  const handleUserClick = (user: User) => {
    // TODO: Implement user details functionality
    void user;
  };

  const handleExport = () => {
    // TODO: Implement export functionality
  };

  const handleCreateUser = () => {
    // TODO: Implement create user functionality
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        <StatsGrid />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <NavigationTree data={ADMIN_TREE_DATA} onSelect={handleTreeSelect} />
          <UsersTable
            users={ADMIN_USERS_DATA}
            columns={ADMIN_COLUMNS}
            onRowClick={handleUserClick}
          />
        </div>

        <ActionButtons onExport={handleExport} onCreateUser={handleCreateUser} />
      </main>
    </div>
  );
}
