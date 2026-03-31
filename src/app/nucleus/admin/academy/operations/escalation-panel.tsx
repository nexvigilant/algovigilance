'use client';

import { useState, useEffect } from 'react';
import {
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import {
  getEscalations,
  getEscalationStats,
  acknowledgeEscalation,
  resolveEscalation,
  dismissEscalation,
  type Escalation,
  type EscalationStats,
  type EscalationLevel,
} from './escalation-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/escalation-panel');

function getLevelColor(level: EscalationLevel): string {
  switch (level) {
    case 'L1':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'L2':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    case 'L3':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
  }
}

// Status colors now resolved by StatusBadge via semantic map
// 'open' maps to amber, 'acknowledged' to amber, 'resolved' to emerald, 'dismissed' to slate

function formatReasonLabel(reason: string): string {
  return reason
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const hours = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

export function EscalationPanel() {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [stats, setStats] = useState<EscalationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Action modal state
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [actionType, setActionType] = useState<'resolve' | 'dismiss' | null>(null);
  const [resolution, setResolution] = useState('');
  const [processing, setProcessing] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [escalationsRes, statsRes] = await Promise.all([
        getEscalations({ status: 'open' }),
        getEscalationStats(),
      ]);

      if (escalationsRes.success) {
        // Also get acknowledged escalations
        const acknowledgedRes = await getEscalations({ status: 'acknowledged' });
        const allEscalations = [
          ...(escalationsRes.escalations || []),
          ...(acknowledgedRes.escalations || []),
        ];
        // Sort by level (L3 first) then by date
        allEscalations.sort((a, b) => {
          const levelOrder = { L3: 0, L2: 1, L1: 2 };
          if (levelOrder[a.level] !== levelOrder[b.level]) {
            return levelOrder[a.level] - levelOrder[b.level];
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setEscalations(allEscalations);
      }
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (error) {
      log.error('Failed to load escalation data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAcknowledge(escalationId: string) {
    if (!user) return;
    try {
      const result = await acknowledgeEscalation(escalationId, user.uid);
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      log.error('Failed to acknowledge escalation:', error);
    }
  }

  async function handleAction() {
    if (!selectedEscalation || !actionType || !user) return;

    setProcessing(true);
    try {
      if (actionType === 'resolve') {
        await resolveEscalation(selectedEscalation.id, resolution, user.uid);
      } else {
        await dismissEscalation(selectedEscalation.id, resolution, user.uid);
      }
      await loadData();
      setSelectedEscalation(null);
      setActionType(null);
      setResolution('');
    } catch (error) {
      log.error('Failed to process escalation action:', error);
    } finally {
      setProcessing(false);
    }
  }

  const criticalCount = escalations.filter((e) => e.level === 'L3' && e.status === 'open').length;

  return (
    <Card className={`bg-nex-surface ${criticalCount > 0 ? 'border-red-500/50' : 'border-nex-light'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className={`h-5 w-5 ${criticalCount > 0 ? 'text-red-400' : 'text-orange-400'}`} />
            <CardTitle className="text-slate-light">Escalations</CardTitle>
            {stats && (stats.open + stats.acknowledged) > 0 && (
              <Badge
                variant="secondary"
                className={criticalCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}
              >
                {stats.open + stats.acknowledged} active
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-dim hover:text-cyan"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-slate-dim">Open</span>
                </div>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {stats?.open || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-slate-dim">Acknowledged</span>
                </div>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {stats?.acknowledged || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-slate-dim" />
                  <span className="text-xs text-slate-dim">L3 Critical</span>
                </div>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {stats?.byLevel.L3 || 0}
                </p>
              </div>
            </div>

            {/* Level Breakdown */}
            {expanded && stats && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-amber-500/10 text-center">
                  <p className="text-sm font-bold text-amber-400">L1</p>
                  <p className="text-xs text-slate-dim">{stats.byLevel.L1}</p>
                </div>
                <div className="p-2 rounded bg-orange-500/10 text-center">
                  <p className="text-sm font-bold text-orange-400">L2</p>
                  <p className="text-xs text-slate-dim">{stats.byLevel.L2}</p>
                </div>
                <div className="p-2 rounded bg-red-500/10 text-center">
                  <p className="text-sm font-bold text-red-400">L3</p>
                  <p className="text-xs text-slate-dim">{stats.byLevel.L3}</p>
                </div>
              </div>
            )}

            {/* Escalation List */}
            {expanded && escalations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-light">Active Escalations</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {escalations.map((escalation) => (
                      <div
                        key={escalation.id}
                        className="p-3 rounded-lg bg-nex-dark border border-nex-light"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={getLevelColor(escalation.level)}>
                                {escalation.level}
                              </Badge>
                              <StatusBadge status={escalation.status} />
                            </div>
                            <p className="text-sm font-medium text-slate-light truncate">
                              {escalation.entityName}
                            </p>
                            <p className="text-xs text-slate-dim">
                              {formatReasonLabel(escalation.reason)}
                              {escalation.daysOverdue && ` • ${escalation.daysOverdue}d overdue`}
                            </p>
                            <p className="text-xs text-slate-dim mt-1">
                              To: {escalation.escalatedToName} • {formatTimeAgo(escalation.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            {escalation.status === 'open' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAcknowledge(escalation.id)}
                                className="h-7 text-xs text-cyan hover:text-cyan-dark"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ack
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEscalation(escalation);
                                setActionType('resolve');
                              }}
                              className="h-7 text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Empty State */}
            {escalations.length === 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-dim">No active escalations</p>
                <p className="text-xs text-slate-dim mt-1">
                  Everything is running smoothly
                </p>
              </div>
            )}

            {/* Collapsed Quick View */}
            {!expanded && escalations.length > 0 && (
              <div className="space-y-2">
                {escalations.slice(0, 2).map((escalation) => (
                  <div
                    key={escalation.id}
                    className="flex items-center justify-between p-2 rounded bg-nex-dark/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getLevelColor(escalation.level)}>
                        {escalation.level}
                      </Badge>
                      <span className="text-sm text-slate-light truncate max-w-[150px]">
                        {escalation.entityName}
                      </span>
                    </div>
                    <span className="text-xs text-slate-dim">
                      {formatTimeAgo(escalation.createdAt)}
                    </span>
                  </div>
                ))}
                {escalations.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(true)}
                    className="w-full text-xs text-slate-dim hover:text-cyan"
                  >
                    +{escalations.length - 2} more
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Resolve/Dismiss Modal */}
      <Dialog
        open={!!selectedEscalation && !!actionType}
        onOpenChange={() => {
          setSelectedEscalation(null);
          setActionType(null);
          setResolution('');
        }}
      >
        <DialogContent className="bg-nex-surface border-nex-light">
          <DialogHeader>
            <DialogTitle className="text-slate-light flex items-center gap-2">
              {actionType === 'resolve' ? (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-slate-dim" />
              )}
              {actionType === 'resolve' ? 'Resolve Escalation' : 'Dismiss Escalation'}
            </DialogTitle>
            <DialogDescription className="text-slate-dim">
              {selectedEscalation?.entityName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-dim">
                {actionType === 'resolve' ? 'Resolution' : 'Dismissal Reason'}
              </Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={
                  actionType === 'resolve'
                    ? 'Describe how this was resolved...'
                    : 'Reason for dismissal...'
                }
                className="bg-nex-dark border-nex-light text-slate-light min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEscalation(null);
                setActionType(null);
                setResolution('');
              }}
              className="border-nex-light text-slate-dim"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={!resolution.trim() || processing}
              className={
                actionType === 'resolve'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-slate-500 text-white hover:bg-slate-400'
              }
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === 'resolve' ? (
                'Resolve'
              ) : (
                'Dismiss'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
