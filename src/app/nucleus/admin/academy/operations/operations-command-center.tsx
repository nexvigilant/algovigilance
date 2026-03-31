'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronRight,
  Target,
  Zap,
  FileText,
  PlayCircle,
  Users as _Users,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getGlobalOperationsStats,
  getContentQueue,
  getRecentOperationsActivity,
  batchPublishContent,
  batchGenerateContent,
  type GlobalOperationsStats,
  type ContentQueueItem,
  type RecentActivityItem,
} from '@/lib/actions/operations';
import { TeamAssignmentsPanel } from './team-assignments-panel';
import { TeamPerformancePanel } from './team-performance-panel';
import { NotificationsBell } from './notifications-bell';
import { WorkflowPanel } from './workflow-panel';
import { DeadlineTrackerPanel } from './deadline-tracker-panel';
import { QualityDashboardPanel } from './quality-dashboard-panel';
import { ScheduledPublishingPanel } from './scheduled-publishing-panel';
import { EscalationPanel } from './escalation-panel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/operations-command-center');

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

function _StatusIndicator({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-400',
    generating: 'bg-blue-500 animate-pulse',
    review: 'bg-amber-500',
    published: 'bg-emerald-500',
    archived: 'bg-slate-300',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status] || colors.draft}`} />;
}

export function OperationsCommandCenter() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GlobalOperationsStats | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ContentQueueItem[]>([]);
  const [readyQueue, setReadyQueue] = useState<ContentQueueItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedGenerateItems, setSelectedGenerateItems] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<'idle' | 'publishing' | 'generating'>('idle');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [engineType, setEngineType] = useState<'red_pen' | 'triage' | 'synthesis'>('triage');
  const [generationProgress, setGenerationProgress] = useState<{ processed: number; total: number } | null>(null);

  async function fetchData() {
    try {
      const [statsResult, reviewResult, readyResult, activityResult] = await Promise.all([
        getGlobalOperationsStats(),
        getContentQueue('needs_review', 10),
        getContentQueue('ready_for_generation', 10),
        getRecentOperationsActivity(10),
      ]);

      if (statsResult.success && statsResult.stats) setStats(statsResult.stats);
      if (reviewResult.success && reviewResult.items) setReviewQueue(reviewResult.items);
      if (readyResult.success && readyResult.items) setReadyQueue(readyResult.items);
      if (activityResult.success && activityResult.activities) setRecentActivity(activityResult.activities);
    } catch (error) {
      log.error('Failed to fetch operations data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  async function handleBatchPublish() {
    if (!user || selectedItems.size === 0) return;

    setBatchAction('publishing');
    const items = reviewQueue
      .filter((item) => selectedItems.has(`${item.domainId}-${item.id}`))
      .map((item) => ({ domainId: item.domainId, ksbId: item.id }));

    try {
      const result = await batchPublishContent(items, user.uid, 'Batch approved from Operations Center');

      if (result.success) {
        setSelectedItems(new Set());
        await fetchData();
      } else {
        log.error('Batch publish errors:', result.errors);
      }
    } finally {
      setBatchAction('idle');
    }
  }

  function toggleItemSelection(domainId: string, ksbId: string) {
    const key = `${domainId}-${ksbId}`;
    const newSelection = new Set(selectedItems);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedItems(newSelection);
  }

  function selectAllReview() {
    const allKeys = reviewQueue.map((item) => `${item.domainId}-${item.id}`);
    setSelectedItems(new Set(allKeys));
  }

  function toggleGenerateItemSelection(domainId: string, ksbId: string) {
    const key = `${domainId}-${ksbId}`;
    const newSelection = new Set(selectedGenerateItems);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedGenerateItems(newSelection);
  }

  function selectAllGenerate() {
    const allKeys = readyQueue.map((item) => `${item.domainId}-${item.id}`);
    setSelectedGenerateItems(new Set(allKeys));
  }

  async function handleBatchGenerate() {
    if (!user || selectedGenerateItems.size === 0) return;

    setBatchAction('generating');
    setGenerationProgress({ processed: 0, total: selectedGenerateItems.size });

    const items = readyQueue
      .filter((item) => selectedGenerateItems.has(`${item.domainId}-${item.id}`))
      .map((item) => ({ domainId: item.domainId, ksbId: item.id }));

    try {
      const result = await batchGenerateContent(items, engineType, user.uid);
      setGenerationProgress({ processed: result.processedCount, total: items.length });

      if (result.success) {
        setSelectedGenerateItems(new Set());
        setShowGenerateModal(false);
        await fetchData();
      } else {
        log.error('Batch generation errors:', result.errors);
      }
    } finally {
      setBatchAction('idle');
      setGenerationProgress(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gold">Content Operations</h1>
          <p className="text-slate-dim">
            Manage capability pathway content generation and publishing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-nex-light text-slate-dim hover:text-cyan hover:border-cyan"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Progress Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Overall Progress */}
          <Card className="bg-nex-surface border-nex-light md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-light flex items-center gap-2">
                <Target className="h-5 w-5 text-cyan" />
                Global Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-dim">Published Content</span>
                    <span className="text-cyan font-medium">{stats.publishedPercent}%</span>
                  </div>
                  <Progress value={stats.publishedPercent} className="h-3" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-light">{stats.totalKSBs}</div>
                    <div className="text-xs text-slate-dim">Total KSBs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{stats.byStatus.published}</div>
                    <div className="text-xs text-slate-dim">Published</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-light">{stats.totalDomains}</div>
                    <div className="text-xs text-slate-dim">Domains</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Required Summary */}
          <Card className="bg-nex-surface border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-dim text-sm">Awaiting Review</span>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
                    {stats.needsReview}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-dim text-sm">Ready to Generate</span>
                  <Badge variant="secondary" className="bg-cyan/10 text-cyan">
                    {stats.readyForGeneration}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-dim text-sm">In Progress</span>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
                    {stats.byStatus.generating}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-light flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-start border-nex-light hover:border-cyan hover:text-cyan"
              >
                <Link href="/nucleus/admin/academy/ksb-builder/review">
                  <Eye className="h-4 w-4 mr-2" />
                  Review Queue
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-start border-nex-light hover:border-cyan hover:text-cyan"
              >
                <Link href="/nucleus/admin/academy/ksb-builder">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Content Builder
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full justify-start border-nex-light hover:border-cyan hover:text-cyan"
              >
                <Link href="/nucleus/admin/academy/pipeline">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Pipeline Status
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Queues */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Review Queue */}
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-light flex items-center gap-2">
                  <Eye className="h-5 w-5 text-amber-400" />
                  Awaiting Review
                </CardTitle>
                <CardDescription className="text-slate-dim">
                  AI-generated content ready for approval
                </CardDescription>
              </div>
              {reviewQueue.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllReview}>
                    Select All
                  </Button>
                  {selectedItems.size > 0 && (
                    <Button
                      size="sm"
                      onClick={handleBatchPublish}
                      disabled={batchAction === 'publishing'}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {batchAction === 'publishing' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Publish ({selectedItems.size})
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reviewQueue.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-dim text-sm">All caught up! No items awaiting review.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {reviewQueue.map((item) => {
                    const isSelected = selectedItems.has(`${item.domainId}-${item.id}`);
                    return (
                      <div
                        key={`${item.domainId}-${item.id}`}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-cyan bg-cyan/5'
                            : 'border-nex-light hover:border-amber-500/50 hover:bg-nex-light/50'
                        }`}
                        onClick={() => toggleItemSelection(item.domainId, item.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {item.id}
                              </Badge>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {item.type}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-slate-light truncate">
                              {item.itemName}
                            </p>
                            <p className="text-xs text-slate-dim">{item.domainName}</p>
                          </div>
                          <Link
                            href={`/nucleus/admin/academy/ksb-builder?domain=${item.domainId}&ksb=${item.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronRight className="h-4 w-4 text-slate-dim hover:text-cyan" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Ready for Generation */}
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-light flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan" />
                  Ready for Generation
                </CardTitle>
                <CardDescription className="text-slate-dim">
                  KSBs with research ready for AI content generation
                </CardDescription>
              </div>
              {readyQueue.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllGenerate}>
                    Select All
                  </Button>
                  {selectedGenerateItems.size > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setShowGenerateModal(true)}
                      className="bg-cyan hover:bg-cyan-dark text-nex-deep"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate ({selectedGenerateItems.size})
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {readyQueue.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-slate-dim mx-auto mb-2" />
                <p className="text-slate-dim text-sm">No KSBs ready for generation.</p>
                <p className="text-xs text-slate-dim mt-1">Add research to KSBs first.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {readyQueue.map((item) => {
                    const isSelected = selectedGenerateItems.has(`${item.domainId}-${item.id}`);
                    return (
                      <div
                        key={`${item.domainId}-${item.id}`}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-cyan bg-cyan/5'
                            : 'border-nex-light hover:border-cyan/50 hover:bg-nex-light/50'
                        }`}
                        onClick={() => toggleGenerateItemSelection(item.domainId, item.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {item.id}
                              </Badge>
                              {item.qualityScore && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${
                                    item.qualityScore >= 70
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : item.qualityScore >= 50
                                      ? 'bg-amber-500/10 text-amber-400'
                                      : 'bg-red-500/10 text-red-400'
                                  }`}
                                >
                                  {item.qualityScore}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-slate-light truncate">
                              {item.itemName}
                            </p>
                            <p className="text-xs text-slate-dim">{item.domainName}</p>
                          </div>
                          <Link
                            href={`/nucleus/admin/academy/ksb-builder?domain=${item.domainId}&ksb=${item.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ChevronRight className="h-4 w-4 text-slate-dim hover:text-cyan" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch Generation Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="bg-nex-surface border-nex-light">
          <DialogHeader>
            <DialogTitle className="text-slate-light flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan" />
              Batch Content Generation
            </DialogTitle>
            <DialogDescription className="text-slate-dim">
              Generate AI content for {selectedGenerateItems.size} selected KSBs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-light">Activity Engine</label>
              <Select value={engineType} onValueChange={(v) => setEngineType(v as typeof engineType)}>
                <SelectTrigger className="bg-nex-dark border-nex-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="triage">Triage (Decision Classification)</SelectItem>
                  <SelectItem value="red_pen">Red Pen (Error Detection)</SelectItem>
                  <SelectItem value="synthesis">Synthesis (Work Product Creation)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-dim">
                Choose the activity engine type for all selected KSBs
              </p>
            </div>

            {generationProgress && (
              <div className="space-y-2">
                <Progress value={(generationProgress.processed / generationProgress.total) * 100} />
                <p className="text-xs text-center text-slate-dim">
                  Generated {generationProgress.processed} of {generationProgress.total}
                </p>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-amber-400">
                This will generate AI content for all selected KSBs. Each generation takes 30-60 seconds.
                Estimated time: {selectedGenerateItems.size * 45} seconds.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateModal(false)}
              disabled={batchAction === 'generating'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchGenerate}
              disabled={batchAction === 'generating'}
              className="bg-cyan hover:bg-cyan-dark text-nex-deep"
            >
              {batchAction === 'generating' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Generation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automation, Deadlines, Quality & Scheduling */}
      {stats && (
        <div className="grid gap-6 lg:grid-cols-4">
          <WorkflowPanel />
          <DeadlineTrackerPanel domains={stats.domains.map(d => ({ id: d.domainId, name: d.domainName }))} onRefresh={handleRefresh} />
          <QualityDashboardPanel />
          <ScheduledPublishingPanel
            selectedItems={reviewQueue
              .filter((item) => selectedItems.has(`${item.domainId}-${item.id}`))
              .map((item) => ({
                domainId: item.domainId,
                domainName: item.domainName,
                ksbId: item.id,
                ksbName: item.itemName,
              }))}
            onScheduleCreated={() => {
              setSelectedItems(new Set());
              fetchData();
            }}
          />
        </div>
      )}

      {/* Team Management & Escalations */}
      {stats && (
        <div className="grid gap-6 lg:grid-cols-3">
          <TeamAssignmentsPanel domains={stats.domains} onRefresh={handleRefresh} />
          <TeamPerformancePanel />
          <EscalationPanel />
        </div>
      )}

      {/* Domain Progress and Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Domain Progress */}
        <Card className="bg-nex-surface border-nex-light lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-slate-light flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan" />
              Domain Progress
            </CardTitle>
            <CardDescription className="text-slate-dim">
              Content completion by domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-4">
                {stats?.domains.map((domain) => (
                  <div key={domain.domainId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-light">
                          {domain.domainId}: {domain.domainName}
                        </span>
                        {domain.needsReview > 0 && (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 text-xs">
                            {domain.needsReview} review
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-dim">
                        {domain.published}/{domain.total} ({domain.completionPercent}%)
                      </span>
                    </div>
                    <Progress value={domain.completionPercent} className="h-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader>
            <CardTitle className="text-lg text-slate-light flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`p-1.5 rounded-full ${
                        activity.type === 'publish'
                          ? 'bg-emerald-500/10'
                          : activity.type === 'generation'
                          ? 'bg-cyan/10'
                          : 'bg-amber-500/10'
                      }`}
                    >
                      {activity.type === 'publish' ? (
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                      ) : activity.type === 'generation' ? (
                        <Sparkles className="h-3 w-3 text-cyan" />
                      ) : (
                        <Eye className="h-3 w-3 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-light truncate">{activity.description}</p>
                      <p className="text-xs text-slate-dim">
                        {activity.ksbId} • {formatTimeAgo(activity.performedAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-slate-dim text-center py-4">No recent activity</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
