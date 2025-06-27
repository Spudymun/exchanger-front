import type { Meta, StoryObj } from '@storybook/react'
import { DataTable, type Column } from '../components/data-table'

// Sample data
interface User {
    id: number
    name: string
    email: string
    role: string
    status: 'active' | 'inactive'
    lastLogin: string
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
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'User',
        status: 'inactive',
        lastLogin: '2024-01-10',
    },
    {
        id: 4,
        name: 'Alice Brown',
        email: 'alice@example.com',
        role: 'Moderator',
        status: 'active',
        lastLogin: '2024-01-16',
    },
    {
        id: 5,
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        role: 'User',
        status: 'active',
        lastLogin: '2024-01-13',
    },
]

const columns: Column<User>[] = [
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
        render: (value: string) => (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
            >
                {value}
            </span>
        ),
    },
    {
        key: 'lastLogin',
        header: 'Last Login',
        sortable: true,
    },
]

const meta: Meta<typeof DataTable<User>> = {
    title: 'Components/DataTable',
    component: DataTable,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: {
        data: sampleData,
        columns: columns,
    },
}

export const WithoutSearch: Story = {
    args: {
        data: sampleData,
        columns: columns,
        searchable: false,
    },
}

export const WithoutFilters: Story = {
    args: {
        data: sampleData,
        columns: columns,
        filterable: false,
    },
}

export const WithoutPagination: Story = {
    args: {
        data: sampleData,
        columns: columns,
        pagination: false,
    },
}

export const Loading: Story = {
    args: {
        data: sampleData,
        columns: columns,
        loading: true,
    },
}

export const WithClickHandler: Story = {
    args: {
        data: sampleData,
        columns: columns,
        onRowClick: (row: User) => {
            alert(`Clicked on ${row.name}`)
        },
    },
}
