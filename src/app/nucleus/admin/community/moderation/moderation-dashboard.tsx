'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { VoiceEmptyState, customToast } from '@/components/voice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  AlertTriangle,
  EyeOff,
  Trash2,
  Ban,
  XCircle,
  Loader2,
} from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import {
  getModerationQueue,
  getModerationStats,
  resolveReport,
} from './actions';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('moderation/moderation-dashboard');

interface ModerationItem {
  id: string;
  type: 'post' | 'reply';
  itemId: string;
  reportedBy: string;
  reason: 'spam' | 'harassment' | 'off-topic' | 'other';
  details?: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  createdAt: Date | { toDate: () => Date };
}

interface ModerationStats {
  pending: number;
  actionedLast7Days: number;
  activeBans: number;
}

type ModerationStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';

export function ModerationDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [queue, setQueue] = useState<ModerationItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [actionType, setActionType] = useState<'hide' | 'delete' | 'ban_user' | 'dismiss'>('hide');
  const [processing, setProcessing] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  // Load data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [statsResult, queueResult] = await Promise.all([
        getModerationStats(),
        getModerationQueue({
          status: statusFilter === 'all' ? undefined : (statusFilter as ModerationStatus),
        }),
      ]);

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }

      if (queueResult.success && queueResult.items) {
        setQueue(queueResult.items as ModerationItem[]);
      }
    } catch (error) {
      log.error('Error loading moderation data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(item: ModerationItem, action: typeof actionType) {
    setSelectedItem(item);
    setActionType(action);
    setActionDialogOpen(true);
  }

  async function confirmAction() {
    if (!selectedItem) return;

    setProcessing(true);
    try {
      const result = await resolveReport({
        reportId: selectedItem.id,
        action: actionType,
        reason: `Moderation action: ${actionType}`,
      });

      if (result.success) {
        // Refresh data
        await loadData();
        setActionDialogOpen(false);
        setSelectedItem(null);
        customToast.success('Moderation action completed');
      } else {
        customToast.error('Failed to take action: ' + result.error);
      }
    } catch (error) {
      log.error('Error taking action:', error);
      customToast.error('Failed to take action');
    } finally {
      setProcessing(false);
    }
  }

  function getReasonBadge(reason: string) {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      harassment: 'bg-red-500/20 text-red-600 dark:text-red-400',
      'off-topic': 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      other: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
    };

    return (
      <Badge className={colors[reason] || colors.other} variant="outline">
        {reason}
      </Badge>
    );
  }

  function getStatusBadge(status: string) {
    return <StatusBadge status={status} />;
  }

  if (authLoading || loading) {
    return <VoiceLoading context="admin" variant="fullpage" message="Loading moderation queue..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Moderation Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage community reports and maintain content quality
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actioned (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {stats.actionedLast7Days}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Bans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{stats.activeBans}</div>
              <p className="text-xs text-muted-foreground mt-1">Users banned</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="actioned">Actioned</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>
            {queue.length} {statusFilter === 'all' ? 'total' : statusFilter} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <VoiceEmptyState
              context="posts"
              title="No reports to review"
              description="Great job keeping the community safe!"
              variant="inline"
              size="md"
            />
          ) : (
            <div className="space-y-4">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {item.type === 'post' ? 'Post' : 'Reply'} Report
                          </span>
                          {getReasonBadge(item.reason)}
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ID: {item.itemId.substring(0, 12)}...
                        </p>
                        {item.details && (
                          <p className="text-sm mt-2 text-muted-foreground">
                            Details: {item.details}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(item, 'hide')}
                        >
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(item, 'delete')}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(item, 'ban_user')}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Ban User
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(item, 'dismiss')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Reported:{' '}
                      {item.createdAt
                        ? (item.createdAt instanceof Date
                            ? item.createdAt.toLocaleString()
                            : toDateFromSerialized(item.createdAt).toLocaleString())
                        : 'N/A'}
                    </span>
                    <span>By: {item.reportedBy.substring(0, 8)}...</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{' '}
              <strong className="text-foreground">{actionType.replace('_', ' ')}</strong>?
              {actionType === 'ban_user' && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                    ⚠️ This will permanently ban the user from the community.
                  </p>
                </div>
              )}
              {actionType === 'delete' && (
                <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                    ⚠️ This will permanently delete the content.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
