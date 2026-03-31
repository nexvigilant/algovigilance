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
  GraduationCap,
  Briefcase,
  TrendingUp,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  CheckCircle,
  Linkedin,
  AlertCircle,
  RefreshCw,
  Download,
  CheckCheck,
  XCircle,
  Clock,
  UserPlus,
} from 'lucide-react';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { useToast } from '@/hooks/use-toast';
import {
  getAffiliateApplications,
  updateApplicationStatus,
  updateApplicationNotes,
  markApplicationAsRead,
  deleteApplication,
  bulkUpdateApplicationStatus,
  bulkDeleteApplications,
  exportApplicationsToCSV,
  type AffiliateApplication,
} from './actions';
import {
  statusLabels,
  expertiseLabels,
  programOfStudyLabels,
  currentRoleLabels,
  consultingInterestLabels,
} from '@/lib/schemas/affiliate';
import { formatDistanceToNow } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400 bg-green-400/10';
  if (score >= 60) return 'text-cyan bg-cyan/10';
  if (score >= 40) return 'text-amber-400 bg-amber-400/10';
  return 'text-slate-dim bg-nex-light';
}

// Status colors resolved by StatusBadge semantic map

function getProgramBadge(programType: 'ambassador' | 'advisor') {
  if (programType === 'advisor') {
    return (
      <Badge className="bg-gold/20 text-gold border-gold/30">
        <Briefcase className="h-3 w-3 mr-1" />
        Advisor
      </Badge>
    );
  }
  return (
    <Badge className="bg-cyan/20 text-cyan border-cyan/30">
      <GraduationCap className="h-3 w-3 mr-1" />
      Ambassador
    </Badge>
  );
}

export function AffiliateApplicationsClient() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedApplication, setSelectedApplication] = useState<AffiliateApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAffiliateApplications();
      if (result.success && result.applications) {
        setApplications(result.applications);
      } else {
        setError(result.error || 'Failed to load applications');
        toast({ title: result.error || 'Failed to load applications', variant: 'destructive' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({ title: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: AffiliateApplication['status']) => {
    const result = await updateApplicationStatus(id, status);
    if (result.success) {
      toast({ title: `Status updated to ${statusLabels[status]}`, variant: 'success' });
      await loadApplications();
    } else {
      toast({ title: result.error || 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const result = await markApplicationAsRead(id);
    if (result.success) {
      await loadApplications();
    }
    // Silent failure for mark as read - non-critical operation
  };

  const handleSaveNotes = async () => {
    if (selectedApplication) {
      setIsSaving(true);
      try {
        const result = await updateApplicationNotes(selectedApplication.id, notes);
        if (result.success) {
          toast({ title: 'Notes saved', variant: 'success' });
          await loadApplications();
          setSelectedApplication(null);
        } else {
          toast({ title: result.error || 'Failed to save notes', variant: 'destructive' });
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      const result = await deleteApplication(id);
      if (result.success) {
        toast({ title: 'Application deleted', variant: 'success' });
        await loadApplications();
      } else {
        toast({ title: result.error || 'Failed to delete application', variant: 'destructive' });
      }
    }
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map(app => app.id)));
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

  const handleBulkStatusUpdate = async (status: AffiliateApplication['status']) => {
    if (selectedIds.size === 0) return;

    const confirmMessage = `Update ${selectedIds.size} application(s) to "${statusLabels[status]}"? ${
      ['approved', 'declined', 'interview', 'waitlisted'].includes(status)
        ? 'Emails will be sent to applicants.'
        : ''
    }`;

    if (!confirm(confirmMessage)) return;

    setIsBulkProcessing(true);
    try {
      const result = await bulkUpdateApplicationStatus(Array.from(selectedIds), status);
      if (result.success) {
        toast({ title: `Updated ${result.updated} application(s) to ${statusLabels[status]}`, variant: 'success' });
        setSelectedIds(new Set());
        await loadApplications();
      } else {
        toast({ title: result.error || 'Failed to update applications', variant: 'destructive' });
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Delete ${selectedIds.size} application(s)? This cannot be undone.`)) return;

    setIsBulkProcessing(true);
    try {
      const result = await bulkDeleteApplications(Array.from(selectedIds));
      if (result.success) {
        toast({ title: `Deleted ${result.deleted} application(s)`, variant: 'success' });
        setSelectedIds(new Set());
        await loadApplications();
      } else {
        toast({ title: result.error || 'Failed to delete applications', variant: 'destructive' });
      }
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportApplicationsToCSV(
        programFilter as 'ambassador' | 'advisor' | 'all',
        statusFilter as AffiliateApplication['status'] | 'all'
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

  // Fix race condition: await markApplicationAsRead before setting state
  const openApplicationDetails = async (application: AffiliateApplication) => {
    setSelectedApplication(application);
    setNotes(application.notes || '');
    if (!application.read) {
      await handleMarkAsRead(application.id);
    }
  };

  // Filter and sort
  const filteredApplications = applications
    .filter((app) => {
      if (programFilter !== 'all' && app.programType !== programFilter) return false;
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return sortOrder === 'desc'
          ? b.applicationScore - a.applicationScore
          : a.applicationScore - b.applicationScore;
      }
      const dateA = a.submittedAt?.getTime() || 0;
      const dateB = b.submittedAt?.getTime() || 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Stats
  const ambassadorCount = applications.filter((a) => a.programType === 'ambassador').length;
  const advisorCount = applications.filter((a) => a.programType === 'advisor').length;
  const newCount = applications.filter((a) => a.status === 'new').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const avgScore =
    applications.length > 0
      ? Math.round(applications.reduce((sum, a) => sum + a.applicationScore, 0) / applications.length)
      : 0;

  if (loading) {
    return <VoiceLoading context="admin" variant="spinner" message="Loading affiliate applications..." />;
  }

  if (error) {
    return (
      <Card className="bg-nex-surface border-nex-light">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Applications</h3>
            <p className="text-slate-dim mb-4 max-w-md">{error}</p>
            <Button onClick={loadApplications} className="bg-cyan text-nex-deep hover:bg-cyan-glow">
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total</CardTitle>
            <Users className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{applications.length}</div>
            <p className="text-xs text-slate-dim">{newCount} new</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Ambassadors</CardTitle>
            <GraduationCap className="h-4 w-4 text-cyan" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan">{ambassadorCount}</div>
            <p className="text-xs text-slate-dim">early career</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Advisors</CardTitle>
            <Briefcase className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">{advisorCount}</div>
            <p className="text-xs text-slate-dim">experienced</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{approvedCount}</div>
            <p className="text-xs text-slate-dim">active affiliates</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgScore}</div>
            <p className="text-xs text-slate-dim">application quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-white">Applications</CardTitle>
              <CardDescription className="text-slate-dim">
                Ambassador & Advisor program applications
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-[130px] bg-nex-dark border-nex-border text-white">
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-border">
                  <SelectItem value="all" className="text-white">All Programs</SelectItem>
                  <SelectItem value="ambassador" className="text-white">Ambassador</SelectItem>
                  <SelectItem value="advisor" className="text-white">Advisor</SelectItem>
                </SelectContent>
              </Select>

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
                onClick={() => {
                  if (sortBy === 'score') {
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortBy('score');
                    setSortOrder('desc');
                  }
                }}
                className={`border-nex-border ${sortBy === 'score' ? 'bg-cyan/10 text-cyan' : 'text-slate-light'}`}
              >
                Score
                {sortBy === 'score' && (sortOrder === 'desc' ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronUp className="ml-1 h-4 w-4" />)}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (sortBy === 'date') {
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  } else {
                    setSortBy('date');
                    setSortOrder('desc');
                  }
                }}
                className={`border-nex-border ${sortBy === 'date' ? 'bg-cyan/10 text-cyan' : 'text-slate-light'}`}
              >
                Date
                {sortBy === 'date' && (sortOrder === 'desc' ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronUp className="ml-1 h-4 w-4" />)}
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
                onClick={() => handleBulkStatusUpdate('approved')}
                disabled={isBulkProcessing}
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('interview')}
                disabled={isBulkProcessing}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Interview
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('waitlisted')}
                disabled={isBulkProcessing}
                className="border-slate-500/30 text-slate-400 hover:bg-slate-500/10"
              >
                <Clock className="h-4 w-4 mr-1" />
                Waitlist
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
          {filteredApplications.length === 0 ? (
            <VoiceEmptyState
              context="admin-leads"
              title="No applications found"
              description="Affiliate applications will appear here"
              variant="inline"
              size="md"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Affiliate applications table">
                <TableHeader>
                  <TableRow className="border-nex-border hover:bg-transparent">
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all applications"
                        className="border-nex-border data-[state=checked]:bg-cyan data-[state=checked]:border-cyan"
                      />
                    </TableHead>
                    <TableHead className="text-slate-dim">Score</TableHead>
                    <TableHead className="text-slate-dim">Program</TableHead>
                    <TableHead className="text-slate-dim">Status</TableHead>
                    <TableHead className="text-slate-dim">Applicant</TableHead>
                    <TableHead className="text-slate-dim">Details</TableHead>
                    <TableHead className="text-slate-dim">Expertise</TableHead>
                    <TableHead className="text-slate-dim">Submitted</TableHead>
                    <TableHead className="text-right text-slate-dim">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow
                      key={application.id}
                      className={`border-nex-border hover:bg-nex-light/50 cursor-pointer ${!application.read ? 'bg-cyan/5' : ''} ${selectedIds.has(application.id) ? 'bg-cyan/10' : ''}`}
                      onClick={() => openApplicationDetails(application)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(application.id)}
                          onCheckedChange={() => toggleSelect(application.id)}
                          aria-label={`Select ${application.firstName} ${application.lastName}`}
                          className="border-nex-border data-[state=checked]:bg-cyan data-[state=checked]:border-cyan"
                        />
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(application.applicationScore)}`}>
                          <TrendingUp className="h-3 w-3" />
                          {application.applicationScore}
                        </div>
                      </TableCell>
                      <TableCell>{getProgramBadge(application.programType)}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={application.status}
                          label={statusLabels[application.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{application.firstName} {application.lastName}</div>
                        <div className="text-xs text-slate-dim">{application.email}</div>
                      </TableCell>
                      <TableCell>
                        {application.programType === 'ambassador' ? (
                          <div>
                            <div className="text-sm text-slate-light">{currentRoleLabels[application.currentRole] || application.currentRole}</div>
                            <div className="text-xs text-slate-dim">{application.institutionName}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-slate-light">{application.currentRole}</div>
                            <div className="text-xs text-slate-dim">{application.currentCompany} ({application.yearsOfExperience}y)</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-nex-border text-slate-light">
                          {expertiseLabels[application.areaOfExpertise] || application.areaOfExpertise}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-dim">
                        {application.submittedAt ? formatDistanceToNow(application.submittedAt, { addSuffix: true }) : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openApplicationDetails(application)} className="text-slate-dim hover:text-cyan">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(application.id)} className="text-slate-dim hover:text-red-400">
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
      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="bg-nex-surface border-nex-light max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(selectedApplication.applicationScore)}`}>
                    {selectedApplication.applicationScore} pts
                  </div>
                  {selectedApplication.firstName} {selectedApplication.lastName}
                </DialogTitle>
                <DialogDescription className="text-slate-dim flex items-center gap-2">
                  {getProgramBadge(selectedApplication.programType)}
                  <span>|</span>
                  {selectedApplication.programType === 'ambassador' ? selectedApplication.institutionName : selectedApplication.currentCompany}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status Update */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-light">Status:</span>
                  <Select
                    value={selectedApplication.status}
                    onValueChange={(value) => handleStatusChange(selectedApplication.id, value as AffiliateApplication['status'])}
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

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-nex-dark">
                  <div>
                    <p className="text-xs text-slate-dim">Email</p>
                    <a href={`mailto:${selectedApplication.email}`} className="text-cyan hover:underline">{selectedApplication.email}</a>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">LinkedIn</p>
                    {selectedApplication.linkedInProfile ? (
                      <a href={selectedApplication.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline inline-flex items-center gap-1">
                        <Linkedin className="h-3 w-3" />View Profile
                      </a>
                    ) : (
                      <span className="text-slate-dim">Not provided</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Area of Expertise</p>
                    <p className="text-slate-light">{expertiseLabels[selectedApplication.areaOfExpertise] || selectedApplication.areaOfExpertise}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Source</p>
                    <p className="text-slate-light">{selectedApplication.source || 'Direct'}</p>
                  </div>
                </div>

                {/* Program-specific Details */}
                {selectedApplication.programType === 'ambassador' ? (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-nex-dark">
                    <div>
                      <p className="text-xs text-slate-dim">Current Status</p>
                      <p className="text-slate-light">{currentRoleLabels[selectedApplication.currentRole] || selectedApplication.currentRole}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Program of Study</p>
                      <p className="text-slate-light">{programOfStudyLabels[selectedApplication.programOfStudy || ''] || selectedApplication.programOfStudy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Institution</p>
                      <p className="text-slate-light">{selectedApplication.institutionName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Graduation Date</p>
                      <p className="text-slate-light">{selectedApplication.graduationDate}</p>
                    </div>
                    {selectedApplication.careerInterests && selectedApplication.careerInterests.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-dim mb-2">Career Interests</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedApplication.careerInterests.map((interest) => (
                            <Badge key={interest} variant="outline" className="border-cyan/30 text-cyan text-xs">{interest}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-nex-dark">
                    <div>
                      <p className="text-xs text-slate-dim">Current Role</p>
                      <p className="text-slate-light">{selectedApplication.currentRole}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Company</p>
                      <p className="text-slate-light">{selectedApplication.currentCompany}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Years of Experience</p>
                      <p className="text-slate-light">{selectedApplication.yearsOfExperience} years</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Consulting Interest</p>
                      <p className="text-slate-light">{consultingInterestLabels[selectedApplication.consultingInterest || ''] || selectedApplication.consultingInterest}</p>
                    </div>
                    {selectedApplication.specializations && selectedApplication.specializations.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-dim mb-2">Specializations</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedApplication.specializations.map((spec) => (
                            <Badge key={spec} variant="outline" className="border-gold/30 text-gold text-xs">{spec}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Motivation */}
                <div>
                  <p className="text-sm font-medium text-slate-light mb-2">Motivation</p>
                  <div className="p-4 rounded-lg bg-nex-dark">
                    <p className="text-slate-light whitespace-pre-wrap">{selectedApplication.motivation}</p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-sm font-medium text-slate-light mb-2">Internal Notes</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="bg-nex-dark border-nex-border text-white min-h-[100px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedApplication(null)} className="border-nex-border text-slate-light" disabled={isSaving}>Close</Button>
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
