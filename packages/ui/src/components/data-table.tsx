"use client";

import React, { useState, useMemo } from 'react';

import { DataTableBody } from './data-table/DataTableBody';
import { DataTableFilters } from './data-table/DataTableFilters';
import { DataTableHeader, type Column } from './data-table/DataTableHeader';
import { DataTablePagination } from './data-table/DataTablePagination';
import { Table } from './ui/table';

export interface DataTableProps<T> {
  data: T[];
  columns: Array<Column<T>>;
  searchable?: boolean;
  sortable?: boolean;
  _filterable?: boolean;
  pagination?: boolean;
  initialItemsPerPage?: number;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

// Хуки для управления состоянием таблицы
const useTableState = <T extends Record<string, unknown>>(initialItemsPerPage: number) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [showFilters, setShowFilters] = useState(false);

  return {
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfig,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    showFilters,
    setShowFilters,
  };
};

// Функция для фильтрации данных
const useFilteredData = <T extends Record<string, unknown>>(
  data: T[],
  searchTerm: string,
  columns: Array<Column<T>>
) => {
  return useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((item) =>
      columns.some((column) => {
        const value = item[column.key];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);
};

// Функция для сортировки данных
const useSortedData = <T extends Record<string, unknown>>(
  filteredData: T[],
  sortConfig: { key: keyof T; direction: 'asc' | 'desc' } | null
) => {
  return useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);
};

// Функция для пагинации данных
const usePaginatedData = <T extends Record<string, unknown>>(
  sortedData: T[],
  currentPage: number,
  itemsPerPage: number,
  pagination: boolean
) => {
  return useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage, pagination]);
};

// Логика для определения нового состояния сортировки
const getNextSortConfig = <T extends Record<string, unknown>>(
  key: keyof T,
  current: { key: keyof T; direction: 'asc' | 'desc' } | null
): { key: keyof T; direction: 'asc' | 'desc' } | null => {
  if (current?.key === key) {
    return current.direction === 'asc' 
      ? { key, direction: 'desc' }
      : null;
  }
  return { key, direction: 'asc' };
};

// Функция для создания обработчиков
const createHandlers = <T extends Record<string, unknown>>(params: {
  sortable: boolean;
  setSortConfig: React.Dispatch<React.SetStateAction<{ key: keyof T; direction: 'asc' | 'desc' } | null>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}) => {
  const { sortable, setSortConfig, setCurrentPage, setItemsPerPage, totalPages } = params;

  const handleSort = (key: keyof T) => {
    if (!sortable) return;

    setSortConfig((current) => getNextSortConfig(key, current));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return {
    handleSort,
    handlePageChange,
    handleItemsPerPageChange,
  };
};

// Компонент для рендеринга фильтров
const renderFilters = (params: {
  searchable: boolean;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { searchable, searchTerm, setSearchTerm, showFilters, setShowFilters } = params;

  if (!searchable) return null;

  return (
    <DataTableFilters
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
    />
  );
};

// Компонент для рендеринга пагинации
const renderPagination = (params: {
  pagination: boolean;
  sortedDataLength: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  handlePageChange: (page: number) => void;
  handleItemsPerPageChange: (newItemsPerPage: number) => void;
}) => {
  const {
    pagination,
    sortedDataLength,
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
  } = params;

  if (!pagination || sortedDataLength === 0) return null;

  return (
    <DataTablePagination
      currentPage={currentPage}
      totalPages={totalPages}
      itemsPerPage={itemsPerPage}
      totalItems={sortedDataLength}
      onPageChange={handlePageChange}
      onItemsPerPageChange={handleItemsPerPageChange}
    />
  );
};

export const DataTable = <T extends Record<string, unknown>>({
  data,
  columns,
  searchable = true,
  sortable = true,
  _filterable = false,
  pagination = true,
  initialItemsPerPage = 10,
  className = '',
  emptyMessage = 'Нет данных для отображения',
  onRowClick,
}: DataTableProps<T>) => {
  const {
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfig,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    showFilters,
    setShowFilters,
  } = useTableState<T>(initialItemsPerPage);

  const filteredData = useFilteredData(data, searchTerm, columns);
  const sortedData = useSortedData(filteredData, sortConfig);
  const paginatedData = usePaginatedData(sortedData, currentPage, itemsPerPage, pagination);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const { handleSort, handlePageChange, handleItemsPerPageChange } = createHandlers<T>({
    sortable,
    setSortConfig,
    setCurrentPage,
    setItemsPerPage,
    totalPages,
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {renderFilters({ searchable, searchTerm, setSearchTerm, showFilters, setShowFilters })}

      <div className="rounded-md border">
        <Table>
          <DataTableHeader<T>
            columns={columns}
            _sortConfig={sortConfig}
            onSort={handleSort}
          />
          <DataTableBody<T>
            paginatedData={paginatedData}
            columns={columns}
            emptyMessage={emptyMessage}
            onRowClick={onRowClick}
          />
        </Table>
      </div>

      {renderPagination({
        pagination,
        sortedDataLength: sortedData.length,
        currentPage,
        totalPages,
        itemsPerPage,
        handlePageChange,
        handleItemsPerPageChange,
      })}
    </div>
  );
};

export type { Column } from './data-table/DataTableHeader';
