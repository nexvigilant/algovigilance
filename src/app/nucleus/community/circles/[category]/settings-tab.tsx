'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bell,
  Copy,
  Download,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  duplicateYear,
  exportMembers,
  getGCalAuthUrl,
  getGCalConnection,
  disconnectGCal,
  syncGCal,
  type NotificationPreferences,
  type NotificationFrequency,
  type DuplicateYearResult,
  type ExportResult,
  type GCalConnection,
  type GCalSyncResult,
} from '@/lib/api/circles-org-api';
import { useAuth } from '@/hooks/use-auth';

// ── Notification Preferences ──────────────────

const FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  immediate: 'Immediate',
  daily_digest: 'Daily Digest',
  weekly_digest: 'Weekly Digest',
  off: 'Off',
};

const PREF_CATEGORIES = [
  { key: 'announcements' as const, label: 'Announcements', description: 'Org-wide and role-targeted announcements' },
  { key: 'task_reminders' as const, label: 'Task Reminders', description: 'Deadline warnings and task assignments' },
  { key: 'event_reminders' as const, label: 'Event Reminders', description: 'Upcoming events and RSVP prompts' },
  { key: 'attendance_reminders' as const, label: 'Attendance', description: 'Meeting check-in reminders' },
  { key: 'transition_updates' as const, label: 'Transitions', description: 'Officer handoff progress updates' },
];

function NotificationPrefsCard({ circleId }: { circleId: string }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    void (async () => {
      setLoading(true);
      const res = await getNotificationPreferences(circleId, user.uid);
      if (res.success && res.data) setPrefs(res.data);
      setLoading(false);
    })();
  }, [circleId, user?.uid]);

  const handleChange = async (category: keyof Pick<NotificationPreferences, 'announcements' | 'task_reminders' | 'event_reminders' | 'attendance_reminders' | 'transition_updates'>, frequency: NotificationFrequency) => {
    if (!user?.uid || !prefs) return;
    setSaving(true);
    const res = await updateNotificationPreferences(circleId, user.uid, {
      [category]: { frequency },
    });
    if (res.success && res.data) {
      setPrefs(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  if (loading) {
    return <Card className="h-48 animate-pulse border border-nex-light bg-nex-surface" />;
  }

  return (
    <Card className="border border-nex-light bg-nex-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Bell className="h-4 w-4 text-cyan" />
          Notification Preferences
        </h3>
        {saved && (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Saved
          </Badge>
        )}
      </div>
      <div className="space-y-3">
        {PREF_CATEGORIES.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-white">{label}</p>
              <p className="text-[10px] text-cyan-soft/40">{description}</p>
            </div>
            <Select
              value={prefs?.[key]?.frequency ?? 'immediate'}
              onValueChange={(v) => void handleChange(key, v as NotificationFrequency)}
              disabled={saving}
            >
              <SelectTrigger className="h-8 w-36 shrink-0 border-nex-light bg-nex-deep text-xs text-cyan-soft/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(FREQUENCY_LABELS) as [NotificationFrequency, string][]).map(([value, lbl]) => (
                  <SelectItem key={value} value={value} className="text-xs">{lbl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Year-to-Year Duplication ──────────────────

function DuplicateYearCard({ circleId }: { circleId: string }) {
  const { user } = useAuth();
  const [sourceYear, setSourceYear] = useState(String(new Date().getFullYear() - 1));
  const [targetYear, setTargetYear] = useState(String(new Date().getFullYear()));
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeCalendar, setIncludeCalendar] = useState(true);
  const [includeDocs, setIncludeDocs] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DuplicateYearResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDuplicate = async () => {
    if (!user?.uid) return;
    setRunning(true);
    setError(null);
    setResult(null);
    const res = await duplicateYear(circleId, {
      source_year: sourceYear,
      target_year: targetYear,
      include_tasks: includeTasks,
      include_events: includeEvents,
      include_calendar: includeCalendar,
      include_document_structure: includeDocs,
      created_by: user.uid,
    });
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.error ?? 'Duplication failed');
    }
    setRunning(false);
  };

  return (
    <Card className="border border-nex-light bg-nex-surface p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Copy className="h-4 w-4 text-cyan" />
        Year-to-Year Duplication
      </h3>
      <p className="mb-3 text-xs text-cyan-soft/50">
        Copy recurring tasks, event templates, calendar entries, and folder structures to the new academic year.
      </p>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-medium text-cyan-soft/50">From Year</label>
          <Input
            value={sourceYear}
            onChange={(e) => setSourceYear(e.target.value)}
            className="border-nex-light bg-nex-deep text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium text-cyan-soft/50">To Year</label>
          <Input
            value={targetYear}
            onChange={(e) => setTargetYear(e.target.value)}
            className="border-nex-light bg-nex-deep text-sm text-white"
          />
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {[
          { label: 'Recurring Tasks', checked: includeTasks, onChange: setIncludeTasks },
          { label: 'Event Templates', checked: includeEvents, onChange: setIncludeEvents },
          { label: 'Calendar Entries', checked: includeCalendar, onChange: setIncludeCalendar },
          { label: 'Document Folders', checked: includeDocs, onChange: setIncludeDocs },
        ].map(({ label, checked, onChange }) => (
          <label key={label} className="flex items-center gap-2 text-xs text-cyan-soft/70">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 rounded border-nex-light bg-nex-deep accent-cyan"
            />
            {label}
          </label>
        ))}
      </div>

      {result && (
        <div className="mb-3 rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <CheckCircle2 className="mb-1 inline h-4 w-4" /> Duplicated {result.source_year} → {result.target_year}:
          {result.tasks_copied > 0 && ` ${result.tasks_copied} tasks,`}
          {result.events_copied > 0 && ` ${result.events_copied} events,`}
          {result.calendar_entries_copied > 0 && ` ${result.calendar_entries_copied} calendar entries,`}
          {result.document_folders_copied > 0 && ` ${result.document_folders_copied} folders`}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertTriangle className="inline h-3.5 w-3.5" /> {error}
        </div>
      )}

      <Button
        onClick={() => void handleDuplicate()}
        disabled={running || sourceYear === targetYear}
        className="w-full bg-cyan-dark text-white hover:bg-cyan-dark/80"
      >
        {running ? 'Duplicating...' : `Copy ${sourceYear} → ${targetYear}`}
      </Button>
    </Card>
  );
}

// ── Export Members ─────────────────────────────

function ExportMembersCard({ circleId }: { circleId: string }) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [includeEngagement, setIncludeEngagement] = useState(true);
  const [includeAlumni, setIncludeAlumni] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const res = await exportMembers(circleId, {
      format,
      include_engagement: includeEngagement,
      include_alumni: includeAlumni,
    });
    if (res.success && res.data) {
      // Trigger download
      const blob = new Blob([res.data.data], { type: res.data.mime_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  return (
    <Card className="border border-nex-light bg-nex-surface p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <FileSpreadsheet className="h-4 w-4 text-cyan" />
        Export Members
      </h3>

      <div className="mb-3 space-y-2">
        <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
          <SelectTrigger className="border-nex-light bg-nex-deep text-sm text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV (spreadsheet)</SelectItem>
            <SelectItem value="json">JSON (developer)</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-2 text-xs text-cyan-soft/70">
          <input
            type="checkbox"
            checked={includeEngagement}
            onChange={(e) => setIncludeEngagement(e.target.checked)}
            className="h-4 w-4 rounded border-nex-light bg-nex-deep accent-cyan"
          />
          Include engagement metrics
        </label>
        <label className="flex items-center gap-2 text-xs text-cyan-soft/70">
          <input
            type="checkbox"
            checked={includeAlumni}
            onChange={(e) => setIncludeAlumni(e.target.checked)}
            className="h-4 w-4 rounded border-nex-light bg-nex-deep accent-cyan"
          />
          Include alumni
        </label>
      </div>

      <Button
        onClick={() => void handleExport()}
        disabled={exporting}
        className="w-full bg-cyan-dark text-white hover:bg-cyan-dark/80"
      >
        <Download className="mr-1.5 h-4 w-4" />
        {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
      </Button>
    </Card>
  );
}

// ── Google Calendar Sync ──────────────────────

function GCalSyncCard({ circleId }: { circleId: string }) {
  const { user } = useAuth();
  const [connection, setConnection] = useState<GCalConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<GCalSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    void (async () => {
      setLoading(true);
      const res = await getGCalConnection(circleId, user.uid);
      if (res.success && res.data) setConnection(res.data);
      setLoading(false);
    })();
  }, [circleId, user?.uid]);

  const handleConnect = async () => {
    setError(null);
    const res = await getGCalAuthUrl(circleId);
    if (res.success && res.data) {
      // Redirect to Google consent screen
      window.location.href = res.data;
    } else {
      setError(res.error ?? 'Failed to get auth URL. Ensure GCAL_CLIENT_ID is configured.');
    }
  };

  const handleDisconnect = async () => {
    const res = await disconnectGCal(circleId);
    if (res.success && res.data) {
      setConnection(res.data);
      setSyncResult(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    const res = await syncGCal(circleId);
    if (res.success && res.data) {
      setSyncResult(res.data);
      // Refresh connection status
      if (user?.uid) {
        const connRes = await getGCalConnection(circleId, user.uid);
        if (connRes.success && connRes.data) setConnection(connRes.data);
      }
    } else {
      setError(res.error ?? 'Sync failed');
    }
    setSyncing(false);
  };

  if (loading) {
    return <Card className="h-40 animate-pulse border border-nex-light bg-nex-surface" />;
  }

  const isConnected = connection?.status === 'connected' || connection?.status === 'syncing';

  return (
    <Card className="border border-nex-light bg-nex-surface p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Calendar className="h-4 w-4 text-cyan" />
        Google Calendar Sync
      </h3>

      {isConnected ? (
        <div className="space-y-3">
          {/* Connected status */}
          <div className="flex items-center justify-between rounded border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Connected
              </p>
              <p className="mt-0.5 text-xs text-cyan-soft/40">{connection?.google_email}</p>
              {connection?.last_sync_at && (
                <p className="text-[10px] text-cyan-soft/30">
                  Last sync: {new Date(connection.last_sync_at).toLocaleString()}
                </p>
              )}
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
              {connection?.status}
            </Badge>
          </div>

          {/* Sync result */}
          {syncResult && (
            <div className="rounded border border-cyan/20 bg-cyan/5 p-3 text-xs">
              <p className="text-cyan">
                Synced: {syncResult.pushed} pushed, {syncResult.pulled} pulled
              </p>
              {syncResult.errors.length > 0 && (
                <div className="mt-1 text-amber-400">
                  {syncResult.errors.slice(0, 3).map((e, i) => (
                    <p key={i} className="text-[10px]">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sync errors from connection */}
          {connection?.sync_errors && connection.sync_errors.length > 0 && !syncResult && (
            <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] text-amber-400">
              {connection.sync_errors.slice(0, 2).map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => void handleSync()}
              disabled={syncing}
              className="flex-1 bg-cyan-dark text-white hover:bg-cyan-dark/80"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleDisconnect()}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Disconnect
            </Button>
          </div>

          <p className="text-[10px] text-cyan-soft/30">
            Two-way sync: org events push to your Google Calendar, and GCal events pull into the circle calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-cyan-soft/50">
            Connect your Google Calendar to sync events and deadlines between your org and your personal calendar.
          </p>

          {error && (
            <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
              <AlertTriangle className="inline h-3.5 w-3.5" /> {error}
            </div>
          )}

          <Button
            onClick={() => void handleConnect()}
            className="w-full bg-white text-black hover:bg-gray-100"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Connect Google Calendar
          </Button>
        </div>
      )}
    </Card>
  );
}

// ── Main Settings Tab ─────────────────────────

interface SettingsTabProps {
  circleId: string;
}

export function SettingsTab({ circleId }: SettingsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <NotificationPrefsCard circleId={circleId} />
        <GCalSyncCard circleId={circleId} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ExportMembersCard circleId={circleId} />
        <DuplicateYearCard circleId={circleId} />
      </div>
    </div>
  );
}
