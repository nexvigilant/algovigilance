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
  Building2,
  TrendingUp,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Target,
  Download,
  RefreshCw,
} from 'lucide-react';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import {
  getConsultingInquiries,
  updateInquiryStatus,
  updateInquiryNotes,
  markInquiryAsRead,
  deleteInquiry,
  exportConsultingInquiriesToCSV as _exportConsultingInquiriesToCSV,
} from './actions';
import {
  companyTypeLabels,
  companySizeLabels,
  categoryLabels,
  budgetLabels,
  timelineLabels,
  statusLabels,
  type ConsultingInquiry,
} from './constants';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const log = logger.scope('ConsultingLeadsClient');
import { formatDistanceToNow } from 'date-fns';

function getLeadScoreColor(score: number): string {
  if (score >= 150) return 'text-cyan-glow bg-cyan/20 shadow-glow-cyan border-cyan/50';
  if (score >= 100) return 'text-green-400 bg-green-400/10';
  if (score >= 70) return 'text-cyan bg-cyan/10';
  if (score >= 40) return 'text-amber-400 bg-amber-400/10';
  return 'text-slate-dim bg-nex-light';
}

function getLeadScoreLabel(score: number): string {
  if (score >= 150) return 'Critical';
  if (score >= 100) return 'High';
  if (score >= 70) return 'Warm';
  if (score >= 40) return 'Cool';
  return 'Cold';
}

// Status colors resolved by StatusBadge semantic map

export function ConsultingLeadsClient() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<ConsultingInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedInquiry, setSelectedInquiry] = useState<ConsultingInquiry | null>(null);
  const [notes, setNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        category: categoryFilter,
      });
      
      const response = await fetch(`/api/admin/website-leads/consulting/export?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      
      link.href = url;
      link.download = `consulting-leads-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Lead export complete', variant: 'success' });
    } catch (error) {
      log.error('Export error:', error);
      toast({ title: 'Failed to export CSV', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const loadInquiries = async () => {
    setLoading(true);
    const result = await getConsultingInquiries();
    if (result.success && result.inquiries) {
      setInquiries(result.inquiries);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: ConsultingInquiry['status']) => {
    await updateInquiryStatus(id, status);
    await loadInquiries();
  };

  const handleMarkAsRead = async (id: string) => {
    await markInquiryAsRead(id);
    await loadInquiries();
  };

  const handleSaveNotes = async () => {
    if (selectedInquiry) {
      await updateInquiryNotes(selectedInquiry.id, notes);
      await loadInquiries();
      setSelectedInquiry(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this inquiry?')) {
      await deleteInquiry(id);
      await loadInquiries();
    }
  };

  const openInquiryDetails = (inquiry: ConsultingInquiry) => {
    setSelectedInquiry(inquiry);
    setNotes(inquiry.notes || '');
    if (!inquiry.read) {
      handleMarkAsRead(inquiry.id);
    }
  };

  // Filter and sort
  const filteredInquiries = inquiries
    .filter((inq) => {
      if (statusFilter !== 'all' && inq.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && inq.consultingCategory !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return sortOrder === 'desc' ? b.leadScore - a.leadScore : a.leadScore - b.leadScore;
      }
      // Sort by date
      const dateA = a.submittedAt?.getTime() || 0;
      const dateB = b.submittedAt?.getTime() || 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Stats
  const newCount = inquiries.filter((i) => i.status === 'new').length;
  const qualifiedCount = inquiries.filter((i) => i.status === 'qualified' || i.status === 'proposal').length;
  const avgScore = inquiries.length > 0
    ? Math.round(inquiries.reduce((sum, i) => sum + i.leadScore, 0) / inquiries.length)
    : 0;
  const totalPipelineValue = inquiries
    .filter((i) => !['closed-won', 'closed-lost'].includes(i.status))
    .reduce((sum, i) => {
      const budgetMap: Record<string, number> = {
        'under-25k': 15000,
        '25k-50k': 37500,
        '50k-100k': 75000,
        '100k-250k': 175000,
        '250k-500k': 375000,
        'over-500k': 600000,
        'not-sure': 50000,
      };
      return sum + (budgetMap[i.budgetRange] || 0);
    }, 0);

  if (loading) {
    return <VoiceLoading context="admin" variant="spinner" message="Loading consulting leads..." />;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total Leads</CardTitle>
            <Building2 className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{inquiries.length}</div>
            <p className="text-xs text-slate-dim">{newCount} new</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Qualified</CardTitle>
            <Target className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{qualifiedCount}</div>
            <p className="text-xs text-slate-dim">in pipeline</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Avg Lead Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgScore}</div>
            <p className="text-xs text-slate-dim">out of 220</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${(totalPipelineValue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-slate-dim">estimated</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-white">Consulting Inquiries</CardTitle>
              <CardDescription className="text-slate-dim">
                Enterprise consulting leads with lead scoring
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
                    <SelectItem key={value} value={value} className="text-white">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] bg-nex-dark border-nex-border text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-border">
                  <SelectItem value="all" className="text-white">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-white">
                      {label}
                    </SelectItem>
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
        </CardHeader>
        <CardContent>
          {filteredInquiries.length === 0 ? (
            <VoiceEmptyState
              context="admin-leads"
              title="No leads found"
              description="Consulting inquiries will appear here"
              variant="inline"
              size="md"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Consulting leads table">
                <TableHeader>
                  <TableRow className="border-nex-border hover:bg-transparent">
                    <TableHead className="text-slate-dim">Score</TableHead>
                    <TableHead className="text-slate-dim">Status</TableHead>
                    <TableHead className="text-slate-dim">Contact</TableHead>
                    <TableHead className="text-slate-dim">Company</TableHead>
                    <TableHead className="text-slate-dim">Service</TableHead>
                    <TableHead className="text-slate-dim">Budget</TableHead>
                    <TableHead className="text-slate-dim">Timeline</TableHead>
                    <TableHead className="text-slate-dim">Submitted</TableHead>
                    <TableHead className="text-right text-slate-dim">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => (
                    <TableRow
                      key={inquiry.id}
                      className={`border-nex-border hover:bg-nex-light/50 cursor-pointer ${!inquiry.read ? 'bg-cyan/5' : ''}`}
                      onClick={() => openInquiryDetails(inquiry)}
                    >
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getLeadScoreColor(inquiry.leadScore)}`}>
                          <TrendingUp className="h-3 w-3" />
                          {inquiry.leadScore}
                          <span className="text-[10px] opacity-75">({getLeadScoreLabel(inquiry.leadScore)})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={inquiry.status}
                          label={statusLabels[inquiry.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">
                          {inquiry.firstName} {inquiry.lastName}
                        </div>
                        <div className="text-xs text-slate-dim">{inquiry.email}</div>
                        {inquiry.jobTitle && (
                          <div className="text-xs text-slate-dim">{inquiry.jobTitle}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-light">{inquiry.companyName}</div>
                        <div className="text-xs text-slate-dim">
                          {companyTypeLabels[inquiry.companyType] || inquiry.companyType} |{' '}
                          {companySizeLabels[inquiry.companySize] || inquiry.companySize}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-nex-border text-slate-light">
                          {categoryLabels[inquiry.consultingCategory] || inquiry.consultingCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-light">
                        {budgetLabels[inquiry.budgetRange] || inquiry.budgetRange}
                      </TableCell>
                      <TableCell className="text-slate-light">
                        {timelineLabels[inquiry.timeline] || inquiry.timeline}
                      </TableCell>
                      <TableCell className="text-xs text-slate-dim">
                        {inquiry.submittedAt
                          ? formatDistanceToNow(inquiry.submittedAt, { addSuffix: true })
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openInquiryDetails(inquiry)}
                            className="text-slate-dim hover:text-cyan"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(inquiry.id)}
                            className="text-slate-dim hover:text-red-400"
                          >
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
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        <DialogContent className="bg-nex-surface border-nex-light max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedInquiry && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getLeadScoreColor(selectedInquiry.leadScore)}`}>
                    {selectedInquiry.leadScore} pts
                  </div>
                  {selectedInquiry.firstName} {selectedInquiry.lastName}
                </DialogTitle>
                <DialogDescription className="text-slate-dim">
                  {selectedInquiry.companyName} | {companyTypeLabels[selectedInquiry.companyType]}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status Update */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-light">Status:</span>
                  <Select
                    value={selectedInquiry.status}
                    onValueChange={(value) => handleStatusChange(selectedInquiry.id, value as ConsultingInquiry['status'])}
                  >
                    <SelectTrigger className="w-[150px] bg-nex-dark border-nex-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-nex-surface border-nex-border">
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-white">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-nex-dark">
                  <div>
                    <p className="text-xs text-slate-dim">Email</p>
                    <a href={`mailto:${selectedInquiry.email}`} className="text-cyan hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Job Title</p>
                    <p className="text-slate-light">{selectedInquiry.jobTitle || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Company Size</p>
                    <p className="text-slate-light">{companySizeLabels[selectedInquiry.companySize]} employees</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Source</p>
                    <p className="text-slate-light">{selectedInquiry.source || 'Direct'}</p>
                  </div>
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-nex-dark">
                  <div>
                    <p className="text-xs text-slate-dim">Service Interest</p>
                    <Badge variant="outline" className="mt-1 border-cyan/30 text-cyan">
                      {categoryLabels[selectedInquiry.consultingCategory]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Budget Range</p>
                    <p className="text-slate-light font-medium">
                      {budgetLabels[selectedInquiry.budgetRange]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-dim">Timeline</p>
                    <p className="text-slate-light">{timelineLabels[selectedInquiry.timeline]}</p>
                  </div>
                </div>

                {/* Challenge Description */}
                <div>
                  <p className="text-sm font-medium text-slate-light mb-2">Challenge Description</p>
                  <div className="p-4 rounded-lg bg-nex-dark">
                    <p className="text-slate-light whitespace-pre-wrap">{selectedInquiry.challengeDescription}</p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-sm font-medium text-slate-light mb-2">Internal Notes</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    className="bg-nex-dark border-nex-border text-white min-h-[100px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInquiry(null)}
                  className="border-nex-border text-slate-light"
                >
                  Close
                </Button>
                <Button
                  onClick={handleSaveNotes}
                  className="bg-cyan text-nex-deep hover:bg-cyan-glow"
                >
                  Save Notes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
