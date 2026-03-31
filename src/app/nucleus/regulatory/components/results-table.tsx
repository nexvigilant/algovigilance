'use client'

import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ColumnDef, BadgeConfig } from '@/lib/regulatory/types'

interface ResultsTableProps {
  columns: ColumnDef[]
  data: Record<string, unknown>[]
  loading: boolean
  onRowClick: (row: Record<string, unknown>) => void
  sortField: string
  sortDir: 'asc' | 'desc'
  onSort: (field: string) => void
  /** Tab-level badge config — used for all badge-type columns */
  badgeConfig?: BadgeConfig
}

/** Parse YYYYMMDD or ISO strings → readable date. */
function formatDate(value: unknown): string {
  if (typeof value !== 'string' || value === '') return '—'
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  }
  const d = new Date(value)
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Safe nested field accessor supporting dot notation (e.g. "openfda.brand_name"). */
function getFieldValue(row: Record<string, unknown>, field: string): unknown {
  const parts = field.split('.')
  let current: unknown = row
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function renderBadge(
  value: unknown,
  fieldName: string,
  badgeConfig?: BadgeConfig,
): React.ReactNode {
  const strVal = String(value ?? '')
  if (!strVal) return <span className="text-muted-foreground">—</span>

  // Apply variant mapping when this column's field matches the badgeConfig field
  if (badgeConfig && badgeConfig.field === fieldName) {
    const mapping = badgeConfig.variants[strVal]
    return (
      <Badge variant={mapping?.variant ?? 'secondary'} className="whitespace-nowrap text-xs">
        {mapping?.label ?? strVal}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="whitespace-nowrap text-xs">
      {strVal}
    </Badge>
  )
}

function renderCell(
  value: unknown,
  col: ColumnDef,
  badgeConfig?: BadgeConfig,
): React.ReactNode {
  switch (col.render) {
    case 'text':
      return <span className="text-sm">{String(value ?? '—')}</span>

    case 'date':
      return <span className="whitespace-nowrap text-sm tabular-nums">{formatDate(value)}</span>

    case 'badge':
      return renderBadge(value, col.field, badgeConfig)

    case 'link':
      if (typeof value !== 'string' || value === '') {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
        >
          View <ExternalLink className="h-3 w-3" />
        </a>
      )

    case 'list': {
      if (!Array.isArray(value)) {
        return <span className="text-sm">{String(value ?? '—')}</span>
      }
      if (value.length === 0) return <span className="text-muted-foreground">—</span>
      const displayItems = value.slice(0, 3)
      const overflow = value.length - displayItems.length
      return (
        <span className="text-sm">
          {displayItems.map(String).join(', ')}
          {overflow > 0 && <span className="ml-1 text-muted-foreground">+{overflow}</span>}
        </span>
      )
    }

    case 'truncate': {
      const str = String(value ?? '')
      if (!str) return <span className="text-muted-foreground">—</span>
      return (
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-[220px] truncate text-sm">{str}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-normal text-xs">{str}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    default:
      return <span className="text-sm">{String(value ?? '—')}</span>
  }
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: string
  sortField: string
  sortDir: 'asc' | 'desc'
}) {
  if (field !== sortField)
    return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-muted-foreground/40" />
  return sortDir === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-cyan-400" />
  ) : (
    <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-cyan-400" />
  )
}

const SKELETON_ROWS = 7

export function ResultsTable({
  columns,
  data,
  loading,
  onRowClick,
  sortField,
  sortDir,
  onSort,
  badgeConfig,
}: ResultsTableProps) {
  const visibleCols = columns.filter((c) => c.defaultVisible !== false)

  if (loading) {
    return (
      <div className="animate-pulse">
        {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border px-4 py-3">
            {visibleCols.map((col) => (
              <Skeleton
                key={col.field}
                className="h-4 rounded"
                style={{ width: col.width ?? '100px', flexShrink: 0 }}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 rounded-full bg-muted p-4 text-2xl">🔍</div>
        <p className="text-sm font-medium">No results found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Adjust your search query or remove active filters
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {visibleCols.map((col) => (
            <TableHead
              key={col.field}
              style={{ width: col.width }}
              className={
                col.sortable
                  ? 'cursor-pointer select-none whitespace-nowrap hover:text-foreground'
                  : 'whitespace-nowrap'
              }
              onClick={col.sortable ? () => onSort(col.field) : undefined}
            >
              {col.header}
              {col.sortable && (
                <SortIcon field={col.field} sortField={sortField} sortDir={sortDir} />
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow
            key={i}
            onClick={() => onRowClick(row)}
            className="cursor-pointer"
          >
            {visibleCols.map((col) => (
              <TableCell key={col.field} style={{ width: col.width }}>
                {renderCell(getFieldValue(row, col.field), col, badgeConfig)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
