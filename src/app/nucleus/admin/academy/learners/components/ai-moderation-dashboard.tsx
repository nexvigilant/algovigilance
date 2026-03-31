'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import {
  getAIModerationStats,
  getModerationLogs,
  overrideModerationAction,
} from '../moderation-actions';
import type { AIModerationStats, ModerationLog } from '@/types/ai-moderation';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('components/ai-moderation-dashboard');

interface AIModerationDashboardProps {
  onRefresh?: () => void;
}

export function AIModerationDashboard({ onRefresh }: AIModerationDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AIModerationStats | null>(null);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideAction, setOverrideAction] = useState('approve');
  const [overrideReason, setOverrideReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        getAIModerationStats(parseInt(timeRange)),
        getModerationLogs({ limit: 50 }),
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      log.error('Error loading AI moderation data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleOverride() {
    if (!selectedLog || !user) return;
    setProcessing(true);
    try {
      await overrideModerationAction(
        selectedLog.logId,
        overrideAction,
        overrideReason,
        user.uid
      );
      await loadData();
      closeOverrideDialog();
      onRefresh?.();
    } catch (error) {
      log.error('Error overriding action:', error);
    } finally {
      setProcessing(false);
    }
  }

  function closeOverrideDialog() {
    setShowOverrideDialog(false);
    setSelectedLog(null);
    setOverrideReason('');
  }

  function getActionBadge(action: string, autoActioned: boolean) {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      approve: { variant: 'default', label: 'Approved' },
      flag_for_review: { variant: 'secondary', label: 'Flagged' },
      auto_warn: { variant: 'destructive', label: 'Auto-Warn' },
      auto_remove: { variant: 'destructive', label: 'Auto-Remove' },
      escalate: { variant: 'destructive', label: 'Escalated' },
    };

    const config = variants[action] || { variant: 'outline' as const, label: action };

    return (
      <Badge variant={config.variant}>
        {autoActioned && '🤖 '}
        {config.label}
      </Badge>
    );
  }

  function getRiskBadge(score: number) {
    if (score < 0.2) return <Badge className="bg-green-500">Low</Badge>;
    if (score < 0.5) return <Badge className="bg-yellow-500 text-black">Medium</Badge>;
    if (score < 0.8) return <Badge className="bg-orange-500">High</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading AI moderation data...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Content Moderation</h2>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Scanned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalScanned || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg {stats?.avgProcessingTime.toFixed(0) || 0}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Auto-Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.autoApproved || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalScanned
                  ? ((stats.autoApproved / stats.totalScanned) * 100).toFixed(1)
                  : 0}
                % of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Flagged
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.flaggedForReview || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.autoActioned || 0} auto-actioned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalScanned && stats.falsePositives
                  ? (
                      ((stats.totalScanned - stats.falsePositives) / stats.totalScanned) *
                      100
                    ).toFixed(1)
                  : '100'}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.falsePositives || 0} overrides
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Violation Breakdown */}
        {stats && Object.keys(stats.violationsByCategory).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Violations by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.violationsByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <Badge key={category} variant="outline" className="text-sm">
                      {category.replace(/_/g, ' ')}: {count}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Moderation Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No moderation activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 10).map((log) => (
                  <div
                    key={log.logId}
                    className="flex items-start justify-between p-3 border rounded hover:bg-muted/50"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.actionTaken, log.actionAutomatic)}
                        {getRiskBadge(log.result?.overallRiskScore || 0)}
                        <Badge variant="outline">{log.contentType}</Badge>
                        {log.actionOverriddenBy && (
                          <Badge variant="secondary" className="text-xs">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Overridden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {log.contentSnapshot}
                      </p>
                      {log.result?.violations?.[0] && (
                        <p className="text-xs text-orange-500">
                          {log.result.violations[0].category}: {log.result.violations[0].explanation}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {toDateFromSerialized(log.createdAt).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowOverrideDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={() => closeOverrideDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review AI Decision</DialogTitle>
            <DialogDescription>
              Override the AI moderation decision if needed.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded text-sm">
                <p className="font-medium mb-1">Content:</p>
                <p className="text-muted-foreground">{selectedLog.contentSnapshot}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Risk Score</p>
                  <p className="font-medium">
                    {((selectedLog.result?.overallRiskScore || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">AI Decision</p>
                  <p className="font-medium">{selectedLog.result?.recommendedAction || selectedLog.actionTaken}</p>
                </div>
              </div>

              {selectedLog.result?.violations?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Violations Detected:</p>
                  {selectedLog.result.violations.map((v, i: number) => (
                    <div key={i} className="text-sm bg-red-50 dark:bg-red-950 p-2 rounded mb-1">
                      <Badge variant="destructive" className="mb-1">
                        {v.category} ({(v.confidence * 100).toFixed(0)}%)
                      </Badge>
                      <p className="text-muted-foreground">{v.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Override Action</Label>
                <Select value={overrideAction} onValueChange={setOverrideAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve (False Positive)</SelectItem>
                    <SelectItem value="flag_for_review">Keep Flagged</SelectItem>
                    <SelectItem value="auto_warn">Issue Warning</SelectItem>
                    <SelectItem value="auto_remove">Remove Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason for Override</Label>
                <Textarea
                  placeholder="Explain your decision..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeOverrideDialog}>
              Cancel
            </Button>
            <Button onClick={handleOverride} disabled={!overrideReason || processing}>
              {processing ? 'Saving...' : 'Save Override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
