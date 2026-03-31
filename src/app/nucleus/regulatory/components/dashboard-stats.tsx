'use client'

import { Database, Clock, Filter, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStatsProps {
  total: number
  loading: boolean
  lastUpdated: string | null
  activeFiltersCount: number
}

function formatLastUpdated(iso: string | null): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DashboardStats({
  total,
  loading,
  lastUpdated,
  activeFiltersCount,
}: DashboardStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-border bg-muted/30 px-4 py-2.5 text-sm">
      {/* Total results */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        {loading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <span>
            <span className="font-medium text-foreground">{total.toLocaleString()}</span>
            {' '}results
          </span>
        )}
      </div>

      {/* Last updated */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {loading ? (
          <Skeleton className="h-4 w-28" />
        ) : (
          <span>Updated {formatLastUpdated(lastUpdated)}</span>
        )}
      </div>

      {/* Active filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Filter className="h-3.5 w-3.5" />
          <span>
            <span className="font-medium">{activeFiltersCount}</span>
            {' '}active {activeFiltersCount === 1 ? 'filter' : 'filters'}
          </span>
        </div>
      )}

      {/* Live indicator */}
      {loading && (
        <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
          <Activity className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          <span className="text-xs">Fetching…</span>
        </div>
      )}
    </div>
  )
}
