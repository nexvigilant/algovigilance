'use client'

import { useState, useMemo, useCallback } from 'react'
import { Search, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { getDefaultMarket } from '@/lib/regulatory/registry'
import type { Tab, TabGroup } from '@/lib/regulatory/types'
import { useMcpQuery } from '../hooks/use-mcp-query'
import { TabGroupNav } from './tab-group-nav'
import { TabNav } from './tab-nav'
import { DataPanel } from './data-panel'
import { DetailDrawer } from './detail-drawer'
import { DashboardStats } from './dashboard-stats'

const PAGE_SIZE = 25

function getInitialTabGroupId(groups: TabGroup[]): string {
  return groups[0]?.id ?? ''
}

function getInitialTabId(groups: TabGroup[]): string {
  return groups[0]?.tabs[0]?.id ?? ''
}

function resolveActiveTabGroup(groups: TabGroup[], activeGroupId: string): TabGroup | undefined {
  return groups.find((g) => g.id === activeGroupId) ?? groups[0]
}

function resolveActiveTab(group: TabGroup | undefined, activeTabId: string): Tab | undefined {
  if (!group) return undefined
  return group.tabs.find((t) => t.id === activeTabId) ?? group.tabs[0]
}

function buildMcpParams(
  tab: Tab,
  filters: Record<string, unknown>,
  searchQuery: string,
  page: number,
): Record<string, unknown> {
  const p: Record<string, unknown> = { ...tab.defaultParams }

  // Merge non-empty filter values
  for (const [key, value] of Object.entries(filters)) {
    if (value !== '' && value !== undefined && value !== null && value !== false) {
      p[key] = value
    }
  }

  if (searchQuery.trim()) {
    p.search = searchQuery.trim()
  }

  p.limit = PAGE_SIZE
  p.skip = page * PAGE_SIZE

  return p
}

function sortData(
  rows: Record<string, unknown>[],
  sortField: string,
  sortDir: 'asc' | 'desc',
): Record<string, unknown>[] {
  if (!sortField || rows.length === 0) return rows
  return [...rows].sort((a, b) => {
    const av = a[sortField]
    const bv = b[sortField]
    const as = typeof av === 'string' ? av : String(av ?? '')
    const bs = typeof bv === 'string' ? bv : String(bv ?? '')
    return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
  })
}

export function RegulatoryDashboard() {
  const market = getDefaultMarket()

  const [activeTabGroupId, setActiveTabGroupId] = useState<string>(
    () => getInitialTabGroupId(market.tabGroups),
  )
  const [activeTabId, setActiveTabId] = useState<string>(
    () => getInitialTabId(market.tabGroups),
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [page, setPage] = useState(0)
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const activeTabGroup = useMemo(
    () => resolveActiveTabGroup(market.tabGroups, activeTabGroupId),
    [market.tabGroups, activeTabGroupId],
  )

  const activeTab = useMemo(
    () => resolveActiveTab(activeTabGroup, activeTabId),
    [activeTabGroup, activeTabId],
  )

  const mcpParams = useMemo(() => {
    if (!activeTab) return {}
    return buildMcpParams(activeTab, filters, searchQuery, page)
  }, [activeTab, filters, searchQuery, page])

  const { data, total, loading, error, lastUpdated, refetch } = useMcpQuery<
    Record<string, unknown>
  >({
    tool: activeTab?.mcpTool ?? '',
    params: mcpParams,
    enabled: Boolean(activeTab?.mcpTool),
  })

  const sortedData = useMemo(
    () => sortData(data, sortField, sortDir),
    [data, sortField, sortDir],
  )

  const activeFiltersCount = useMemo(
    () =>
      Object.values(filters).filter((v) => v !== '' && v !== undefined && v !== null && v !== false)
        .length,
    [filters],
  )

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleTabGroupChange = useCallback(
    (groupId: string) => {
      setActiveTabGroupId(groupId)
      const group = market.tabGroups.find((g) => g.id === groupId)
      setActiveTabId(group?.tabs[0]?.id ?? '')
      setFilters({})
      setPage(0)
      setSortField('')
    },
    [market.tabGroups],
  )

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setFilters({})
    setPage(0)
    setSortField('')
  }, [])

  const handleFilterChange = useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    setPage(0)
  }, [])

  const handleRowClick = useCallback((row: Record<string, unknown>) => {
    setSelectedRow(row)
    setDrawerOpen(true)
  }, [])

  const handleSort = useCallback((field: string) => {
    setSortDir((prev) => (sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'))
    setSortField(field)
  }, [sortField])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setPage(0)
  }, [])

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
      {/* Market header + global search */}
      <Card>
        <CardContent className="pb-3 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={market.name}>
              {market.flag}
            </span>
            <div className="min-w-0 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={market.searchConfig.placeholder}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={loading}
              aria-label="Refresh data"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab group navigation (Drugs | Devices | Food | Guidance) */}
      <TabGroupNav
        tabGroups={market.tabGroups}
        activeGroupId={activeTabGroupId}
        onGroupChange={handleTabGroupChange}
      />

      {/* Stats bar */}
      <DashboardStats
        total={total}
        loading={loading}
        lastUpdated={lastUpdated}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Sub-tab navigation — only shown when group has >1 tab */}
      {activeTabGroup && activeTabGroup.tabs.length > 1 && (
        <TabNav
          tabs={activeTabGroup.tabs}
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
        />
      )}

      {/* Main data panel */}
      {activeTab ? (
        <DataPanel
          tab={activeTab}
          data={sortedData}
          loading={loading}
          error={error}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onFilterChange={handleFilterChange}
          activeFilters={filters}
          onRowClick={handleRowClick}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No data source configured for this tab.</p>
          </CardContent>
        </Card>
      )}

      {/* Detail drawer */}
      {activeTab && (
        <DetailDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          record={selectedRow}
          tab={activeTab}
        />
      )}
    </div>
  )
}
