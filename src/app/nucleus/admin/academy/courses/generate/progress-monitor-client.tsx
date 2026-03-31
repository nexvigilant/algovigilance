'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getJobStatus, cancelJob, type JobStatus } from '@/lib/course-builder-api';
import { cn } from '@/lib/utils';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/progress-monitor-client');

interface ProgressMonitorClientProps {
  jobId: string;
  courseId: string;
  topic: string;
}

interface PipelineStage {
  id: number;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending' | 'error';
}

export function ProgressMonitorClient({ jobId, courseId, topic }: ProgressMonitorClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Poll for job status
  useEffect(() => {
    if (!isPolling) return;

    const pollJob = async () => {
      try {
        const jobStatus = await getJobStatus(jobId);
        setStatus(jobStatus);

        // Stop polling if completed or failed
        if (jobStatus.status === 'completed') {
          setIsPolling(false);
          // Redirect to success screen
          setTimeout(() => {
            router.push(
              `/nucleus/admin/academy/courses/generate?job_id=${jobId}&course_id=${courseId}&topic=${encodeURIComponent(topic)}&status=completed`
            );
          }, 1000);
        } else if (jobStatus.status === 'failed') {
          setIsPolling(false);
          setError(jobStatus.error || 'Generation failed');
        }
      } catch (err) {
        log.error('Error polling job status:', err);
        // Don't stop polling on transient errors, just log
      }
    };

    // Poll immediately, then every 5 seconds
    pollJob();
    const interval = setInterval(pollJob, 5000);

    return () => clearInterval(interval);
  }, [jobId, courseId, topic, router, isPolling]);

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Determine pipeline stages based on current status
  const stages: PipelineStage[] = [
    {
      id: 1,
      name: 'KSB Decomposition',
      description: 'Identifying Knowledge, Skills, and Behaviors',
      status: getStageStatus('ksb_decomposition'),
    },
    {
      id: 2,
      name: 'Deep Research',
      description: 'Gathering authoritative sources and citations',
      status: getStageStatus('research'),
    },
    {
      id: 3,
      name: 'Content Generation',
      description: 'Creating structured lessons and exercises',
      status: getStageStatus('content_generation'),
    },
    {
      id: 4,
      name: 'Quality Validation',
      description: 'Validating accuracy and pedagogical alignment',
      status: getStageStatus('quality_validation'),
    },
    {
      id: 5,
      name: 'Academy Formatting',
      description: 'Transforming to Academy LMS format',
      status: getStageStatus('academy_formatting'),
    },
  ];

  function getStageStatus(stageName: string): PipelineStage['status'] {
    if (!status) return 'pending';

    if (status.status === 'failed') {
      // Mark current stage as error
      if (status.stage === stageName) return 'error';
      // Previous stages completed
      if (status.progress_percent > getStageProgress(stageName)) return 'completed';
      return 'pending';
    }

    if (status.stage === stageName) return 'active';
    if (status.progress_percent > getStageProgress(stageName)) return 'completed';
    return 'pending';
  }

  function getStageProgress(stageName: string): number {
    const stageMap: Record<string, number> = {
      ksb_decomposition: 20,
      research: 40,
      content_generation: 70,
      quality_validation: 90,
      academy_formatting: 95,
    };
    return stageMap[stageName] || 0;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Generation Failed:</strong> {error}
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                The course generation pipeline encountered an error. This may be due to:
              </div>
              <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2">
                <li>• API rate limits or timeouts</li>
                <li>• Invalid input parameters</li>
                <li>• Temporary service disruption</li>
              </ul>
              <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" onClick={() => router.push('/nucleus/admin/academy/courses')}>
                  Back to Courses
                </Button>
                <Button onClick={() => router.push('/nucleus/admin/academy/courses/generate')}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2">Generating Capability Pathway</h1>
        <p className="text-muted-foreground">
          AI research team is building your pathway. This typically takes 5-15 minutes.
        </p>
      </div>

      {/* Progress Card */}
      <Card className="bg-nex-surface border border-nex-light rounded-lg mb-6">
        <CardContent className="pt-6 space-y-6">
          {/* Topic */}
          <div>
            <div className="text-2xl font-bold font-headline mb-2">{topic}</div>
            <div className="text-sm text-muted-foreground">
              Job ID: {jobId} • Course ID: {courseId}
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{status?.progress_percent || 0}%</span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500 glow-cyan"
                style={{ width: `${status?.progress_percent || 0}%` }}
              />
              <div className="absolute inset-0 pcb-grid opacity-10" />
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Elapsed: {formatTime(elapsedSeconds)}</span>
            </div>
            {status?.estimated_remaining_seconds && (
              <span className="text-muted-foreground">
                Est. remaining: {formatTime(status.estimated_remaining_seconds)}
              </span>
            )}
          </div>

          {/* Pipeline Stages */}
          <div className="space-y-3">
            {stages.map((stage) => (
              <PipelineStageIndicator key={stage.id} stage={stage} status={status} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(true)}>
              View Technical Details
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isCancelling}
              onClick={async () => {
                if (confirm('Are you sure you want to cancel this generation job?')) {
                  setIsCancelling(true);
                  try {
                    await cancelJob(jobId);
                    setIsPolling(false);
                  } catch (err) {
                    log.error('Failed to cancel job:', err);
                  }
                  router.push('/nucleus/admin/academy/courses');
                }
              }}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Job'}
            </Button>
          </div>

          {/* Technical Details Modal */}
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Job Technical Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Job ID</span>
                  <span className="font-mono">{jobId}</span>
                  <span className="text-muted-foreground">Course ID</span>
                  <span className="font-mono">{courseId}</span>
                  <span className="text-muted-foreground">Status</span>
                  <span>{status?.status || 'pending'}</span>
                  <span className="text-muted-foreground">Stage</span>
                  <span>{status?.stage || 'initializing'}</span>
                  <span className="text-muted-foreground">Progress</span>
                  <span>{status?.progress_percent || 0}%</span>
                  <span className="text-muted-foreground">Elapsed</span>
                  <span>{formatTime(elapsedSeconds)}</span>
                </div>
                {status?.stage_details && (
                  <div className="border-t pt-3">
                    <span className="text-muted-foreground block mb-1">Stage Details</span>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(status.stage_details, null, 2)}
                    </pre>
                  </div>
                )}
                {status?.error && (
                  <div className="border-t pt-3">
                    <span className="text-destructive block mb-1">Error</span>
                    <pre className="bg-destructive/10 p-3 rounded text-xs">{status.error}</pre>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Alert className="bg-cyan-500/5 border-cyan-500/20">
        <AlertCircle className="h-4 w-4 text-cyan-500" />
        <AlertDescription className="text-sm">
          <strong>While you wait:</strong>
          <ul className="mt-2 space-y-1">
            <li>• Generation typically completes in 5-15 minutes</li>
            <li>• You can close this page - the job will continue running</li>
            <li>• Check status anytime in the Jobs dashboard</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Stage Indicator Component
interface PipelineStageIndicatorProps {
  stage: PipelineStage;
  status: JobStatus | null;
}

function PipelineStageIndicator({ stage, status }: PipelineStageIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg border transition-all',
        stage.status === 'completed' && 'bg-green-500/10 border-green-500/30',
        stage.status === 'active' && 'bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/10 animate-pulse',
        stage.status === 'pending' && 'bg-muted/30 border-muted-foreground/10',
        stage.status === 'error' && 'bg-destructive/10 border-destructive/30'
      )}
    >
      {/* Stage Number/Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full font-bold shrink-0',
          stage.status === 'completed' && 'bg-green-500 text-white',
          stage.status === 'active' && 'bg-cyan-500 text-white',
          stage.status === 'pending' && 'bg-muted-foreground/20 text-muted-foreground',
          stage.status === 'error' && 'bg-destructive text-white'
        )}
      >
        {stage.status === 'completed' ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : stage.status === 'error' ? (
          <XCircle className="h-5 w-5" />
        ) : (
          stage.id
        )}
      </div>

      {/* Stage Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium">{stage.name}</div>
        <div className="text-sm text-muted-foreground mt-1">{stage.description}</div>

        {/* Active stage details */}
        {stage.status === 'active' && status?.stage_details && (
          <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">
            {status.stage_details.current_item && (
              <div>Processing: {status.stage_details.current_item}</div>
            )}
            {status.stage_details.completed !== undefined && (
              <div>
                Progress: {status.stage_details.completed}/{status.stage_details.total} components
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Icon */}
      <div className="shrink-0">
        {stage.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {stage.status === 'active' && <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />}
        {stage.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
        {stage.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
      </div>
    </div>
  );
}
