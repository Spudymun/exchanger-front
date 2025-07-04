import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
import { ChevronDown, Search, Filter } from 'lucide-react';
import React, { useCallback } from 'react';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Array<Column<T>>;
  searchable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

// Hook for data filtering
function useDataFiltering<T extends Record<string, unknown>>(data: T[]) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  return { searchTerm, setSearchTerm, filteredData };
}

// Hook for data sorting
function useDataSorting<T extends Record<string, unknown>>(data: T[]) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const sortKey = sortConfig.key;
      if (!sortKey) return 0;

      const aValue = (a as Record<string, unknown>)[String(sortKey)] ?? '';
      const bValue = (b as Record<string, unknown>)[String(sortKey)] ?? '';

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: keyof T) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return { sortConfig, sortedData, handleSort };
}

// Hook for data pagination
function useDataPagination<T>(data: T[], pageSize: number, pagination: boolean) {
  const [currentPage, setCurrentPage] = React.useState(1);

  const paginatedData = React.useMemo(() => {
    if (!pagination) return data;

    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(data.length / pageSize);

  return { currentPage, setCurrentPage, paginatedData, totalPages };
}

// Hook for data table state management
function useDataTableState<T extends Record<string, unknown>>(
  data: T[],
  pageSize: number,
  pagination: boolean
) {
  const { searchTerm, setSearchTerm, filteredData } = useDataFiltering(data);
  const { sortConfig, sortedData, handleSort } = useDataSorting(filteredData);
  const { currentPage, setCurrentPage, paginatedData, totalPages } = useDataPagination(
    sortedData,
    pageSize,
    pagination
  );

  return {
    searchTerm,
    setSearchTerm,
    sortConfig,
    currentPage,
    setCurrentPage,
    paginatedData,
    sortedData,
    totalPages,
    handleSort,
  };
}

// Loading skeleton component
function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {Array.from({ length: UI_NUMERIC_CONSTANTS.SKELETON_ROWS_COUNT }, (_, i) => (
          <div key={`skeleton-row-${i}`} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

// Render main table content
function renderDataTableContent<T extends Record<string, unknown>>({
  data,
  columns,
  sortConfig,
  onSort,
  onRowClick,
}: {
  data: T[];
  columns: Array<Column<T>>;
  sortConfig: { key: keyof T | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof T) => void;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <DataTableHeader columns={columns} sortConfig={sortConfig} onSort={onSort} />
        <DataTableBody data={data} columns={columns} onRowClick={onRowClick} />
      </Table>
    </div>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  filterable = true,
  pagination = true,
  pageSize = UI_NUMERIC_CONSTANTS.DEFAULT_PAGE_SIZE,
  loading = false,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const {
    searchTerm,
    setSearchTerm,
    sortConfig,
    currentPage,
    setCurrentPage,
    paginatedData,
    sortedData,
    totalPages,
    handleSort,
  } = useDataTableState(data, pageSize, pagination);

  if (loading) return <DataTableSkeleton />;

  return (
    <div className={`space-y-4 ${className}`}>
      <DataTableToolbar
        searchable={searchable}
        filterable={filterable}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        columns={columns}
      />

      {renderDataTableContent({
        data: paginatedData,
        columns,
        sortConfig,
        onSort: handleSort,
        onRowClick,
      })}

      <DataTablePagination
        pagination={pagination}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={sortedData.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

// Search and filters toolbar
interface DataTableToolbarProps<T> {
  searchable: boolean;
  filterable: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  columns: Array<Column<T>>;
}

function SearchInput({
  searchTerm,
  onSearchChange,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) {
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="pl-8"
      />
    </div>
  );
}

function FilterDropdown<T extends Record<string, unknown>>({
  columns,
}: {
  columns: Array<Column<T>>;
}) {
  return (
    <DropdownMenu>
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
          .filter(col => col.filterable)
          .map(col => (
            <DropdownMenuItem key={String(col.key)}>{col.header}</DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataTableToolbar<T extends Record<string, unknown>>({
  searchable,
  filterable,
  searchTerm,
  onSearchChange,
  columns,
}: DataTableToolbarProps<T>) {
  if (!searchable && !filterable) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {searchable ? (
          <SearchInput searchTerm={searchTerm} onSearchChange={onSearchChange} />
        ) : null}
        {filterable ? <FilterDropdown columns={columns} /> : null}
      </div>
    </div>
  );
}

// Table header component
interface DataTableHeaderProps<T> {
  columns: Array<Column<T>>;
  sortConfig: { key: keyof T | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof T) => void;
}

function DataTableHeader<T extends Record<string, unknown>>({
  columns,
  sortConfig,
  onSort,
}: DataTableHeaderProps<T>) {
  const createSortHandler = useCallback(
    (columnKey: keyof T, sortable?: boolean) => {
      return () => {
        if (sortable) {
          onSort(columnKey);
        }
      };
    },
    [onSort]
  );

  return (
    <TableHeader>
      <TableRow>
        {columns.map(column => (
          <TableHead
            key={String(column.key)}
            className={column.sortable ? 'cursor-pointer select-none' : ''}
            onClick={createSortHandler(column.key, column.sortable)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.header}</span>
              {column.sortable ? (
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    sortConfig.key === column.key
                      ? sortConfig.direction === 'desc'
                        ? 'rotate-180'
                        : ''
                      : 'opacity-50'
                  }`}
                />
              ) : null}
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

// Table body component
interface DataTableBodyProps<T> {
  data: T[];
  columns: Array<Column<T>>;
  onRowClick?: (row: T) => void;
}

function DataTableBody<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
}: DataTableBodyProps<T>) {
  const createRowClickHandler = useCallback(
    (row: T) => {
      return () => onRowClick?.(row);
    },
    [onRowClick]
  );

  if (data.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
            No results found.
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {data.map((row, index) => {
        // Generate a stable key using row content or index as fallback
        const rowKey =
          'id' in row && typeof row.id === 'string'
            ? row.id
            : `row-${index}-${JSON.stringify(row).slice(0, UI_NUMERIC_CONSTANTS.ROW_ID_TRUNCATE_LENGTH)}`;

        return (
          <TableRow
            key={rowKey}
            className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
            onClick={createRowClickHandler(row)}
          >
            {columns.map(column => (
              <TableCell key={String(column.key)}>
                {column.render
                  ? column.render(row[column.key], row)
                  : String(row[column.key] || '')}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </TableBody>
  );
}

// Pagination component
interface DataTablePaginationProps {
  pagination: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function DataTablePagination({
  pagination,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}: DataTablePaginationProps) {
  const handlePreviousPage = React.useCallback(() => {
    onPageChange(currentPage - 1);
  }, [onPageChange, currentPage]);

  const handleNextPage = React.useCallback(() => {
    onPageChange(currentPage + 1);
  }, [onPageChange, currentPage]);

  if (!pagination || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)}{' '}
        of {totalItems} entries
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
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
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
