import { createMetadata } from '@/lib/metadata';
import { CompactHealthStats } from './components/compact-health-stats';
import { CommunityDashboardTabs } from './components/community-dashboard-tabs';

export const metadata = createMetadata({
  title: 'Community Admin',
  description: 'Manage and monitor all aspects of the AlgoVigilance community',
  path: '/nucleus/admin/community',
});

export default function CommunityAdminDashboard() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header with inline health stats */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-gold">
              Community Admin
            </h1>
            <p className="text-slate-dim mt-1">
              Manage and monitor the AlgoVigilance community
            </p>
          </div>
          <CompactHealthStats />
        </div>
      </div>

      {/* Tabbed navigation */}
      <CommunityDashboardTabs />
    </div>
  );
}
