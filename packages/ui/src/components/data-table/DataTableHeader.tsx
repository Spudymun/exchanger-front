import { ChevronDown } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { TableHead, TableHeader, TableRow } from '../ui/table';

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableHeaderProps<T> {
  columns: Array<Column<T>>;
  _sortConfig: { key: keyof T; direction: 'asc' | 'desc' } | null;
  onSort: (key: keyof T) => void;
}

export const DataTableHeader = <T extends Record<string, unknown>>({
  columns,
  _sortConfig,
  onSort,
}: DataTableHeaderProps<T>) => {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead key={String(column.key)} className="text-left">
            {column.sortable ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent -ml-3 font-medium"
                  >
                    {column.header}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Сортировка</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onSort(column.key)}>
                    По возрастанию
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSort(column.key)}>
                    По убыванию
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="font-medium">{column.header}</span>
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
};
