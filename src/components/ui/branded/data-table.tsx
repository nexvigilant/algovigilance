'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/layout/boundaries/empty-state';
import type { EmptyStateContext } from '@/components/layout/boundaries/constants';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  emptyContext?: EmptyStateContext;
  onRowClick?: (item: T) => void;
  className?: string;
  rowClassName?: string | ((item: T) => string);
  ariaLabel?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading,
  emptyMessage = 'No data found',
  emptyContext,
  onRowClick,
  className,
  rowClassName,
  ariaLabel
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        context={emptyContext}
        title={emptyContext ? undefined : emptyMessage}
        variant="card"
        size="sm"
      />
    );
  }

  return (
    <div className={cn("rounded-md border border-nex-light bg-nex-surface", className)}>
      <Table aria-label={ariaLabel}>
        <TableHeader>
          <TableRow>
            {columns.map((column, idx) => (
              <TableHead key={idx} className={column.headClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, rowIdx) => (
            <TableRow
              key={rowIdx}
              onClick={() => onRowClick?.(item)}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-muted/50",
                typeof rowClassName === 'function' ? rowClassName(item) : rowClassName
              )}
            >
              {columns.map((column, colIdx) => (
                <TableCell key={colIdx} className={column.className}>
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : (item[column.accessor] as React.ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
