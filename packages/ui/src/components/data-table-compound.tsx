'use client';

import * as React from 'react';

import { createEnhancementFunction } from '../lib/form-enhancement';
import { cn } from '../lib/utils';

import { BaseErrorBoundary } from './error-boundaries';
import { Button } from './ui/button'; // ✅ ДОБАВЛЕНО: импорт централизованного Button

// ===== DATA TABLE COMPOUND COMPONENTS ARCHITECTURE v2.0 =====
// Unified table composition system extending ExchangeForm pattern
// Migrating from Custom Hooks (7.5/10) to Compound Components (9.5/10)

// DataTable Context
export interface DataTableContextValue<T = Record<string, unknown>> {
  data?: T[];
  searchTerm?: string;
  sortConfig?: { key: keyof T; direction: 'asc' | 'desc' } | null;
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number; // ✅ ДОБАВЛЕНО: поддержка external total для server-side pagination
  isLoading?: boolean;
  onSearch?: (term: string) => void;
  onSort?: (key: keyof T) => void;
  onPageChange?: (page: number) => void;
  
  // ✅ Index signature для совместимости с BaseContextValue
  [key: string]: unknown;
}

const DataTableContext = React.createContext<DataTableContextValue | undefined>(undefined);

export const useDataTableContext = <T = Record<string, unknown>,>() => {
  return React.useContext(DataTableContext) as DataTableContextValue<T> | undefined;
};

// ===== ROOT COMPONENT =====
export interface DataTableProps<T = Record<string, unknown>>
  extends React.HTMLAttributes<HTMLDivElement> {
  data?: T[];
  isLoading?: boolean;
  searchTerm?: string;
  sortConfig?: { key: keyof T; direction: 'asc' | 'desc' } | null;
  currentPage?: number;
  itemsPerPage?: number;
  totalItems?: number; // ✅ ДОБАВЛЕНО: поддержка external total для server-side pagination
  onSearch?: (term: string) => void;
  onSort?: (key: keyof T) => void;
  onPageChange?: (page: number) => void;
  children: React.ReactNode;
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  (
    {
      className,
      children,
      data = [],
      isLoading,
      searchTerm,
      sortConfig,
      currentPage = 1,
      itemsPerPage = 10,
      totalItems, // ✅ ДОБАВЛЕНО: получаем totalItems из пропсов
      onSearch,
      onSort,
      onPageChange,
      ...props
    },
    ref
  ) => {
    const contextValue: DataTableContextValue = React.useMemo(
      () => ({
        data,
        searchTerm,
        sortConfig,
        currentPage,
        itemsPerPage,
        totalItems, // ✅ ДОБАВЛЕНО: передаем в контекст
        isLoading,
        onSearch,
        onSort,
        onPageChange,
      }),
      [
        data,
        searchTerm,
        sortConfig,
        currentPage,
        itemsPerPage,
        totalItems, // ✅ ДОБАВЛЕНО: в dependencies
        isLoading,
        onSearch,
        onSort,
        onPageChange,
      ]
    );

    return (
      <BaseErrorBoundary componentName="DataTable">
        <DataTableContext.Provider value={contextValue}>
          <div ref={ref} className={cn('w-full space-y-4', className)} {...props}>
            {children}
          </div>
        </DataTableContext.Provider>
      </BaseErrorBoundary>
    );
  }
);

DataTable.displayName = 'DataTable';

// ===== CONTAINER COMPONENT =====
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'compact';
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const getVariantClass = (v: 'default' | 'bordered' | 'elevated' | 'compact') => {
      switch (v) {
        case 'default':
          return 'bg-card text-card-foreground rounded-lg';
        case 'bordered':
          return 'bg-card text-card-foreground border border-border rounded-lg shadow-sm';
        case 'elevated':
          return 'bg-card text-card-foreground border border-border rounded-lg shadow-md';
        case 'compact':
          return 'bg-card text-card-foreground border border-border rounded-md';
        default:
          return 'bg-card text-card-foreground rounded-lg';
      }
    };

    return (
      <div ref={ref} className={cn(getVariantClass(variant), className)} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = 'DataTable.Container';

// ===== HEADER SECTION =====
export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6 pb-4', className)} {...props}>
        {title && <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {children}
      </div>
    );
  }
);

Header.displayName = 'DataTable.Header';

// ===== FILTERS SECTION =====
export interface FiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  searchPlaceholder?: string;
  showSearch?: boolean;
  children?: React.ReactNode;
}

const Filters = React.forwardRef<HTMLDivElement, FiltersProps>(
  ({ className, searchPlaceholder = 'Поиск...', showSearch = true, children, ...props }, ref) => {
    const context = useDataTableContext();

    return (
      <div
        ref={ref}
        className={cn('flex flex-col sm:flex-row gap-4 p-6 pt-0', className)}
        {...props}
      >
        {showSearch && (
          <div className="flex-1">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={context?.searchTerm ?? ''}
              onChange={e => context?.onSearch?.(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        )}
        {children}
      </div>
    );
  }
);

Filters.displayName = 'DataTable.Filters';

// ===== TABLE CONTENT =====
export interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative overflow-x-auto px-6', className)} {...props}>
        {children}
      </div>
    );
  }
);

Content.displayName = 'DataTable.Content';

// ===== TABLE WRAPPER =====
export interface TableWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const TableWrapper = React.forwardRef<HTMLDivElement, TableWrapperProps>(
  ({ className, children, ...props }, ref) => {
    const context = useDataTableContext();

    if (context?.isLoading) {
      return (
        <div
          ref={ref}
          className={cn('flex items-center justify-center py-8', className)}
          {...props}
        >
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('relative w-full overflow-auto', className)} {...props}>
        <table className="w-full caption-bottom text-sm">{children}</table>
      </div>
    );
  }
);

TableWrapper.displayName = 'DataTable.TableWrapper';

// ===== PAGINATION SECTION =====
const DEFAULT_ITEMS_PER_PAGE = 10;

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  showInfo?: boolean;
}

// Helper function for pagination calculations
const usePaginationData = (context: DataTableContextValue | undefined) => {
  // ✅ ПРИОРИТЕТ: external totalItems (для server-side pagination), fallback на data.length (для client-side)
  const totalItems = context?.totalItems ?? context?.data?.length ?? 0;
  const currentPage = context?.currentPage ?? 1;
  const itemsPerPage = context?.itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return { totalItems, currentPage, totalPages, startItem, endItem };
};

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ className, showInfo = true, ...props }, ref) => {
    const context = useDataTableContext();
    const { totalItems, currentPage, totalPages, startItem, endItem } = usePaginationData(context);

    if (totalItems === 0) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 p-6 pt-4',
          className
        )}
        {...props}
      >
        {showInfo && (
          <div className="text-sm text-muted-foreground">
            Показано {startItem} - {endItem} из {totalItems}
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* ✅ ИСПРАВЛЕНО: Использование централизованного Button компонента */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => context?.onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            ←
          </Button>

          <div className="text-sm font-medium">
            Страница {currentPage} из {totalPages}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => context?.onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            →
          </Button>
        </div>
      </div>
    );
  }
);

Pagination.displayName = 'DataTable.Pagination';

// ===== ENHANCED CELL COMPONENTS =====
// Using the same enhancement pattern as ExchangeForm

// ✅ PHASE 1: Заменяем duplicate enhanceChildWithContext на унифицированную систему
const enhanceChildWithContext = createEnhancementFunction('data-table');

// ===== CELL WRAPPER =====
export interface CellWrapperProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

const CellWrapper = React.forwardRef<HTMLTableCellElement, CellWrapperProps>(
  ({ className, children, ...props }, ref) => {
    const context = useDataTableContext();

    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildWithContext(child, context)
    );

    return (
      <td ref={ref} className={cn('p-4 align-middle', className)} {...props}>
        {enhancedChildren}
      </td>
    );
  }
);

CellWrapper.displayName = 'DataTable.CellWrapper';

// ===== COMPOUND COMPONENT EXPORT =====
export const DataTableCompound = Object.assign(DataTable, {
  Container,
  Header,
  Filters,
  Content,
  TableWrapper,
  Pagination,
  CellWrapper,
});

// ===== INDIVIDUAL EXPORTS =====
export {
  DataTable as Root,
  Container,
  Header,
  Filters,
  Content,
  TableWrapper,
  Pagination,
  CellWrapper,
};

// Default export as compound component
export default DataTableCompound;
