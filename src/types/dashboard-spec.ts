/**
 * Dashboard Spec Types
 *
 * Defines the JSON contract for spec-driven page generation via crystallize-page.ts.
 * A DashboardSpec drives creation of a complete Next.js page + dashboard component.
 */

export interface DashboardSpec {
  title: string;
  description: string;
  route: string; // e.g., "signal-trending" → generates at src/app/(authenticated)/signal-trending/
  dataSource: {
    endpoint: string; // e.g., "/api/nexcore/pv_signal_complete"
    method: 'GET' | 'POST';
    refreshInterval?: number; // ms, for auto-refresh
    params?: Record<string, string>;
  };
  layout: {
    columns: 1 | 2 | 3 | 4;
    gap?: string; // Tailwind gap class, default "gap-6"
  };
  cards: CardSpec[];
  charts: ChartSpec[];
  filters?: FilterSpec[];
  actions?: ActionSpec[];
}

export interface CardSpec {
  title: string;
  metric: string; // key in data to display
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string; // Tailwind color or HSL
  format?: 'number' | 'percent' | 'currency';
}

export interface ChartSpec {
  type: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  dataKey: string; // key in data for chart values
  xAxisKey?: string;
  colors?: string[];
  height?: number; // px, default 300
}

export interface FilterSpec {
  key: string;
  label: string;
  type: 'select' | 'date-range' | 'search';
  options?: string[]; // for select type
}

export interface ActionSpec {
  label: string;
  icon?: string;
  variant?: 'default' | 'outline' | 'destructive';
  action?: string; // handler name
}
