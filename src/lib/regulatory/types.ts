/**
 * Regulatory market registry types.
 * Dashboard renders entirely from these config shapes — no ad-hoc prop threading.
 */

/**
 * A regulatory market (FDA, EMA, Health Canada, etc.)
 */
export interface RegulatoryMarket {
  /** Unique market ID */
  id: string
  /** Full name */
  name: string
  /** Short display name */
  shortName: string
  /** Emoji flag */
  flag: string
  /** Official website */
  website: string
  /** Grouped tabs for the dashboard */
  tabGroups: TabGroup[]
  /** Unified search configuration */
  searchConfig: SearchConfig
  /** Guidance document configuration */
  guidanceConfig: GuidanceConfig
}

export interface TabGroup {
  /** Unique group ID */
  id: string
  /** Display label */
  label: string
  /** Lucide icon name (string, not component — avoids server/client issues) */
  icon: string
  /** Tabs within this group */
  tabs: Tab[]
}

export interface Tab {
  /** Unique tab ID within the market */
  id: string
  /** Display label */
  label: string
  /** Description shown in tooltips */
  description: string
  /** MCP tool name to call via /api/nexcore/api/v1/mcp/{tool} */
  mcpTool: string
  /** Default parameters for the MCP tool call */
  defaultParams: Record<string, unknown>
  /** Column definitions for the results table */
  columns: ColumnDef[]
  /** Available filter controls */
  filters: FilterDef[]
  /** How to display record detail */
  detailView: 'drawer' | 'modal' | 'page'
  /** Field used as the primary key for records */
  primaryKey: string
  /** Field used as the title for records */
  titleField: string
  /** Field used as the date for records */
  dateField: string
  /** Badge configuration for status/classification */
  badgeConfig?: BadgeConfig
}

export interface ColumnDef {
  /** Field name in the API response */
  field: string
  /** Display header */
  header: string
  /** Column width (tailwind class) */
  width?: string
  /** How to render the cell */
  render: 'text' | 'date' | 'badge' | 'link' | 'list' | 'truncate'
  /** Whether the column is sortable */
  sortable?: boolean
  /** Whether the column is visible by default */
  defaultVisible?: boolean
}

export interface FilterDef {
  /** Filter ID */
  id: string
  /** Display label */
  label: string
  /** Filter type */
  type: 'select' | 'date-range' | 'text' | 'toggle'
  /** Field in the API query this maps to */
  queryField: string
  /** Options for select filters */
  options?: { label: string; value: string }[]
  /** Default value */
  defaultValue?: string
}

export interface BadgeConfig {
  /** Field to read for badge */
  field: string
  /** Mapping of values to badge variants */
  variants: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }>
}

export interface SearchConfig {
  /** MCP tool for unified search */
  mcpTool: string
  /** Placeholder text */
  placeholder: string
  /** Search fields to query */
  searchFields: string[]
}

export interface GuidanceConfig {
  /** MCP tool for guidance search */
  mcpTool: string
  /** MCP tool for guidance categories */
  categoriesMcpTool: string
  /** MCP tool to get single guidance doc */
  getMcpTool: string
}

/** Result from an MCP tool call */
export interface McpToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    skip: number
    limit: number
    lastUpdated?: string
  }
}
