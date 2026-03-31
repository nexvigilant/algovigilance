'use client';

/**
 * DataTableWithFilters - Pre-built composition for data tables
 *
 * Includes:
 * - Search functionality
 * - Column filtering
 * - Sorting
 * - Pagination
 * - Loading states
 * - Empty states
 * - Responsive design
 *
 * @example
 * ```tsx
 * <DataTableWithFilters
 *   data={posts}
 *   columns={[
 *     { key: 'title', header: 'Title', sortable: true },
 *     { key: 'author', header: 'Author', filterable: true },
 *     { key: 'createdAt', header: 'Date', render: (date) => formatDate(date) }
 *   ]}
 *   searchPlaceholder="Search posts..."
 *   onRowClick={(post) => router.push(`/posts/${post.id}`)}
 * />
 * ```
 */

import { useState, useMemo } from 'react';
import { EmptyState } from '@/components/layout/boundaries/empty-state';
import type { EmptyStateContext } from '@/components/layout/boundaries/constants';

// ============================================================================
// Types
// ============================================================================

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  itemsPerPage?: number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyContext?: EmptyStateContext;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function DataTableWithFilters<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKeys,
  itemsPerPage = 10,
  onRowClick,
  loading = false,
  emptyMessage = 'No data found',
  emptyContext,
  className = '',
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery && searchKeys) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((key) =>
          String(row[key] ?? '').toLowerCase().includes(query)
        )
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) =>
          String((row as any)[key] ?? '').toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, searchKeys, filters, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`border rounded-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          context={emptyContext}
          title={emptyContext ? undefined : 'No Data'}
          description={emptyContext ? undefined : emptyMessage}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      {searchKeys && (
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {columns.some((col) => col.filterable) && (
        <div className="flex gap-4 flex-wrap">
          {columns
            .filter((col) => col.filterable)
            .map((col) => (
              <div key={String(col.key)} className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={filters[String(col.key)] || ''}
                  onChange={(e) => handleFilter(String(col.key), e.target.value)}
                  placeholder={`Filter ${col.header}...`}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 ${
                      col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`${
                    onRowClick
                      ? 'cursor-pointer hover:bg-gray-50'
                      : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3 text-sm text-gray-900"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, processedData.length)} of{' '}
            {processedData.length} results
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
              )
              .map((page, idx, arr) => (
                <span key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-2 py-1 text-sm text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-lg text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results info when filtered */}
      {(searchQuery || Object.keys(filters).length > 0) &&
        processedData.length === 0 && (
          <EmptyState
            context="search-results"
            variant="inline"
            size="sm"
          />
        )}
    </div>
  );
}

// Named exports preferred for tree-shaking
