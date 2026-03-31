'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Target,
  Eye,
  Sparkles,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Loader2,
  ChevronRight,
  AlertCircle,
  Rocket,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import {
  getMyAssignmentsSummary,
  getContentQueue,
  type MyAssignmentsSummary,
  type ContentQueueItem,
} from '@/lib/actions/operations';

import { logger } from '@/lib/logger';
const log = logger.scope('my-work/my-work-dashboard');

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

export function MyWorkDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<MyAssignmentsSummary | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ContentQueueItem[]>([]);
  const [readyQueue, setReadyQueue] = useState<ContentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    if (!user) return;

    try {
      const [summaryResult, reviewResult, readyResult] = await Promise.all([
        getMyAssignmentsSummary(user.uid),
        getContentQueue('needs_review', 20, user.uid),
        getContentQueue('ready_for_generation', 20, user.uid),
      ]);

      if (summaryResult.success && summaryResult.summary) {
        setSummary(summaryResult.summary);
      }
      if (reviewResult.success && reviewResult.items) {
        setReviewQueue(reviewResult.items);
      }
      if (readyResult.success && readyResult.items) {
        setReadyQueue(readyResult.items);
      }
    } catch (error) {
      log.error('Failed to fetch my work data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan" />
      </div>
    );
  }

  if (!summary || summary.assignedDomains.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline text-gold">My Work</h1>
            <p className="text-slate-dim">Your assigned content and tasks</p>
          </div>
        </div>

        <Card className="bg-nex-surface border-nex-light">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-slate-dim mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-light mb-2">No Assignments Yet</h3>
            <p className="text-slate-dim text-sm mb-4">
              You haven&apos;t been assigned any domains to work on yet.
            </p>
            <p className="text-xs text-slate-dim">
              Contact your administrator to get domain assignments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gold">My Work</h1>
          <p className="text-slate-dim">
            {summary.totals.domains} assigned domains • {summary.totals.totalKSBs} total KSBs
          </p>
        </div>
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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Overall Progress */}
        <Card className="bg-nex-surface border-nex-light md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-light flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan" />
              My Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-dim">Published Content</span>
                  <span className="text-cyan font-medium">{summary.totals.completionRate}%</span>
                </div>
                <Progress value={summary.totals.completionRate} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{summary.totals.published}</div>
                  <div className="text-xs text-slate-dim">Published</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{summary.totals.review}</div>
                  <div className="text-xs text-slate-dim">To Review</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan">{summary.totals.readyToGenerate}</div>
                  <div className="text-xs text-slate-dim">Ready to Generate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="bg-nex-surface border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-dim text-sm">Needs Review</span>
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
                  {reviewQueue.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-dim text-sm">Ready to Generate</span>
                <Badge variant="secondary" className="bg-cyan/10 text-cyan">
                  {readyQueue.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-light flex items-center gap-2">
              <Rocket className="h-5 w-5 text-cyan" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reviewQueue.length > 0 ? (
              <Button
                asChild
                size="sm"
                className="w-full bg-amber-500/10 border border-amber-500 text-amber-400 hover:bg-amber-500/20"
              >
                <Link href={`/nucleus/admin/academy/ksb-builder?domain=${reviewQueue[0].domainId}&ksb=${reviewQueue[0].id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Review Next Item
                </Link>
              </Button>
            ) : readyQueue.length > 0 ? (
              <Button
                asChild
                size="sm"
                className="w-full bg-cyan/10 border border-cyan text-cyan hover:bg-cyan/20"
              >
                <Link href={`/nucleus/admin/academy/ksb-builder?domain=${readyQueue[0].domainId}&ksb=${readyQueue[0].id}`}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Next Item
                </Link>
              </Button>
            ) : (
              <p className="text-xs text-slate-dim text-center py-2">All caught up!</p>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-nex-light hover:border-cyan hover:text-cyan"
            >
              <Link href="/nucleus/admin/academy/ksb-builder">
                Open Content Builder
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Domains */}
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader>
          <CardTitle className="text-lg text-slate-light flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gold" />
            My Assigned Domains
          </CardTitle>
          <CardDescription className="text-slate-dim">
            Domains you are responsible for completing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summary.assignedDomains.map((domain) => (
              <Card key={domain.domainId} className="bg-nex-dark border-nex-light">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">
                        {domain.domainId}
                      </Badge>
                      <h4 className="text-sm font-medium text-slate-light">{domain.domainName}</h4>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        domain.completionRate >= 80
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : domain.completionRate >= 50
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {domain.completionRate}%
                    </Badge>
                  </div>

                  <Progress value={domain.completionRate} className="h-2 mb-3" />

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-medium text-emerald-400">{domain.published}</div>
                      <div className="text-slate-dim">Done</div>
                    </div>
                    <div>
                      <div className="font-medium text-amber-400">{domain.review}</div>
                      <div className="text-slate-dim">Review</div>
                    </div>
                    <div>
                      <div className="font-medium text-cyan">{domain.readyToGenerate}</div>
                      <div className="text-slate-dim">Ready</div>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-nex-light hover:border-cyan hover:text-cyan"
                  >
                    <Link href={`/nucleus/admin/academy/ksb-builder?domain=${domain.domainId}`}>
                      Work on Domain
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work Queues */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Review Queue */}
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader>
            <CardTitle className="text-lg text-slate-light flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-400" />
              My Review Queue
            </CardTitle>
            <CardDescription className="text-slate-dim">
              Content awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviewQueue.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-dim text-sm">No items awaiting review!</p>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {reviewQueue.map((item) => (
                    <Link
                      key={`${item.domainId}-${item.id}`}
                      href={`/nucleus/admin/academy/ksb-builder?domain=${item.domainId}&ksb=${item.id}`}
                      className="block p-3 rounded-lg border border-nex-light hover:border-amber-500/50 hover:bg-nex-light/50 transition-all"
                    >
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
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Ready for Generation */}
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader>
            <CardTitle className="text-lg text-slate-light flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan" />
              Ready for Generation
            </CardTitle>
            <CardDescription className="text-slate-dim">
              KSBs with research ready for AI generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {readyQueue.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-8 w-8 text-slate-dim mx-auto mb-2" />
                <p className="text-slate-dim text-sm">No items ready for generation.</p>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {readyQueue.map((item) => (
                    <Link
                      key={`${item.domainId}-${item.id}`}
                      href={`/nucleus/admin/academy/ksb-builder?domain=${item.domainId}&ksb=${item.id}`}
                      className="block p-3 rounded-lg border border-nex-light hover:border-cyan/50 hover:bg-nex-light/50 transition-all"
                    >
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
                                : 'bg-amber-500/10 text-amber-400'
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
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {summary.recentActivity.length > 0 && (
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader>
            <CardTitle className="text-lg text-slate-light flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan" />
              My Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recentActivity.map((activity) => (
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
                    <p className="text-sm text-slate-light">{activity.description}</p>
                    <p className="text-xs text-slate-dim">
                      {activity.ksbId} • {formatTimeAgo(activity.performedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
