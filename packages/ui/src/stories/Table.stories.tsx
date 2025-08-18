import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

// Constants
const STATUS_ACTIVE = 'Активен';
const STATUS_INACTIVE = 'Неактивен';
const ACTIVE_STATUS_CLASS = 'text-success';
const INACTIVE_STATUS_CLASS = 'text-destructive';
const CURRENT_YEAR = 2024;
const JUNE_MONTH = 6;
const REGISTRATION_DAY = 15;
const LAST_LOGIN_DAY = 10;

const meta: Meta<typeof Table> = {
  title: 'UI/Components/Table',
  component: Table,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Компонент таблицы с адаптивным дизайном, поддержкой заголовка, футера, подписи и различных состояний ячеек.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  {
    id: 1,
    name: 'Иван Петров',
    email: 'ivan@example.com',
    role: 'Администратор',
    status: STATUS_ACTIVE,
  },
  {
    id: 2,
    name: 'Мария Сидорова',
    email: 'maria@example.com',
    role: 'Модератор',
    status: STATUS_ACTIVE,
  },
  {
    id: 3,
    name: 'Алексей Иванов',
    email: 'alex@example.com',
    role: 'Пользователь',
    status: STATUS_INACTIVE,
  },
  {
    id: 4,
    name: 'Елена Кузнецова',
    email: 'elena@example.com',
    role: 'Модератор',
    status: STATUS_ACTIVE,
  },
  {
    id: 5,
    name: 'Дмитрий Волков',
    email: 'dmitry@example.com',
    role: 'Пользователь',
    status: STATUS_ACTIVE,
  },
];

export const Basic: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Имя</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map(user => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{user.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>Список пользователей системы (всего: 5)</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">ID</TableHead>
          <TableHead>Имя</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Роль</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map(user => (
          <TableRow key={user.id}>
            <TableCell className="font-mono">{user.id}</TableCell>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithFooter: Story = {
  render: () => {
    const totalUsers = sampleData.length;
    const activeUsers = sampleData.filter(user => user.status === STATUS_ACTIVE).length;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Имя</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Роль</TableHead>
            <TableHead className="text-right">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map(user => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>{' '}
              <TableCell className="text-right">
                <span
                  className={
                    user.status === STATUS_ACTIVE ? ACTIVE_STATUS_CLASS : INACTIVE_STATUS_CLASS
                  }
                >
                  {user.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Итого</TableCell>
            <TableCell className="text-right">
              {activeUsers}/{totalUsers} активных
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  },
};

export const WithActions: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Имя</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead className="text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map(user => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <span
                className={
                  user.status === STATUS_ACTIVE ? ACTIVE_STATUS_CLASS : INACTIVE_STATUS_CLASS
                }
              >
                {user.status}
              </span>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="outline" size="sm">
                Изменить
              </Button>
              <Button variant="destructive" size="sm">
                Удалить
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <Table>
        <TableCaption>Таблица с большим количеством данных (адаптивная)</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-40">Полное имя</TableHead>
            <TableHead className="min-w-48">Email адрес</TableHead>
            <TableHead className="min-w-32">Роль в системе</TableHead>
            <TableHead className="min-w-28">Статус аккаунта</TableHead>
            <TableHead className="min-w-32">Дата регистрации</TableHead>
            <TableHead className="min-w-32">Последний вход</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((user, index) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <span
                  className={
                    user.status === STATUS_ACTIVE ? ACTIVE_STATUS_CLASS : INACTIVE_STATUS_CLASS
                  }
                >
                  {user.status}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(CURRENT_YEAR, index, REGISTRATION_DAY).toLocaleDateString('ru-RU')}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(CURRENT_YEAR, JUNE_MONTH, LAST_LOGIN_DAY - index).toLocaleDateString(
                  'ru-RU'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Имя</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
            Нет данных для отображения
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const Striped: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Имя</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map((user, index) => (
          <TableRow key={user.id} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <span
                className={
                  user.status === STATUS_ACTIVE ? ACTIVE_STATUS_CLASS : INACTIVE_STATUS_CLASS
                }
              >
                {user.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
