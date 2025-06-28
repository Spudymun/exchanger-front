import { ChevronDown, Search, Filter } from 'lucide-react'
import React from 'react'

import { Button } from './ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table'

export interface Column<T> {
    key: keyof T
    header: string
    sortable?: boolean
    filterable?: boolean
    render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface DataTableProps<T> {
    data: T[]
    columns: Array<Column<T>>
    searchable?: boolean
    filterable?: boolean
    pagination?: boolean
    pageSize?: number
    loading?: boolean
    onRowClick?: (row: T) => void
    className?: string
}

export function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    searchable = true,
    filterable = true,
    pagination = true,
    pageSize = 10,
    loading = false,
    onRowClick,
    className,
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [sortConfig, setSortConfig] = React.useState<{
        key: keyof T | null
        direction: 'asc' | 'desc'
    }>({ key: null, direction: 'asc' })
    const [currentPage, setCurrentPage] = React.useState(1)

    // Filter data based on search term
    const filteredData = React.useMemo(() => {
        if (!searchTerm) return data

        return data.filter((row) =>
            Object.values(row).some((value) =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
    }, [data, searchTerm])

    // Sort data
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return filteredData

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key!]
            const bValue = b[sortConfig.key!]

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1
            }
            return 0
        })
    }, [filteredData, sortConfig])

    // Paginate data
    const paginatedData = React.useMemo(() => {
        if (!pagination) return sortedData

        const startIndex = (currentPage - 1) * pageSize
        return sortedData.slice(startIndex, startIndex + pageSize)
    }, [sortedData, currentPage, pageSize, pagination])

    const totalPages = Math.ceil(sortedData.length / pageSize)

    const handleSort = (key: keyof T) => {
        setSortConfig({
            key,
            direction:
                sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
        })
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search and Filters */}
            {(searchable || filterable) ? <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {searchable ? <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div> : null}
                    {filterable ? <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columns
                                .filter((col) => col.filterable)
                                .map((col) => (
                                    <DropdownMenuItem key={String(col.key)}>
                                        {col.header}
                                    </DropdownMenuItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu> : null}
                </div>
            </div> : null}

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead
                                    key={String(column.key)}
                                    className={column.sortable ? 'cursor-pointer select-none' : ''}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.header}</span>
                                        {column.sortable ? <ChevronDown
                                            className={`h-4 w-4 transition-transform ${sortConfig.key === column.key
                                                ? sortConfig.direction === 'desc'
                                                    ? 'rotate-180'
                                                    : ''
                                                : 'opacity-50'
                                                }`}
                                        /> : null}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((row, index) => (
                                <TableRow
                                    key={index}
                                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={String(column.key)}>
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : String(row[column.key] || '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 ? <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
                    {sortedData.length} entries
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div> : null}
        </div>
    )
}
