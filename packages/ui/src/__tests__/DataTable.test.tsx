import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable, type Column } from '../components/data-table'

interface TestData {
    id: number
    name: string
    email: string
}

const mockData: TestData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
]

const mockColumns: Column<TestData>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true, filterable: true },
    { key: 'email', header: 'Email', sortable: true, filterable: true },
]

describe('DataTable', () => {
    it('renders table with data', () => {
        render(<DataTable data={mockData} columns={mockColumns} />)

        // Check headers
        expect(screen.getByText('ID')).toBeInTheDocument()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()

        // Check data
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })

    it('shows search input when searchable is true', () => {
        render(<DataTable data={mockData} columns={mockColumns} searchable={true} />)
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('hides search input when searchable is false', () => {
        render(<DataTable data={mockData} columns={mockColumns} searchable={false} />)
        expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    })

    it('filters data based on search term', async () => {
        const user = userEvent.setup()
        render(<DataTable data={mockData} columns={mockColumns} searchable={true} />)

        const searchInput = screen.getByPlaceholderText('Search...')
        await user.type(searchInput, 'John')

        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    })

    it('handles row click events', async () => {
        const handleRowClick = jest.fn()
        const user = userEvent.setup()

        render(
            <DataTable
                data={mockData}
                columns={mockColumns}
                onRowClick={handleRowClick}
            />
        )

        const firstRow = screen.getByText('John Doe').closest('tr')
        if (firstRow) {
            await user.click(firstRow)
            expect(handleRowClick).toHaveBeenCalledWith(mockData[0])
        }
    })

    it('shows loading state', () => {
        render(<DataTable data={mockData} columns={mockColumns} loading={true} />)

        // Should show loading skeleton instead of data
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()

        // Check for loading elements (animate-pulse class)
        const loadingElements = document.querySelectorAll('.animate-pulse')
        expect(loadingElements.length).toBeGreaterThan(0)
    })

    it('shows empty state when no data', () => {
        render(<DataTable data={[]} columns={mockColumns} />)
        expect(screen.getByText('No results found.')).toBeInTheDocument()
    })

    it('sorts data when clicking sortable headers', async () => {
        const user = userEvent.setup()
        render(<DataTable data={mockData} columns={mockColumns} />)

        const nameHeader = screen.getByText('Name')
        await user.click(nameHeader)

        // After sorting, Bob should come first (alphabetically)
        const rows = screen.getAllByRole('row')
        const firstDataRow = rows[1] // Skip header row
        expect(firstDataRow).toHaveTextContent('Bob Johnson')
    })
})
