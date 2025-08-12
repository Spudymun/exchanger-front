import { createUITestUsers, type UITestUser } from '@repo/exchange-core';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { type Column } from '../components/data-table';
import { DataTableCompound as DataTable } from '../components/data-table-compound';

// Constants for story configuration
const COMPACT_TABLE_ROWS = 5;
const COMPACT_TABLE_COLUMNS = 4;

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

const meta: Meta<typeof DataTable> = {
  title: 'Complex/DataTable',
  component: DataTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Compound DataTable component with flexible composition, search, sorting, and pagination.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      description: 'Array of data objects to display in the table',
      control: false,
    },
    isLoading: {
      description: 'Loading state for the table',
      control: 'boolean',
      defaultValue: false,
    },
    searchTerm: {
      description: 'Current search term',
      control: 'text',
    },
    currentPage: {
      description: 'Current page number',
      control: 'number',
      defaultValue: 1,
    },
    itemsPerPage: {
      description: 'Number of items per page',
      control: 'number',
      defaultValue: 10,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataTable data={sampleData}>
      <DataTable.Container>
        <DataTable.Header title="Users" description="Manage your team members" />
        <DataTable.Filters />
        <DataTable.Content>
          <DataTable.TableWrapper>
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={String(column.key)} className="text-left p-4 font-medium">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleData.map((item, index) => (
                <tr key={index} className="border-t">
                  {columns.map(column => (
                    <DataTable.CellWrapper key={String(column.key)}>
                      {column.render ? column.render(item) : String(item[column.key])}
                    </DataTable.CellWrapper>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable.TableWrapper>
        </DataTable.Content>
        <DataTable.Pagination />
      </DataTable.Container>
    </DataTable>
  ),
};

export const WithoutSearch: Story = {
  render: () => (
    <DataTable data={sampleData}>
      <DataTable.Container>
        <DataTable.Header title="Users" />
        <DataTable.Filters showSearch={false} />
        <DataTable.Content>
          <DataTable.TableWrapper>
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={String(column.key)} className="text-left p-4 font-medium">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleData.map((item, index) => (
                <tr key={index} className="border-t">
                  {columns.map(column => (
                    <DataTable.CellWrapper key={String(column.key)}>
                      {column.render ? column.render(item) : String(item[column.key])}
                    </DataTable.CellWrapper>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable.TableWrapper>
        </DataTable.Content>
        <DataTable.Pagination />
      </DataTable.Container>
    </DataTable>
  ),
};

export const Loading: Story = {
  render: () => (
    <DataTable data={[]} isLoading={true}>
      <DataTable.Container>
        <DataTable.Header title="Users" />
        <DataTable.Filters />
        <DataTable.Content>
          <DataTable.TableWrapper>
            <div>Loading...</div>
          </DataTable.TableWrapper>
        </DataTable.Content>
      </DataTable.Container>
    </DataTable>
  ),
};

export const WithoutPagination: Story = {
  render: () => (
    <DataTable data={sampleData}>
      <DataTable.Container>
        <DataTable.Header title="Users" />
        <DataTable.Filters />
        <DataTable.Content>
          <DataTable.TableWrapper>
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={String(column.key)} className="text-left p-4 font-medium">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleData.map((item, index) => (
                <tr key={index} className="border-t">
                  {columns.map(column => (
                    <DataTable.CellWrapper key={String(column.key)}>
                      {column.render ? column.render(item) : String(item[column.key])}
                    </DataTable.CellWrapper>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable.TableWrapper>
        </DataTable.Content>
        {/* No Pagination component */}
      </DataTable.Container>
    </DataTable>
  ),
};

export const Compact: Story = {
  render: () => (
    <DataTable data={sampleData.slice(0, COMPACT_TABLE_ROWS)}>
      <DataTable.Container variant="compact">
        <DataTable.Header title="Compact Table" />
        <DataTable.Content>
          <DataTable.TableWrapper>
            <thead>
              <tr>
                {columns.slice(0, COMPACT_TABLE_COLUMNS).map(column => (
                  <th key={String(column.key)} className="text-left p-2 font-medium text-sm">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleData.slice(0, COMPACT_TABLE_ROWS).map((item, index) => (
                <tr key={index} className="border-t">
                  {columns.slice(0, COMPACT_TABLE_COLUMNS).map(column => (
                    <DataTable.CellWrapper key={String(column.key)} className="p-2 text-sm">
                      {column.render ? column.render(item) : String(item[column.key])}
                    </DataTable.CellWrapper>
                  ))}
                </tr>
              ))}
            </tbody>
          </DataTable.TableWrapper>
        </DataTable.Content>
      </DataTable.Container>
    </DataTable>
  ),
};
