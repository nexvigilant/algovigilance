'use client'

import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FilterBar } from './filter-bar'
import { ResultsTable } from './results-table'
import type { Tab } from '@/lib/regulatory/types'

interface DataPanelProps {
  tab: Tab
  data: Record<string, unknown>[]
  loading: boolean
  error: string | null
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onFilterChange: (filters: Record<string, unknown>) => void
  activeFilters: Record<string, unknown>
  onRowClick: (row: Record<string, unknown>) => void
  sortField: string
  sortDir: 'asc' | 'desc'
  onSort: (field: string) => void
}

export function DataPanel({
  tab,
  data,
  loading,
  error,
  total,
  page,
  pageSize,
  onPageChange,
  onFilterChange,
  activeFilters,
  onRowClick,
  sortField,
  sortDir,
  onSort,
}: DataPanelProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startRecord = total === 0 ? 0 : page * pageSize + 1
  const endRecord = Math.min((page + 1) * pageSize, total)

  return (
    <Card className="overflow-hidden">
      {/* Filter bar */}
      {tab.filters.length > 0 && (
        <div className="border-b border-border">
          <FilterBar
            filters={tab.filters}
            activeFilters={activeFilters}
            onChange={onFilterChange}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium">Failed to load data</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      )}

      {/* Table */}
      {!error && (
        <ResultsTable
          columns={tab.columns}
          data={data}
          loading={loading}
          onRowClick={onRowClick}
          sortField={sortField}
          sortDir={sortDir}
          onSort={onSort}
          badgeConfig={tab.badgeConfig}
        />
      )}

      {/* Pagination */}
      {!error && !loading && total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {startRecord}–{endRecord} of {total.toLocaleString()} results
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="min-w-[80px] text-center text-xs text-muted-foreground">
              Page {page + 1} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
