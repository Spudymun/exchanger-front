'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  DataTable,
  DataTableNew,
  type Column,
  TreeView,
  type TreeNode,
  ThemeToggle,
  AdminPanel,
} from '@repo/ui';
import { createUITestUsers, type UITestUser } from '@repo/exchange-core';
import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
import { Users, CreditCard, TrendingUp, Settings } from 'lucide-react';

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
  users: UITestUser[];
  columns: Array<Column<UITestUser>>;
  onRowClick: (user: UITestUser) => void;
}

interface ActionButtonsProps {
  onExport: () => void;
  onCreateUser: () => void;
}

const MAGIC_NUMBER_THREE = UI_NUMERIC_CONSTANTS.MOCK_DATA_ROWS;

const ADMIN_USERS_DATA: UITestUser[] = createUITestUsers();

const ADMIN_COLUMNS: Array<Column<UITestUser>> = [
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
    render: (user: UITestUser) => {
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

function UsersTableNew({ users, columns, onRowClick }: UsersTableProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Пользователи</CardTitle>
        <CardDescription>Управление пользователями системы</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableNew data={users}>
          <DataTableNew.Container variant="bordered">
            <DataTableNew.Header title="Список пользователей" />
            <DataTableNew.Filters searchPlaceholder="Поиск пользователей..." />
            <DataTableNew.Content>
              <DataTableNew.TableWrapper>
                <thead className="[&_tr]:border-b">
                  <tr>
                    {columns.map(column => (
                      <th
                        key={String(column.key)}
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {users.map((user, index) => (
                    <tr
                      key={index}
                      onClick={() => onRowClick(user)}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                      {columns.map(column => (
                        <DataTableNew.CellWrapper key={String(column.key)}>
                          {column.render
                            ? column.render(user)
                            : String(user[column.key as keyof UITestUser])}
                        </DataTableNew.CellWrapper>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </DataTableNew.TableWrapper>
            </DataTableNew.Content>
            <DataTableNew.Pagination showInfo={true} />
          </DataTableNew.Container>
        </DataTableNew>
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
    // Navigation functionality будет реализована в следующих версиях
    console.info('Navigation selected:', node.label);
    // Здесь будет переход по разделам админ-панели
    void node;
  };

  const handleUserClick = (user: UITestUser) => {
    // User details functionality будет реализована в следующих версиях
    console.info('User details requested:', user.name);
    // Здесь будет открытие модального окна с деталями пользователя
    void user;
  };

  const handleExport = () => {
    // Export functionality будет реализована в следующих версиях
    console.info('Export requested');
    // Здесь будет экспорт данных в CSV/Excel формат
  };

  const handleCreateUser = () => {
    // Create user functionality будет реализована в следующих версиях
    console.info('Create user requested');
    // Здесь будет открытие формы создания нового пользователя
  };

  return (
    <AdminPanel
      currentUser={{ name: 'Администратор', email: 'admin@exchange.com', role: 'admin' }}
      notifications={3}
    >
      <AdminPanel.Layout variant="full">
        <AdminPanel.Header title="Admin Panel" showUserMenu={true} showNotifications={true}>
          <ThemeToggle />
        </AdminPanel.Header>

        <AdminPanel.Main variant="padded">
          <AdminPanel.StatsGrid columns={4}>
            <AdminPanel.StatsCard
              title="Пользователи"
              value="1,234"
              description="+10% от прошлого месяца"
              trend="up"
              icon={<Users className="h-4 w-4" />}
            />
            <AdminPanel.StatsCard
              title="Транзакции"
              value="5,678"
              description="+15% от прошлого месяца"
              trend="up"
              icon={<CreditCard className="h-4 w-4" />}
            />
            <AdminPanel.StatsCard
              title="Доходы"
              value="$12,345"
              description="+8% от прошлого месяца"
              trend="up"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <AdminPanel.StatsCard
              title="Системные события"
              value="23"
              description="Требуют внимания"
              trend="neutral"
              icon={<Settings className="h-4 w-4" />}
            />
          </AdminPanel.StatsGrid>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <NavigationTree data={ADMIN_TREE_DATA} onSelect={handleTreeSelect} />
            <UsersTableNew
              users={ADMIN_USERS_DATA}
              columns={ADMIN_COLUMNS}
              onRowClick={handleUserClick}
            />
          </div>

          <ActionButtons onExport={handleExport} onCreateUser={handleCreateUser} />
        </AdminPanel.Main>
      </AdminPanel.Layout>
    </AdminPanel>
  );
}
