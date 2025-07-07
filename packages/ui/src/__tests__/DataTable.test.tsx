import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTable, type Column } from '../components/data-table';

interface TestData extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
}

const mockData: TestData[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: UI_NUMERIC_CONSTANTS.MOCK_DATA_ROWS, name: 'Bob Johnson', email: 'bob@example.com' },
];

const mockColumns: Array<Column<TestData>> = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'email', header: 'Email', sortable: true, filterable: true },
];

const renderDataTable = (props = {}) => {
  return render(<DataTable data={mockData} columns={mockColumns} {...props} />);
};

describe('DataTable - Basic Rendering', () => {
  it('renders table with data', () => {
    renderDataTable();

    // Check headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<DataTable data={[]} columns={mockColumns} />);
    expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument();
  });
});

describe('DataTable - Search Functionality', () => {
  it('shows search input when searchable is true', () => {
    renderDataTable({ searchable: true });
    expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument();
  });

  it('hides search input when searchable is false', () => {
    renderDataTable({ searchable: false });
    expect(screen.queryByPlaceholderText('Поиск...')).not.toBeInTheDocument();
  });

  it('filters data based on search term', async () => {
    const user = userEvent.setup();
    renderDataTable({ searchable: true });

    const searchInput = screen.getByPlaceholderText('Поиск...');
    await user.type(searchInput, 'John');

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});

describe('DataTable - Interactions', () => {
  it('handles row click events', async () => {
    const handleRowClick = jest.fn();
    const user = userEvent.setup();

    renderDataTable({ onRowClick: handleRowClick });

    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      await user.click(firstRow);
      expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('sorts data when clicking sortable headers', async () => {
    const user = userEvent.setup();
    render(<DataTable data={mockData} columns={mockColumns} />);

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    // Select ascending sort option from dropdown
    const ascendingOption = screen.getByText('По возрастанию');
    await user.click(ascendingOption);

    // After sorting, Bob should come first (alphabetically)
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]; // Skip header row
    expect(firstDataRow).toHaveTextContent('Bob Johnson');
  });
});
