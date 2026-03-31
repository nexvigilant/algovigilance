'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Users,
  Clock,
  CheckCircle,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Download,
  Mail,
  Bell,
  XCircle,
  UserPlus,
} from 'lucide-react';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { useToast } from '@/hooks/use-toast';
import {
  getWaitlistEntries,
  updateEntryStatus,
  updateEntryNotes,
  deleteEntry,
  bulkUpdateStatus,
  bulkDeleteEntries,
  exportWaitlistToCSV,
} from './actions';
import { statusLabels, type WaitlistEntry } from './constants';
import { formatDistanceToNow } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

// Status colors now resolved by StatusBadge via semantic map

export function WaitlistClient() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWaitlistEntries();
      if (result.success && result.entries) {
        setEntries(result.entries);
      } else {
        setError(result.error || 'Failed to load waitlist');
        toast({ title: result.error || 'Failed to load waitlist', variant: 'destructive' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({ title: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: WaitlistEntry['status']) => {
    const result = await updateEntryStatus(id, status);
    if (result.success) {
      toast({ title: `Status updated to ${statusLabels[status]}`, variant: 'success' });
      await loadEntries();
    } else {
      toast({ title: result.error || 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleSaveNotes = async () => {
    if (selectedEntry) {
      setIsSaving(true);
      try {
        const result = await updateEntryNotes(selectedEntry.id, notes);
        if (result.success) {
          toast({ title: 'Notes saved', variant: 'success' });
          await loadEntries();
          setSelectedEntry(null);
        } else {
          toast({ title: result.error || 'Failed to save notes', variant: 'destructive' });
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      const result = await deleteEntry(id);
      if (result.success) {
        toast({ title: 'Entry deleted', variant: 'success' });
        await loadEntries();
      } else {
        toast({ title: result.error || 'Failed to delete entry', variant: 'destructive' });
      }
    }
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntries.map(entry => entry.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStatusUpdate = async (status: WaitlistEntry['status']) => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Update ${selectedIds.size} entry(ies) to "${statusLabels[status]}"?`)) return;

    setIsBulkProcessing(true);
    try {
      const result = await bulkUpdateStatus(Array.from(selectedIds), status);
      if (result.success) {
        toast({ title: `Updated ${result.updated} entry(ies) to ${statusLabels[status]}`, variant: 'success' });
        setSelectedIds(new Set());
        await loadEntries();
      } else {
        toast({ title: result.error || 'Failed to update entries', variant: 'destructive' });
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Delete ${selectedIds.size} entry(ies)? This cannot be undone.`)) return;

    setIsBulkProcessing(true);
    try {
      const result = await bulkDeleteEntries(Array.from(selectedIds));
      if (result.success) {
        toast({ title: `Deleted ${result.deleted} entry(ies)`, variant: 'success' });
        setSelectedIds(new Set());
        await loadEntries();
      } else {
        toast({ title: result.error || 'Failed to delete entries', variant: 'destructive' });
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportWaitlistToCSV(
        statusFilter as WaitlistEntry['status'] | 'all'
      );

      if (result.success && result.csv && result.filename) {
        // Create and download the CSV file
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: `Exported ${result.filename}`, variant: 'success' });
      } else {
        toast({ title: result.error || 'Failed to export CSV', variant: 'destructive' });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const openEntryDetails = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setNotes(entry.notes || '');
  };

  // Filter and sort
  const filteredEntries = entries
    .filter((entry) => {
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = a.joinedAt?.getTime() || 0;
      const dateB = b.joinedAt?.getTime() || 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Stats
  const pendingCount = entries.filter((e) => e.status === 'pending').length;
  const invitedCount = entries.filter((e) => e.status === 'invited').length;
  const activatedCount = entries.filter((e) => e.status === 'activated').length;

  if (loading) {
    return <VoiceLoading context="admin" variant="spinner" message="Loading waitlist..." />;
  }

  if (error) {
    return (
      <Card className="bg-nex-surface border-nex-light">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Waitlist</h3>
            <p className="text-slate-dim mb-4 max-w-md">{error}</p>
            <Button onClick={loadEntries} className="bg-cyan text-nex-deep hover:bg-cyan-glow">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total</CardTitle>
            <Users className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{entries.length}</div>
            <p className="text-xs text-slate-dim">founding members</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Pending</CardTitle>
            <Clock className="h-4 w-4 text-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan">{pendingCount}</div>
            <p className="text-xs text-slate-dim">awaiting invite</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Invited</CardTitle>
            <Mail className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{invitedCount}</div>
            <p className="text-xs text-slate-dim">invitation sent</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Activated</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{activatedCount}</div>
            <p className="text-xs text-slate-dim">active members</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-white">Founding Member Waitlist</CardTitle>
              <CardDescription className="text-slate-dim">
                Manage waitlist signups and founding memberships
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-nex-dark border-nex-border text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-border">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-white">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="border-nex-border bg-cyan/10 text-cyan"
              >
                Date
                {sortOrder === 'desc' ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronUp className="ml-1 h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="border-nex-border text-slate-light hover:text-cyan"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 p-3 rounded-lg bg-cyan/10 border border-cyan/30">
              <span className="text-sm text-cyan font-medium">
                {selectedIds.size} selected
              </span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('invited')}
                disabled={isBulkProcessing}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Mail className="h-4 w-4 mr-1" />
                Invite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('activated')}
                disabled={isBulkProcessing}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('declined')}
                disabled={isBulkProcessing}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDelete}
                disabled={isBulkProcessing}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                disabled={isBulkProcessing}
                className="text-slate-dim"
              >
                Clear
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <VoiceEmptyState
              context="admin-leads"
              title="No waitlist entries found"
              description="Waitlist signups will appear here"
              variant="inline"
              size="md"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Waitlist entries">
                <TableHeader>
                  <TableRow className="border-nex-border hover:bg-transparent">
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.size === filteredEntries.length && filteredEntries.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all entries"
                        className="border-nex-border data-[state=checked]:bg-cyan data-[state=checked]:border-cyan"
                      />
                    </TableHead>
                    <TableHead className="text-slate-dim">Status</TableHead>
                    <TableHead className="text-slate-dim">Email</TableHead>
                    <TableHead className="text-slate-dim">Source</TableHead>
                    <TableHead className="text-slate-dim">Notifications</TableHead>
                    <TableHead className="text-slate-dim">Joined</TableHead>
                    <TableHead className="text-right text-slate-dim">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={`border-nex-border hover:bg-nex-light/50 cursor-pointer ${selectedIds.has(entry.id) ? 'bg-cyan/10' : ''}`}
                      onClick={() => openEntryDetails(entry)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                          aria-label={`Select ${entry.email}`}
                          className="border-nex-border data-[state=checked]:bg-cyan data-[state=checked]:border-cyan"
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={entry.status}
                          label={statusLabels[entry.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${entry.email}`} className="text-cyan hover:underline" onClick={(e) => e.stopPropagation()}>
                          {entry.email}
                        </a>
                      </TableCell>
                      <TableCell className="text-slate-light">{entry.source}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {entry.notifications.platformUpdates && (
                            <Badge variant="outline" className="border-nex-border text-slate-dim text-xs">Updates</Badge>
                          )}
                          {entry.notifications.newReleases && (
                            <Badge variant="outline" className="border-nex-border text-slate-dim text-xs">Releases</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-dim">
                        {entry.joinedAt ? formatDistanceToNow(entry.joinedAt, { addSuffix: true }) : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEntryDetails(entry)} className="text-slate-dim hover:text-cyan">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-slate-dim hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="bg-nex-surface border-nex-light max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selectedEntry.email}</DialogTitle>
                <DialogDescription className="text-slate-dim">
                  Founding Member | {selectedEntry.source}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status Update */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-light">Status:</span>
                  <Select
                    value={selectedEntry.status}
                    onValueChange={(value) => handleStatusChange(selectedEntry.id, value as WaitlistEntry['status'])}
                  >
                    <SelectTrigger className="w-[150px] bg-nex-dark border-nex-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-nex-surface border-nex-border">
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-white">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notification Preferences */}
                <div className="p-4 rounded-lg bg-nex-dark">
                  <p className="text-xs text-slate-dim mb-2">Notification Preferences</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.notifications.platformUpdates && (
                      <Badge className="bg-cyan/20 text-cyan border-cyan/30">
                        <Bell className="h-3 w-3 mr-1" />
                        Platform Updates
                      </Badge>
                    )}
                    {selectedEntry.notifications.newReleases && (
                      <Badge className="bg-cyan/20 text-cyan border-cyan/30">
                        <Bell className="h-3 w-3 mr-1" />
                        New Releases
                      </Badge>
                    )}
                    {selectedEntry.notifications.importantChanges && (
                      <Badge className="bg-cyan/20 text-cyan border-cyan/30">
                        <Bell className="h-3 w-3 mr-1" />
                        Important Changes
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Access Code */}
                {selectedEntry.accessCode && (
                  <div className="p-4 rounded-lg bg-nex-dark">
                    <p className="text-xs text-slate-dim">Access Code</p>
                    <p className="text-gold font-mono">{selectedEntry.accessCode}</p>
                    {selectedEntry.accessCodeGeneratedAt && (
                      <p className="text-xs text-slate-dim mt-1">
                        Generated {formatDistanceToNow(selectedEntry.accessCodeGeneratedAt, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <p className="text-sm font-medium text-slate-light mb-2">Internal Notes</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this entry..."
                    className="bg-nex-dark border-nex-border text-white min-h-[100px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedEntry(null)} className="border-nex-border text-slate-light" disabled={isSaving}>Close</Button>
                <Button onClick={handleSaveNotes} className="bg-cyan text-nex-deep hover:bg-cyan-glow" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Notes'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
