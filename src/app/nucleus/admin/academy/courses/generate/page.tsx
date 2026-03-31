import { createMetadata } from '@/lib/metadata';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GenerationFlowOrchestrator } from './generation-flow-orchestrator';
import { ProgressMonitorClient } from './progress-monitor-client';
import { SuccessScreenClient } from './success-screen-client';

export const metadata = createMetadata({
  title: 'Generate Capability Pathway',
  description: 'Generate AI-powered capability development pathways for the Academy',
  path: '/nucleus/admin/academy/courses/generate',
});

interface PageProps {
  searchParams: Promise<{
    job_id?: string;
    course_id?: string;
    topic?: string;
    status?: string;
    mode?: string; // 'custom' for custom topic mode
  }>;
}

export default async function GenerateCoursePage({ searchParams }: PageProps) {
  const { job_id, course_id, topic, status, mode } = await searchParams;

  // Determine which phase to render based on URL parameters
  // Phase 1: No job_id = Show generation flow (functional area selection or custom form)
  // Phase 2: job_id + course_id + no status = Show progress monitor
  // Phase 3: job_id + course_id + status=completed = Show success screen

  return (
    <div className="min-h-screen">
      {/* Back Navigation (only show on form phase) */}
      {!job_id && (
        <div className="border-b bg-nex-surface/95 backdrop-blur supports-[backdrop-filter]:bg-nex-surface/60">
          <div className="container mx-auto px-4 py-4 max-w-5xl">
            <Button variant="ghost" asChild>
              <Link href="/nucleus/admin/academy/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course Management
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Phase 1: Generation Flow (Functional Area Selection → Config) */}
      {!job_id && !course_id && (
        <GenerationFlowOrchestrator initialMode={mode === 'custom' ? 'custom' : undefined} />
      )}

      {/* Phase 2: Progress Monitor */}
      {job_id && course_id && status !== 'completed' && (
        <ProgressMonitorClient
          jobId={job_id}
          courseId={course_id}
          topic={topic || 'Untitled Course'}
        />
      )}

      {/* Phase 3: Success Screen */}
      {job_id && course_id && status === 'completed' && (
        <SuccessScreenClient
          jobId={job_id}
          courseId={course_id}
          topic={topic || 'Untitled Course'}
        />
      )}
    </div>
  );
}
