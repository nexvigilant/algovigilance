'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  Plus,
  RefreshCcw,
  Trash2,
  Repeat,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
} from 'lucide-react';
import {
  listScheduledBatches,
  createScheduledBatch,
  cancelScheduledBatch,
  getScheduleStats,
  processDueScheduledBatches,
  type ScheduledBatchListItem,
  type RecurrenceType,
  type ScheduleStatus,
} from './scheduling-actions';
import { getDomainsWithStats, getDomainKSBs, type DomainWithStats } from './actions';
import type { ActivityEngine, JobPriority } from '@/lib/content-orchestrator';
import type { CapabilityComponent } from '@/types/pv-curriculum';

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    scheduled: { variant: 'default', icon: <Clock className="w-3 h-3" /> },
    processing: { variant: 'secondary', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    completed: { variant: 'outline', icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> },
    failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
    cancelled: { variant: 'outline', icon: <AlertCircle className="w-3 h-3 text-amber-500" /> },
  };

  const config = variants[status] || variants.scheduled;

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ============================================================================
// Create Schedule Dialog
// ============================================================================

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function CreateScheduleDialog({ open, onOpenChange, onCreated }: CreateScheduleDialogProps) {
  const [domains, setDomains] = useState<DomainWithStats[]>([]);
  const [ksbs, setKsbs] = useState<CapabilityComponent[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedKsbs, setSelectedKsbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingKsbs, setLoadingKsbs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activityEngine, setActivityEngine] = useState<ActivityEngine>('red_pen');
  const [priority, setPriority] = useState<JobPriority>('normal');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [bypassQualityGates, setBypassQualityGates] = useState(false);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  // Load domains on mount
  useEffect(() => {
    async function loadDomains() {
      setLoading(true);
      const result = await getDomainsWithStats();
      if (result.success && result.domains) {
        setDomains(result.domains);
      }
      setLoading(false);
    }
    if (open) {
      loadDomains();
    }
  }, [open]);

  // Load KSBs when domain changes
  useEffect(() => {
    async function loadKsbs() {
      if (!selectedDomain) {
        setKsbs([]);
        return;
      }
      setLoadingKsbs(true);
      const result = await getDomainKSBs(selectedDomain);
      if (result.success && result.ksbs) {
        // Filter to only show KSBs that need content
        const needsContent = result.ksbs.filter(
          k => !k.hook || !k.concept || !k.activity || !k.reflection
        );
        setKsbs(needsContent);
      }
      setLoadingKsbs(false);
    }
    loadKsbs();
    setSelectedKsbs([]);
    setSelectAll(false);
  }, [selectedDomain]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedKsbs(ksbs.map(k => k.id));
    } else if (selectedKsbs.length === ksbs.length && ksbs.length > 0) {
      // User deselected "all", clear selection
      setSelectedKsbs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAll, ksbs]);

  const handleSubmit = async () => {
    if (!name || !selectedDomain || selectedKsbs.length === 0 || !scheduledDate || !scheduledTime) {
      return;
    }

    setSubmitting(true);

    const domain = domains.find(d => d.id === selectedDomain);
    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    const result = await createScheduledBatch({
      name,
      description: description || undefined,
      domainId: selectedDomain,
      domainName: domain?.name || 'Unknown',
      ksbIds: selectedKsbs,
      activityEngine,
      priority,
      scheduledFor,
      recurrence,
      bypassQualityGates,
      notifyOnComplete,
    });

    setSubmitting(false);

    if (result.success) {
      // Reset form
      setName('');
      setDescription('');
      setSelectedDomain('');
      setSelectedKsbs([]);
      setScheduledDate('');
      setScheduledTime('');
      setRecurrence('none');
      setBypassQualityGates(false);
      setNotifyOnComplete(true);
      onOpenChange(false);
      onCreated();
    }
  };

  // Get minimum date/time (now + 5 minutes)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  const minDate = now.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Schedule Content Generation
          </DialogTitle>
          <DialogDescription>
            Schedule a batch to run automatically at a specific time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name and Description */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Weekly Signal Detection Content"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Notes about this scheduled batch..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Domain Selection */}
          <div className="space-y-2">
            <Label>Domain</Label>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map(domain => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name} ({domain.missingContent} need content)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* KSB Selection */}
          {selectedDomain && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>KSBs to Generate ({selectedKsbs.length} selected)</Label>
                {ksbs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectAll}
                      onCheckedChange={setSelectAll}
                      id="select-all"
                    />
                    <Label htmlFor="select-all" className="text-sm text-muted-foreground">
                      Select all ({ksbs.length})
                    </Label>
                  </div>
                )}
              </div>
              {loadingKsbs ? (
                <Skeleton className="h-32 w-full" />
              ) : ksbs.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
                  All KSBs in this domain have content
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                  {ksbs.map(ksb => (
                    <div
                      key={ksb.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedKsbs.includes(ksb.id)
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedKsbs(prev =>
                          prev.includes(ksb.id)
                            ? prev.filter(id => id !== ksb.id)
                            : [...prev, ksb.id]
                        );
                        setSelectAll(false);
                      }}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedKsbs.includes(ksb.id) ? 'bg-cyan-500 border-cyan-500' : 'border-muted-foreground'
                      }`}>
                        {selectedKsbs.includes(ksb.id) && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm truncate">{ksb.id}: {ksb.itemName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule Configuration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={minDate}
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>Recurrence</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">One-time (no recurrence)</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Engine and Priority */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Activity Engine</Label>
              <Select value={activityEngine} onValueChange={(v) => setActivityEngine(v as ActivityEngine)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red_pen">Red Pen (Error Detection)</SelectItem>
                  <SelectItem value="triage">Triage (Decision Making)</SelectItem>
                  <SelectItem value="synthesis">Synthesis (Create Work)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as JobPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bypass Quality Gates</Label>
                <p className="text-xs text-muted-foreground">
                  Skip quality validation (use for urgent content)
                </p>
              </div>
              <Switch
                checked={bypassQualityGates}
                onCheckedChange={setBypassQualityGates}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notify on Complete</Label>
                <p className="text-xs text-muted-foreground">
                  Send notification when batch finishes
                </p>
              </div>
              <Switch
                checked={notifyOnComplete}
                onCheckedChange={setNotifyOnComplete}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !selectedDomain || selectedKsbs.length === 0 || !scheduledDate || !scheduledTime || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Create Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Scheduling Component
// ============================================================================

export function PipelineScheduling() {
  const [schedules, setSchedules] = useState<ScheduledBatchListItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    scheduled: number;
    completed: number;
    failed: number;
    cancelled: number;
    nextDue?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [processingDue, setProcessingDue] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ScheduleStatus>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [schedulesResult, statsResult] = await Promise.all([
      listScheduledBatches({ status: filter === 'all' ? undefined : filter }),
      getScheduleStats(),
    ]);

    if (schedulesResult.success && schedulesResult.schedules) {
      setSchedules(schedulesResult.schedules);
    }
    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancel = async (scheduleId: string) => {
    setCancellingId(scheduleId);
    const result = await cancelScheduledBatch(scheduleId);
    setCancellingId(null);
    if (result.success) {
      loadData();
    }
  };

  const handleProcessDue = async () => {
    setProcessingDue(true);
    await processDueScheduledBatches();
    setProcessingDue(false);
    loadData();
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRecurrenceLabel = (recurrence: RecurrenceType) => {
    switch (recurrence) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return 'One-time';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">
              {loading ? <Skeleton className="h-8 w-16" /> : stats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">
              {loading ? <Skeleton className="h-8 w-16" /> : stats?.scheduled || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {loading ? <Skeleton className="h-8 w-16" /> : stats?.completed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {loading ? (
                <Skeleton className="h-6 w-24" />
              ) : stats?.nextDue ? (
                formatDateTime(stats.nextDue)
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(value: string) => {
              setFilter(value as 'all' | ScheduleStatus);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schedules</SelectItem>
              <SelectItem value="scheduled">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessDue}
            disabled={processingDue || !stats?.scheduled}
          >
            {processingDue ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Process Due Now
          </Button>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Batch
          </Button>
        </div>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Batches</CardTitle>
          <CardDescription>
            Batches scheduled to run at specific times
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled batches found</p>
              <p className="text-sm">Create a schedule to automate content generation</p>
            </div>
          ) : (
            <Table aria-label="Scheduled content generation batches">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>KSBs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(schedule => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell className="text-muted-foreground">{schedule.domainName}</TableCell>
                    <TableCell>{formatDateTime(schedule.scheduledFor)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {schedule.recurrence !== 'none' && <Repeat className="w-3 h-3" />}
                        {getRecurrenceLabel(schedule.recurrence)}
                      </Badge>
                    </TableCell>
                    <TableCell>{schedule.ksbCount}</TableCell>
                    <TableCell>
                      <StatusBadge status={schedule.status} />
                    </TableCell>
                    <TableCell>
                      {schedule.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(schedule.id)}
                          disabled={cancellingId === schedule.id}
                        >
                          {cancellingId === schedule.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-destructive" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Schedule Dialog */}
      <CreateScheduleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={loadData}
      />
    </div>
  );
}
