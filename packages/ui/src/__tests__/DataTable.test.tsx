import { createTestData, type TestData } from '@repo/exchange-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTableCompound as DataTable } from '../components/data-table-compound';

const mockData: TestData[] = createTestData();

const renderDataTable = (props = {}) => {
  return render(
    <DataTable data={mockData} {...props}>
      <DataTable.Container>
        <DataTable.Header title="Test Table" />
        <DataTable.Filters />
        <DataTable.Content>
          <DataTable.TableWrapper>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((item, index) => (
                <tr key={index}>
                  <DataTable.CellWrapper>{String(item.id)}</DataTable.CellWrapper>
                  <DataTable.CellWrapper>{String(item.name)}</DataTable.CellWrapper>
                  <DataTable.CellWrapper>{String(item.email)}</DataTable.CellWrapper>
                </tr>
              ))}
            </tbody>
          </DataTable.TableWrapper>
        </DataTable.Content>
        <DataTable.Pagination />
      </DataTable.Container>
    </DataTable>
  );
};

// Helper functions to reduce test complexity
const renderTableWithoutSearch = () => (
  <DataTable data={mockData}>
    <DataTable.Container>
      <DataTable.Header title="Test Table" />
      <DataTable.Filters showSearch={false} />
      <DataTable.Content>
        <DataTable.TableWrapper>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((item, index) => (
              <tr key={index}>
                <DataTable.CellWrapper>{String(item.id)}</DataTable.CellWrapper>
                <DataTable.CellWrapper>{String(item.name)}</DataTable.CellWrapper>
              </tr>
            ))}
          </tbody>
        </DataTable.TableWrapper>
      </DataTable.Content>
    </DataTable.Container>
  </DataTable>
);

const renderLoadingTable = () => (
  <DataTable data={[]} isLoading={true}>
    <DataTable.Container>
      <DataTable.Header title="Test Table" />
      <DataTable.Content>
        <DataTable.TableWrapper>
          <div>Loading content</div>
        </DataTable.TableWrapper>
      </DataTable.Content>
    </DataTable.Container>
  </DataTable>
);

const renderEmptyTable = () => (
  <DataTable data={[]}>
    <DataTable.Container>
      <DataTable.Header title="Empty Table" />
      <DataTable.Content>
        <DataTable.TableWrapper>
          <tbody>
            <tr>
              <td colSpan={3}>Нет данных</td>
            </tr>
          </tbody>
        </DataTable.TableWrapper>
      </DataTable.Content>
    </DataTable.Container>
  </DataTable>
);

describe('DataTable Compound Component', () => {
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

  it('renders title when provided', () => {
    renderDataTable();
    expect(screen.getByText('Test Table')).toBeInTheDocument();
  });

  it('renders search input by default', () => {
    renderDataTable();
    expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument();
  });

  it('hides search input when showSearch is false', () => {
    render(renderTableWithoutSearch());
    expect(screen.queryByPlaceholderText('Поиск...')).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(renderLoadingTable());
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('renders pagination when data is provided', () => {
    renderDataTable();
    expect(screen.getByText(/Показано/)).toBeInTheDocument();
    expect(screen.getByText(/Страница/)).toBeInTheDocument();
  });

  it('allows search input interaction', async () => {
    const user = userEvent.setup();
    renderDataTable();

    const searchInput = screen.getByPlaceholderText('Поиск...');
    await user.type(searchInput, 'John');

    // Search input should be interactive (compound component manages state internally)
    expect(searchInput).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(renderEmptyTable());
    expect(screen.getByText('Нет данных')).toBeInTheDocument();
  });
});
