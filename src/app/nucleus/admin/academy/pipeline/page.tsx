import { createMetadata } from '@/lib/metadata';
import { PipelineOverview } from './pipeline-overview-client';
import { ActiveJobsQueue } from './active-jobs-queue-client';

export const metadata = createMetadata({
  title: 'Pipeline Management',
  description: 'Monitor and manage the course generation pipeline infrastructure',
  path: '/nucleus/admin/academy/pipeline',
});

export default function PipelinePage() {
  return (
    <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline text-gold">Pipeline Management</h1>
          <p className="mt-2 text-slate-dim">
            Monitor pipeline health, track active jobs, and manage the course generation infrastructure
          </p>
        </div>

        {/* Pipeline Health Overview */}
        <PipelineOverview />

        {/* Active Jobs Queue */}
        <ActiveJobsQueue />
      </div>
  );
}
