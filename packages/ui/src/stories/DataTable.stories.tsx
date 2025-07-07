import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DataTable, type Column } from '../components/data-table';

// Sample data
interface User extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const sampleData: User[] = [
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
    id: UI_NUMERIC_CONSTANTS.MOCK_DATA_ROWS,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
    lastLogin: '2024-01-10',
  },
  {
    id: UI_NUMERIC_CONSTANTS.GRID_COLUMNS_MEDIUM,
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'Moderator',
    status: 'active',
    lastLogin: '2024-01-16',
  },
  {
    id: UI_NUMERIC_CONSTANTS.GRID_COLUMNS_LARGE,
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    role: 'User',
    status: 'active',
    lastLogin: '2024-01-13',
  },
];

const columns: Array<Column<User>> = [
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
    render: (row: User) => (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    key: 'lastLogin',
    header: 'Last Login',
    sortable: true,
  },
];

const meta: Meta<typeof DataTable<User>> = {
  title: 'Components/DataTable',
  component: DataTable<User>,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: sampleData,
    columns: columns,
  },
};

export const WithoutSearch: Story = {
  args: {
    data: sampleData,
    columns: columns,
    searchable: false,
  },
};

export const WithoutFilters: Story = {
  args: {
    data: sampleData,
    columns: columns,
    _filterable: false,
  },
};

export const WithoutPagination: Story = {
  args: {
    data: sampleData,
    columns: columns,
    pagination: false,
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
    columns: columns,
    emptyMessage: 'No users found',
  },
};

export const WithClickHandler: Story = {
  args: {
    data: sampleData,
    columns: columns,
    onRowClick: (row: User) => {
      alert(`Clicked on ${row.name}`);
    },
  },
};
