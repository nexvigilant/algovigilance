import { createMetadata } from '@/lib/metadata';
import { CompactStats } from './components/compact-stats';
import { AdminDashboardTabs } from './components/admin-dashboard-tabs';

export const metadata = createMetadata({
  title: 'Academy Admin',
  description: 'Manage capability pathways, practitioners, and analytics',
  path: '/nucleus/admin/academy',
});

export default function AcademyAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with inline stats */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-gold">
              Academy Administration
            </h1>
            <p className="text-slate-dim mt-1">
              Build capability pathways and monitor practitioner progress
            </p>
          </div>
          <CompactStats />
        </div>
      </div>

      {/* Tabbed navigation */}
      <AdminDashboardTabs />
    </div>
  );
}
