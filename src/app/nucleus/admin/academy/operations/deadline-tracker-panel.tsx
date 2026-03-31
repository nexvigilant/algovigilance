'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Loader2,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  getDeadlines,
  getDeadlineStats,
  setDomainDeadline,
  updateDeadline,
  deleteDeadline,
  type ContentDeadline,
  type DeadlineStats,
} from './deadline-actions';
import { getTeamMembers, type TeamMember } from './team-assignments-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/deadline-tracker-panel');

interface DomainOption {
  id: string;
  name: string;
  assigneeId?: string;
  assigneeName?: string;
}

interface DeadlineTrackerPanelProps {
  domains: DomainOption[];
  onRefresh?: () => void;
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function getDeadlineColor(deadline: string, status: string): string {
  if (status === 'completed') return 'text-emerald-400';
  if (status === 'overdue') return 'text-red-400';

  const date = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return 'text-red-400';
  if (diffDays <= 3) return 'text-amber-400';
  if (diffDays <= 7) return 'text-gold';
  return 'text-slate-dim';
}

export function DeadlineTrackerPanel({ domains, onRefresh }: DeadlineTrackerPanelProps) {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<ContentDeadline[]>([]);
  const [stats, setStats] = useState<DeadlineStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [deadlinesRes, statsRes, membersRes] = await Promise.all([
        getDeadlines({ status: 'active' }),
        getDeadlineStats(),
        getTeamMembers(),
      ]);

      if (deadlinesRes.success) {
        setDeadlines(deadlinesRes.deadlines || []);
      }
      if (statsRes.success) {
        setStats(statsRes.stats || null);
      }
      if (membersRes.success) {
        setTeamMembers(membersRes.members || []);
      }
    } catch (error) {
      log.error('Failed to load deadline data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateDeadline() {
    if (!selectedDomain || !deadlineDate || !user) return;

    const domain = domains.find((d) => d.id === selectedDomain);
    if (!domain) return;

    const assignee = teamMembers.find((m) => m.id === assigneeId);

    setSaving(true);
    try {
      const result = await setDomainDeadline({
        domainId: domain.id,
        domainName: domain.name,
        deadline: deadlineDate,
        assigneeId: assignee?.id,
        assigneeName: assignee?.displayName,
        createdBy: user.displayName || user.email || 'Unknown',
        notes: notes || undefined,
      });

      if (result.success) {
        await loadData();
        setShowModal(false);
        resetForm();
        onRefresh?.();
      }
    } catch (error) {
      log.error('Failed to create deadline:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkComplete(deadlineId: string) {
    try {
      const result = await updateDeadline(deadlineId, { status: 'completed' });
      if (result.success) {
        await loadData();
        onRefresh?.();
      }
    } catch (error) {
      log.error('Failed to mark deadline complete:', error);
    }
  }

  async function handleDeleteDeadline(deadlineId: string) {
    if (!confirm('Are you sure you want to delete this deadline?')) return;

    try {
      const result = await deleteDeadline(deadlineId);
      if (result.success) {
        await loadData();
        onRefresh?.();
      }
    } catch (error) {
      log.error('Failed to delete deadline:', error);
    }
  }

  function resetForm() {
    setSelectedDomain('');
    setDeadlineDate('');
    setAssigneeId('');
    setNotes('');
  }

  // Get domains without active deadlines
  const domainsWithoutDeadlines = domains.filter(
    (d) => !deadlines.some((dl) => dl.domainId === d.id && dl.entityType === 'domain')
  );

  const overdueDeadlines = deadlines.filter((d) => d.status === 'overdue');
  const upcomingDeadlines = deadlines.filter((d) => {
    if (d.status !== 'active') return false;
    const date = new Date(d.deadline);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  });

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-slate-light">Deadline Tracker</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(true)}
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Set Deadline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-dim hover:text-cyan"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan" />
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-xs text-slate-dim">Overdue</span>
                  </div>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {stats?.overdue || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-slate-dim">Due Soon</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    {stats?.upcoming || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-slate-dim">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {stats?.completed || 0}
                  </p>
                </div>
              </div>

              {/* Overdue Items */}
              {overdueDeadlines.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Overdue
                  </h4>
                  <div className="space-y-2">
                    {overdueDeadlines.map((deadline) => (
                      <DeadlineItem
                        key={deadline.id}
                        deadline={deadline}
                        onMarkComplete={() => handleMarkComplete(deadline.id)}
                        onDelete={() => handleDeleteDeadline(deadline.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Items */}
              {upcomingDeadlines.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Due This Week
                  </h4>
                  <div className="space-y-2">
                    {upcomingDeadlines.map((deadline) => (
                      <DeadlineItem
                        key={deadline.id}
                        deadline={deadline}
                        onMarkComplete={() => handleMarkComplete(deadline.id)}
                        onDelete={() => handleDeleteDeadline(deadline.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Deadlines Message */}
              {deadlines.length === 0 && (
                <div className="text-center py-6">
                  <Target className="h-8 w-8 text-slate-dim mx-auto mb-2" />
                  <p className="text-sm text-slate-dim">No deadlines set</p>
                  <p className="text-xs text-slate-dim mt-1">
                    Set deadlines to keep your team on track
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}

      {/* Create Deadline Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-nex-surface border-nex-light">
          <DialogHeader>
            <DialogTitle className="text-slate-light">Set Domain Deadline</DialogTitle>
            <DialogDescription className="text-slate-dim">
              Set a completion deadline for a domain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-dim">Domain</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="bg-nex-dark border-nex-light text-slate-light">
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-light">
                  {domainsWithoutDeadlines.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-dim">Deadline Date</Label>
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-nex-dark border-nex-light text-slate-light"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-dim">Assign To (Optional)</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="bg-nex-dark border-nex-light text-slate-light">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-light">
                  <SelectItem value="">No assignment</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-dim">Notes (Optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="bg-nex-dark border-nex-light text-slate-light"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="border-nex-light text-slate-dim"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDeadline}
              disabled={!selectedDomain || !deadlineDate || saving}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Set Deadline'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DeadlineItem({
  deadline,
  onMarkComplete,
  onDelete,
}: {
  deadline: ContentDeadline;
  onMarkComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-3 rounded-lg bg-nex-dark border border-nex-light hover:border-nex-light/80 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-light truncate">
              {deadline.entityName}
            </p>
            {deadline.status === 'overdue' && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs ${getDeadlineColor(deadline.deadline, deadline.status)}`}>
              {formatDeadline(deadline.deadline)}
            </span>
            {deadline.assigneeName && (
              <span className="text-xs text-slate-dim">
                {deadline.assigneeName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkComplete}
            className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            title="Mark complete"
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            title="Delete deadline"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
