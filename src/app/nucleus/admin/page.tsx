import { createMetadata } from '@/lib/metadata';
import { AdminStatsGrid } from './components/admin-stats-grid';
import { HubDashboardTabs } from './components/hub-dashboard-tabs';
import { RecentActivityFeed } from './components/recent-activity';
import { GrowthMetricsPanel } from './components/growth-metrics-panel';

export const metadata = createMetadata({
  title: 'Admin Hub',
  description: 'Manage all AlgoVigilance ecosystem services',
  path: '/nucleus/admin',
});

export default function AdminPage() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-light">
          Admin Hub
        </h1>
        <p className="text-slate-dim text-sm mt-1">
          Manage and monitor all AlgoVigilance ecosystem services
        </p>
      </header>

      {/* Tier 1: Stats grid — 4-column stat cards (Control Center pattern) */}
      <AdminStatsGrid />

      {/* Tier 2: System panels — tabbed 3-column grid */}
      <HubDashboardTabs />

      {/* Tier 3: Detail grid — 2-column activity + growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed />
        <GrowthMetricsPanel />
      </div>
    </div>
  );
}
