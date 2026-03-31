import { createMetadata } from '@/lib/metadata';
import { Suspense } from 'react';
import { LearnerManagementDashboard } from './components/learner-management-dashboard';

export const metadata = createMetadata({
  title: 'Learner Management',
  description: 'Manage learners, monitor progress, handle moderation and interventions',
  path: '/nucleus/admin/academy/learners',
});

export default function LearnersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Suspense fallback={<DashboardSkeleton />}>
        <LearnerManagementDashboard />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}
