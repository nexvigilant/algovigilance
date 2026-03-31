'use client';

import { useState, useEffect } from 'react';
import {
  CalendarClock,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import {
  getScheduledPublishes,
  getScheduledPublishStats,
  cancelScheduledPublish,
  quickSchedulePublish,
  type ScheduledPublish,
  type ScheduledPublishStats,
} from './scheduled-publishing-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/scheduled-publishing-panel');

interface ContentItem {
  domainId: string;
  domainName: string;
  ksbId: string;
  ksbName: string;
}

interface ScheduledPublishingPanelProps {
  selectedItems?: ContentItem[];
  onScheduleCreated?: () => void;
}

function formatScheduledTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Status colors resolved by StatusBadge semantic map

export function ScheduledPublishingPanel({
  selectedItems = [],
  onScheduleCreated,
}: ScheduledPublishingPanelProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduledPublish[]>([]);
  const [stats, setStats] = useState<ScheduledPublishStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [scheduleType, setScheduleType] = useState<'quick' | 'custom'>('quick');
  const [quickOption, setQuickOption] = useState<'in_1_hour' | 'end_of_day' | 'tomorrow_morning' | 'next_week'>('tomorrow_morning');
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [schedulesRes, statsRes] = await Promise.all([
        getScheduledPublishes({ status: 'pending' }),
        getScheduledPublishStats(),
      ]);

      if (schedulesRes.success) {
        setSchedules(schedulesRes.schedules || []);
      }
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (error) {
      log.error('Failed to load scheduled publishes:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleQuickSchedule() {
    if (!user || selectedItems.length === 0) return;

    setSaving(true);
    try {
      const result = await quickSchedulePublish({
        items: selectedItems,
        when: quickOption,
        scheduledBy: user.uid,
        scheduledByName: user.displayName || user.email || 'Unknown',
      });

      if (result.success) {
        await loadData();
        setShowModal(false);
        onScheduleCreated?.();
      }
    } catch (error) {
      log.error('Failed to create schedule:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSchedule(scheduleId: string) {
    if (!confirm('Are you sure you want to cancel this scheduled publish?')) return;

    try {
      const result = await cancelScheduledPublish(scheduleId);
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      log.error('Failed to cancel schedule:', error);
    }
  }

  const pendingSchedules = schedules.filter((s) => s.status === 'pending');

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-violet-400" />
            <CardTitle className="text-slate-light">Scheduled Publishing</CardTitle>
            {stats && stats.pending > 0 && (
              <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">
                {stats.pending} pending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
                className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Schedule ({selectedItems.length})
              </Button>
            )}
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

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-slate-dim">Pending</span>
                </div>
                <p className="text-2xl font-bold text-violet-400 mt-1">
                  {stats?.pending || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-dim">Today</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {stats?.completedToday || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-slate-dim">This Week</span>
                </div>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {stats?.scheduledThisWeek || 0}
                </p>
              </div>
            </div>

            {expanded && pendingSchedules.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-light">Upcoming</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {pendingSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-3 rounded-lg bg-nex-dark border border-nex-light"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={schedule.status} />
                              <span className="text-xs text-slate-dim">
                                {schedule.items.length} item{schedule.items.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-violet-400 mt-1">
                              {formatScheduledTime(schedule.scheduledFor)}
                            </p>
                            <p className="text-xs text-slate-dim mt-0.5">
                              By {schedule.scheduledByName}
                            </p>
                            {schedule.items.length <= 3 && (
                              <div className="mt-2 space-y-1">
                                {schedule.items.map((item) => (
                                  <p key={`${item.domainId}-${item.ksbId}`} className="text-xs text-slate-dim truncate">
                                    {item.ksbName}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelSchedule(schedule.id)}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {!expanded && pendingSchedules.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-dim">Next scheduled:</p>
                <div className="flex items-center justify-between p-2 rounded bg-nex-dark/50">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-slate-light">
                      {formatScheduledTime(pendingSchedules[0].scheduledFor)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-dim">
                    {pendingSchedules[0].items.length} items
                  </span>
                </div>
              </div>
            )}

            {pendingSchedules.length === 0 && (
              <div className="text-center py-4">
                <CalendarClock className="h-8 w-8 text-slate-dim mx-auto mb-2" />
                <p className="text-sm text-slate-dim">No scheduled publishes</p>
                <p className="text-xs text-slate-dim mt-1">
                  Select items from the review queue to schedule
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Schedule Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-nex-surface border-nex-light">
          <DialogHeader>
            <DialogTitle className="text-slate-light flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-violet-400" />
              Schedule Publishing
            </DialogTitle>
            <DialogDescription className="text-slate-dim">
              Schedule {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} for publishing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Items Preview */}
            <div className="space-y-2">
              <Label className="text-slate-dim">Items to publish</Label>
              <div className="max-h-[120px] overflow-y-auto space-y-1 p-2 rounded bg-nex-dark border border-nex-light">
                {selectedItems.map((item) => (
                  <p key={`${item.domainId}-${item.ksbId}`} className="text-xs text-slate-light truncate">
                    {item.ksbName}
                  </p>
                ))}
              </div>
            </div>

            {/* Schedule Type */}
            <div className="space-y-2">
              <Label className="text-slate-dim">When to publish</Label>
              <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as 'quick' | 'custom')}>
                <SelectTrigger className="bg-nex-dark border-nex-light text-slate-light">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-light">
                  <SelectItem value="quick">Quick Schedule</SelectItem>
                  <SelectItem value="custom">Custom Date/Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType === 'quick' ? (
              <div className="space-y-2">
                <Label className="text-slate-dim">Quick Options</Label>
                <Select value={quickOption} onValueChange={(v) => setQuickOption(v as typeof quickOption)}>
                  <SelectTrigger className="bg-nex-dark border-nex-light text-slate-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-nex-surface border-nex-light">
                    <SelectItem value="in_1_hour">In 1 Hour</SelectItem>
                    <SelectItem value="end_of_day">End of Day (5 PM)</SelectItem>
                    <SelectItem value="tomorrow_morning">Tomorrow Morning (9 AM)</SelectItem>
                    <SelectItem value="next_week">Next Week (Monday 9 AM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-slate-dim">Date and Time</Label>
                <Input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="bg-nex-dark border-nex-light text-slate-light"
                />
              </div>
            )}
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
              onClick={handleQuickSchedule}
              disabled={saving || (scheduleType === 'custom' && !customDateTime)}
              className="bg-violet-500 text-white hover:bg-violet-400"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
