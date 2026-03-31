'use client';

import { useEffect, useState } from 'react';
import { listJobs, cancelJob, retryJob, type JobListResponse, type JobStatus } from '@/lib/course-builder-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Clock, XCircle, PlayCircle, StopCircle, RefreshCw, Archive } from 'lucide-react';
import { customToast } from '@/components/voice';
import { JobDetailsModal } from './job-details-modal';

import { logger } from '@/lib/logger';
const log = logger.scope('pipeline/active-jobs-queue-client');

export function ActiveJobsQueue() {
  const [jobs, setJobs] = useState<JobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'queued' | 'processing' | 'completed' | 'failed'>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [hideCompleted, setHideCompleted] = useState(false);

  // Fetch jobs
  const fetchJobs = async (status: typeof activeTab = activeTab, page: number = currentPage) => {
    try {
      setLoading(true);
      const offset = (page - 1) * pageSize;
      const data = await listJobs({
        status,
        limit: pageSize,
        offset,
        sort: 'newest',
      });
      setJobs(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs';
      log.error('Error fetching jobs:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 5 seconds for active/queued jobs
  useEffect(() => {
    if (activeTab === 'queued' || activeTab === 'processing' || activeTab === 'all') {
      const interval = setInterval(() => {
        fetchJobs();
      }, 5000); // 5 seconds

      return () => clearInterval(interval);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newTab = value as typeof activeTab;
    setActiveTab(newTab);
    setCurrentPage(1); // Reset to page 1 on tab change
    fetchJobs(newTab, 1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchJobs(activeTab, newPage);
  };

  // Handle job cancellation
  const handleCancelJob = async (jobId: string) => {
    if (!confirm(`Cancel job ${jobId}?\n\nThis action cannot be undone.`)) {
      return;
    }

    setCancelling(jobId);
    try {
      await cancelJob(jobId);
      await fetchJobs(); // Refresh list
      customToast.success('Job cancelled successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      customToast.error(`Failed to cancel job: ${message}`);
    } finally {
      setCancelling(null);
    }
  };

  // Handle job row click to open details modal
  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setModalOpen(true);
  };

  // Handle retry job
  const handleRetryJob = async (jobId: string) => {
    try {
      const result = await retryJob(jobId);
      customToast.success(`Job retried successfully! New job ID: ${result.job_id}`);
      setModalOpen(false);
      await fetchJobs(); // Refresh to see new job
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      customToast.error(`Failed to retry job: ${message}`);
    }
  };

  // Get status badge
  const statusIcons: Record<string, typeof Clock> = { queued: Clock, processing: PlayCircle, completed: CheckCircle, failed: XCircle };
  const getStatusBadge = (status: JobStatus['status']) => {
    return <StatusBadge status={status} icon={statusIcons[status]} />;
  };

  // Format stage name
  const formatStage = (stage: string | null) => {
    if (!stage) return 'N/A';
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Active Jobs Queue
            </CardTitle>
            <CardDescription>
              {jobs ? `${jobs.total} total jobs` : 'Loading jobs...'}
              {(activeTab === 'queued' || activeTab === 'processing' || activeTab === 'all') &&
                ' · Auto-refreshing every 5 seconds'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchJobs()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="queued">Queued</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Archive Filter for "All" tab */}
            {activeTab === 'all' && (
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  id="hide-completed"
                  checked={hideCompleted}
                  onCheckedChange={(checked) => setHideCompleted(checked as boolean)}
                />
                <Label htmlFor="hide-completed" className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1">
                  <Archive className="h-4 w-4" />
                  Hide completed and failed jobs
                </Label>
              </div>
            )}

            {loading && !jobs ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            ) : jobs && (() => {
              // Filter jobs if hideCompleted is enabled and we're on "all" tab
              const filteredJobs = (activeTab === 'all' && hideCompleted)
                ? jobs.jobs.filter(job => job.status !== 'completed' && job.status !== 'failed')
                : jobs.jobs;

              return filteredJobs.length === 0;
            })() ? (
              <div className="text-center py-8 text-muted-foreground">
                {activeTab === 'all' && hideCompleted
                  ? 'No active jobs found. Uncheck "Hide completed and failed jobs" to see all jobs.'
                  : `No ${activeTab === 'all' ? '' : activeTab} jobs found`}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table aria-label="Content generation job queue">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[110px]">Job ID</TableHead>
                      <TableHead className="w-[110px]">Course ID</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[140px]">Progress</TableHead>
                      <TableHead>Current Stage</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Filter jobs if hideCompleted is enabled and we're on "all" tab
                      const filteredJobs = (activeTab === 'all' && hideCompleted)
                        ? (jobs?.jobs ?? []).filter(job => job.status !== 'completed' && job.status !== 'failed')
                        : (jobs?.jobs ?? []);

                      return filteredJobs.map((job) => (
                      <TableRow
                        key={job.job_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleJobClick(job.job_id)}
                      >
                        <TableCell className="font-mono text-xs">
                          {job.job_id.substring(0, 12)}...
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {job.course_id.substring(0, 12)}...
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  job.status === 'completed' ? 'bg-green-500' :
                                  job.status === 'failed' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${job.progress_percent}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {job.progress_percent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs truncate block max-w-[200px]">
                            {formatStage(job.current_step)}
                          </span>
                          {job.error && (
                            <p className="text-xs text-yellow-400 mt-1 truncate max-w-[200px]">
                              {job.error}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {(job.status === 'queued' || job.status === 'processing') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                handleCancelJob(job.job_id);
                              }}
                              disabled={cancelling === job.job_id}
                              className="text-xs px-2 h-7"
                            >
                              <StopCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination Controls */}
            {jobs && jobs.total > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {jobs.jobs.length} of {jobs.total} jobs
                  {jobs.total_pages > 1 && ` · Page ${currentPage} of ${jobs.total_pages}`}
                </div>
                {jobs.total_pages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground px-3">
                      {currentPage} / {jobs.total_pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === jobs.total_pages || loading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Job Details Modal */}
      <JobDetailsModal
        jobId={selectedJobId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRetry={handleRetryJob}
      />
    </Card>
  );
}
