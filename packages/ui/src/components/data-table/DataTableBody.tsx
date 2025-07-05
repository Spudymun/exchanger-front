import React from 'react';

import { TableBody, TableCell, TableRow } from '../ui/table';

import type { Column } from './DataTableHeader';

interface DataTableBodyProps<T> {
  paginatedData: T[];
  columns: Array<Column<T>>;
  emptyMessage: string;
  onRowClick?: (item: T) => void;
}

export const DataTableBody = <T extends Record<string, unknown>>({
  paginatedData,
  columns,
  emptyMessage,
  onRowClick,
}: DataTableBodyProps<T>) => {
  return (
    <TableBody>
      {paginatedData.length === 0 ? (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            {emptyMessage}
          </TableCell>
        </TableRow>
      ) : (
        paginatedData.map((item, index) => (
          <TableRow key={index} onClick={() => onRowClick?.(item)} className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}>
            {columns.map((column) => (
              <TableCell key={String(column.key)}>
                {column.render ? column.render(item) : String(item[column.key])}
              </TableCell>
            ))}
          </TableRow>
        ))
      )}
    </TableBody>
  );
};
