'use client';

import { useState, useEffect } from 'react';
import { getJobDetails, cancelJob, type JobDetails } from '@/lib/course-builder-api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  StopCircle,
  Activity,
  AlertCircle,
  RefreshCw,
  Copy,
  Download
} from 'lucide-react';
import { customToast } from '@/components/voice';

import { logger } from '@/lib/logger';
const log = logger.scope('pipeline/job-details-modal');

interface JobDetailsModalProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (jobId: string) => void;
}

export function JobDetailsModal({ jobId, open, onOpenChange, onRetry }: JobDetailsModalProps) {
  const [details, setDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  // Fetch job details when modal opens
  useEffect(() => {
    if (open && jobId) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId]);

  const fetchDetails = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getJobDetails(jobId);
      setDetails(data);
    } catch (err: unknown) {
      log.error('Error fetching job details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;

    setCancelling(true);
    try {
      await cancelJob(jobId);
      await fetchDetails(); // Refresh
      customToast.success('Job cancelled successfully');
    } catch (err: unknown) {
      customToast.error(`Failed to cancel job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCancelling(false);
    }
  };

  const handleRetry = () => {
    if (jobId && onRetry) {
      onRetry(jobId);
      onOpenChange(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    customToast.info('Copied to clipboard');
  };

  const downloadLogs = () => {
    if (!details?.logs) return;
    const blob = new Blob([details.logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${jobId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status badge
  const statusIcons: Record<string, typeof Clock> = { queued: Clock, processing: PlayCircle, completed: CheckCircle, failed: XCircle };
  const getStatusBadge = (status: JobDetails['status']) => {
    return <StatusBadge status={status} icon={statusIcons[status]} />;
  };

  // Filter logs by search
  const filteredLogs = details?.logs?.filter(log =>
    log.toLowerCase().includes(logSearch.toLowerCase())
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                Job Details
                {details && getStatusBadge(details.status)}
              </DialogTitle>
              <DialogDescription>
                Job ID: {jobId}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {details && (details.status === 'queued' || details.status === 'processing') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  {cancelling ? 'Cancelling...' : 'Cancel Job'}
                </Button>
              )}
              {details && details.status === 'failed' && onRetry && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Job
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDetails}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        ) : details ? (
          <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="stages">Stage History</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-auto">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Job ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{details.job_id}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(details.job_id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Course ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{details.course_id}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(details.course_id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-sm font-medium">{details.progress_percent}%</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        details.status === 'completed' ? 'bg-green-500' :
                        details.status === 'failed' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${details.progress_percent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Current Step */}
                <div>
                  <p className="text-sm text-muted-foreground">Current Step</p>
                  <p className="text-sm font-medium">
                    {details.current_step || 'N/A'}
                  </p>
                </div>

                {/* Current Stage Details */}
                {details.stage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Current Stage</p>
                    <p className="text-sm font-medium capitalize">
                      {details.stage.replace(/_/g, ' ')}
                    </p>
                    {details.stage_details && (
                      <div className="mt-2 text-sm">
                        <p>
                          Completed {details.stage_details.completed} of {details.stage_details.total}
                        </p>
                        {details.stage_details.current_item && (
                          <p className="text-muted-foreground">
                            Current: {details.stage_details.current_item}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {details.error && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Error</p>
                        <p className="text-sm mt-1 font-mono">{details.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Time Estimates */}
                {(details.elapsed_seconds !== undefined || details.estimated_remaining_seconds !== undefined) && (
                  <div className="grid grid-cols-2 gap-4">
                    {details.elapsed_seconds !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Elapsed Time</p>
                        <p className="text-sm font-medium">
                          {Math.floor(details.elapsed_seconds / 60)}m {details.elapsed_seconds % 60}s
                        </p>
                      </div>
                    )}
                    {details.estimated_remaining_seconds !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Est. Remaining</p>
                        <p className="text-sm font-medium">
                          {Math.floor(details.estimated_remaining_seconds / 60)}m {details.estimated_remaining_seconds % 60}s
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md mr-2"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadLogs}
                  disabled={!details.logs || details.logs.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
              <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/50">
                {details.logs && details.logs.length > 0 ? (
                  <div className="space-y-1 font-mono text-xs">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log, index) => (
                        <div key={index} className="hover:bg-muted/50 px-2 py-1 rounded">
                          {log}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No logs match your search</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No logs available
                  </p>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Stage History Tab */}
            <TabsContent value="stages" className="flex-1 overflow-auto">
              {details.stage_history && details.stage_history.length > 0 ? (
                <div className="space-y-3">
                  {details.stage_history.map((stage, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        stage.error ? 'border-destructive bg-destructive/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">
                          {stage.stage.replace(/_/g, ' ')}
                        </h4>
                        {stage.completed_at ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : stage.error ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        {stage.started_at && (
                          <p className="text-muted-foreground">
                            Started: {new Date(stage.started_at).toLocaleString()}
                          </p>
                        )}
                        {stage.completed_at && (
                          <>
                            <p className="text-muted-foreground">
                              Completed: {new Date(stage.completed_at).toLocaleString()}
                            </p>
                            {stage.duration_seconds !== undefined && stage.duration_seconds !== null && (
                              <p className="text-muted-foreground">
                                Duration: {Math.floor(stage.duration_seconds / 60)}m {Math.round(stage.duration_seconds % 60)}s
                              </p>
                            )}
                          </>
                        )}
                        {stage.error && (
                          <p className="text-destructive font-mono mt-2">
                            Error: {stage.error}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No stage history available
                </p>
              )}
            </TabsContent>

            {/* Metadata Tab */}
            <TabsContent value="metadata" className="flex-1 overflow-auto">
              {details.metadata ? (
                <div className="space-y-6">
                  {/* Quality Metrics (if available) */}
                  {(details.metadata.character_count || details.metadata.citation_count || details.metadata.quality_score) && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Quality Metrics
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {details.metadata.character_count != null && (
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Character Count</p>
                            <p className="text-2xl font-bold flex items-baseline gap-1">
                              {details.metadata.character_count.toLocaleString()}
                              {details.metadata.character_count >= 15000 && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: 15,000+
                            </p>
                          </div>
                        )}
                        {details.metadata.citation_count != null && (
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Citations</p>
                            <p className="text-2xl font-bold flex items-baseline gap-1">
                              {details.metadata.citation_count}
                              {details.metadata.citation_count >= 40 && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: 40+
                            </p>
                          </div>
                        )}
                        {details.metadata.quality_score != null && (
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground">Quality Score</p>
                            <p className="text-2xl font-bold flex items-baseline gap-1">
                              {details.metadata.quality_score}
                              <span className="text-sm font-normal text-muted-foreground">/100</span>
                              {details.metadata.quality_score >= 80 && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: 80+
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* API Usage */}
                  {(details.metadata.api_calls != null || details.metadata.total_tokens != null) && (
                    <div>
                      <h4 className="font-semibold mb-3">API Usage</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {details.metadata.api_calls != null && (
                          <div>
                            <p className="text-sm text-muted-foreground">API Calls</p>
                            <p className="text-2xl font-bold">{details.metadata.api_calls}</p>
                          </div>
                        )}
                        {details.metadata.total_tokens != null && (
                          <div>
                            <p className="text-sm text-muted-foreground">Total Tokens</p>
                            <p className="text-2xl font-bold">{details.metadata.total_tokens.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cost */}
                  {details.metadata.estimated_cost != null && (
                    <div>
                      <h4 className="font-semibold mb-3">Cost</h4>
                      <p className="text-3xl font-bold">
                        ${details.metadata.estimated_cost.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No metadata available
                </p>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
