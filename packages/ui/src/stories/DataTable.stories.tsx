import { createUITestUsers, type UITestUser } from '@repo/exchange-core';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DataTable, type Column } from '../components/data-table';

// Sample data из централизованной фабрики
const sampleData: UITestUser[] = createUITestUsers();

// Status badge render function - вынесено из inline JSX
const renderStatusBadge = (row: UITestUser) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      row.status === 'active'
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }`}
  >
    {row.status}
  </span>
);

const columns: Array<Column<UITestUser>> = [
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
    render: renderStatusBadge,
  },
  {
    key: 'lastLogin',
    header: 'Last Login',
    sortable: true,
  },
];

const meta: Meta<typeof DataTable<UITestUser>> = {
  title: 'Complex/DataTable',
  component: DataTable<UITestUser>,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive data table component with sorting, filtering, search, and pagination capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: 'Array of data objects to display in the table',
      control: false,
    },
    columns: {
      description: 'Array of column configurations defining table structure',
      control: false,
    },
    searchable: {
      description: 'Enable/disable global search functionality',
      control: 'boolean',
      defaultValue: true,
    },
    pagination: {
      description: 'Enable/disable pagination controls',
      control: 'boolean',
      defaultValue: true,
    },
    onRowClick: {
      description: 'Callback function when a table row is clicked',
      action: 'row-clicked',
    },
  },
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

export const Loading: Story = {
  args: {
    data: [],
    columns: columns,
    emptyMessage: 'Loading data...',
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
    onRowClick: (row: UITestUser) => {
      alert(`Clicked on ${row.name}`);
    },
  },
};
