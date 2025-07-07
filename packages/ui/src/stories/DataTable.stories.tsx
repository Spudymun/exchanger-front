import { createUITestUsers, type UITestUser } from '@repo/exchange-core';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DataTable, type Column } from '../components/data-table';

// Sample data из централизованной фабрики
const sampleData: UITestUser[] = createUITestUsers();

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
    render: (row: UITestUser) => (
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

const meta: Meta<typeof DataTable<UITestUser>> = {
  title: 'Components/DataTable',
  component: DataTable<UITestUser>,
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
    onRowClick: (row: UITestUser) => {
      alert(`Clicked on ${row.name}`);
    },
  },
};
