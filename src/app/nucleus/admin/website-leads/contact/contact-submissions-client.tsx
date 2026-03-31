'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, CheckCircle, Clock, Trash2, Download, RefreshCw } from 'lucide-react';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { useToast } from '@/hooks/use-toast';
import { getContactSubmissions, markSubmissionAsRead, deleteSubmission, exportContactSubmissionsToCSV } from './actions';
import type { ContactSubmission } from './actions';
import { formatDistanceToNow } from 'date-fns';

export function ContactSubmissionsClient() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read'>('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportContactSubmissionsToCSV(filter);

      if (result.success && result.csv && result.filename) {
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

  const loadSubmissions = async () => {
    setLoading(true);
    const result = await getContactSubmissions();
    if (result.success && result.submissions) {
      setSubmissions(result.submissions);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => {
    await markSubmissionAsRead(id);
    await loadSubmissions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this submission?')) {
      await deleteSubmission(id);
      await loadSubmissions();
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'new') return sub.status === 'new';
    if (filter === 'read') return sub.status === 'read';
    return true;
  });

  const newCount = submissions.filter((s) => s.status === 'new').length;

  if (loading) {
    return (
      <VoiceLoading context="admin" variant="spinner" message="Loading submissions..." />
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total Submissions</CardTitle>
            <Mail className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{submissions.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">New Messages</CardTitle>
            <Clock className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{newCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Read Messages</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{submissions.length - newCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-white">Contact Form Submissions</CardTitle>
              <CardDescription className="text-slate-dim">View and manage messages from your contact form</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter('all')}
                className={`border-nex-border ${filter === 'all' ? 'bg-cyan/10 text-cyan' : 'text-slate-light'}`}
              >
                All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter('new')}
                className={`border-nex-border ${filter === 'new' ? 'bg-cyan/10 text-cyan' : 'text-slate-light'}`}
              >
                New ({newCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter('read')}
                className={`border-nex-border ${filter === 'read' ? 'bg-cyan/10 text-cyan' : 'text-slate-light'}`}
              >
                Read
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
          {filteredSubmissions.length === 0 ? (
            <VoiceEmptyState
              context="messages"
              title="No submissions found"
              description="Contact form submissions will appear here"
              variant="inline"
              size="md"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Contact form submissions">
                <TableHeader>
                  <TableRow className="border-nex-border hover:bg-transparent">
                    <TableHead className="text-slate-dim">Status</TableHead>
                    <TableHead className="text-slate-dim">Name</TableHead>
                    <TableHead className="text-slate-dim">Email</TableHead>
                    <TableHead className="text-slate-dim">Subject</TableHead>
                    <TableHead className="text-slate-dim">Message</TableHead>
                    <TableHead className="text-slate-dim">Submitted</TableHead>
                    <TableHead className="text-right text-slate-dim">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      className={`border-nex-border hover:bg-nex-light/50 ${submission.status === 'new' ? 'bg-cyan/5' : ''}`}
                    >
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            submission.status === 'new'
                              ? 'bg-cyan/20 text-cyan border-cyan/30'
                              : 'bg-nex-light text-slate-dim border-nex-border'
                          }
                        >
                          {submission.status === 'new' ? 'New' : 'Read'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        {submission.firstName} {submission.lastName}
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${submission.email}`} className="text-cyan hover:underline">
                          {submission.email}
                        </a>
                      </TableCell>
                      <TableCell className="text-slate-light">{submission.subject}</TableCell>
                      <TableCell className="max-w-xs truncate text-slate-dim">{submission.message}</TableCell>
                      <TableCell className="text-xs text-slate-dim">
                        {submission.submittedAt
                          ? formatDistanceToNow(submission.submittedAt, { addSuffix: true })
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {submission.status === 'new' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(submission.id)}
                              className="text-slate-dim hover:text-cyan"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(submission.id)}
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
    </div>
  );
}
