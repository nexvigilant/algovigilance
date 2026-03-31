'use client';

import { useState } from 'react';
import {
  Clock,
  User,
  FileText,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { resolveCase } from '@/lib/actions/learners';
import type { ModerationCase, CaseResolution, WarningLevel } from '@/types/learner-management';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('components/moderation-queue');

interface ModerationQueueProps {
  cases: ModerationCase[];
  loading: boolean;
  onRefresh: () => void;
}

export function ModerationQueue({ cases, loading, onRefresh }: ModerationQueueProps) {
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState<ModerationCase | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState<CaseResolution>('warning');
  const [notes, setNotes] = useState('');
  const [issueWarning, setIssueWarning] = useState(false);
  const [warningLevel, setWarningLevel] = useState<WarningLevel>(2);
  const [suspendUser, setSuspendUser] = useState(false);
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [processing, setProcessing] = useState(false);

  async function handleResolve() {
    if (!selectedCase || !user) return;
    setProcessing(true);
    try {
      await resolveCase(
        {
          caseId: selectedCase.caseId,
          resolution,
          notes,
          issueWarning,
          warningLevel: issueWarning ? warningLevel : undefined,
          suspendUser,
          suspensionDays: suspendUser ? suspensionDays : undefined,
        },
        user.uid
      );
      onRefresh();
      closeDialog();
    } catch (error) {
      log.error('Error resolving case:', error);
    } finally {
      setProcessing(false);
    }
  }

  function closeDialog() {
    setShowResolveDialog(false);
    setSelectedCase(null);
    setResolution('warning');
    setNotes('');
    setIssueWarning(false);
    setSuspendUser(false);
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-500 text-black">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  }

  function getStatusBadge(status: string) {
    return <StatusBadge status={status} />;
  }

  function getViolationLabel(type: string) {
    const labels: Record<string, string> = {
      harassment: 'Harassment',
      threats: 'Threats',
      hate_speech: 'Hate Speech',
      misinformation: 'Misinformation',
      spam: 'Spam',
      solicitation: 'Solicitation',
      impersonation: 'Impersonation',
      pii_exposure: 'PII Exposure',
      off_topic: 'Off Topic',
      self_promotion: 'Self Promotion',
      profanity: 'Profanity',
      copyright: 'Copyright',
      illegal_content: 'Illegal Content',
      other: 'Other',
    };
    return labels[type] || type;
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading moderation queue...
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
          <p className="text-muted-foreground">
            No open moderation cases at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {cases.map((caseItem) => (
          <Card key={caseItem.caseId} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(caseItem.priority)}
                  {getStatusBadge(caseItem.status)}
                  <Badge variant="outline">{getViolationLabel(caseItem.violationType)}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {toDateFromSerialized(caseItem.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">{caseItem.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    User: {caseItem.reportedUserId.slice(0, 8)}...
                  </span>
                  {caseItem.reportedContentType && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {caseItem.reportedContentType}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.round(
                      (Date.now() - toDateFromSerialized(caseItem.createdAt).getTime()) / (1000 * 60 * 60)
                    )}h ago
                  </span>
                </div>

                {caseItem.contentSnapshot && (
                  <div className="bg-muted p-3 rounded text-sm italic">
                    &quot;{caseItem.contentSnapshot.slice(0, 200)}
                    {caseItem.contentSnapshot.length > 200 ? '...' : ''}&quot;
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedCase(caseItem);
                      setShowResolveDialog(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                  <Button size="sm" variant="outline">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    Escalate
                  </Button>
                  <Button size="sm" variant="ghost">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Case</DialogTitle>
            <DialogDescription>
              Choose a resolution and any additional actions for this case.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select
                value={resolution}
                onValueChange={(v) => setResolution(v as CaseResolution)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Issue Warning</SelectItem>
                  <SelectItem value="content_removed">Remove Content</SelectItem>
                  <SelectItem value="suspension">Suspend User</SelectItem>
                  <SelectItem value="ban">Ban User</SelectItem>
                  <SelectItem value="dismissed">Dismiss (No Action)</SelectItem>
                  <SelectItem value="no_action">Close (No Violation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Document your decision and reasoning..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-3 border-t pt-3">
              <Label className="text-sm font-semibold">Additional Actions</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="issue-warning"
                  checked={issueWarning}
                  onCheckedChange={(c) => setIssueWarning(c as boolean)}
                />
                <label htmlFor="issue-warning" className="text-sm">
                  Issue formal warning to user
                </label>
              </div>

              {issueWarning && (
                <div className="ml-6">
                  <Select
                    value={warningLevel.toString()}
                    onValueChange={(v) => setWarningLevel(parseInt(v) as WarningLevel)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Minor</SelectItem>
                      <SelectItem value="2">Level 2 - Moderate</SelectItem>
                      <SelectItem value="3">Level 3 - Serious</SelectItem>
                      <SelectItem value="4">Level 4 - Severe</SelectItem>
                      <SelectItem value="5">Level 5 - Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suspend-user"
                  checked={suspendUser}
                  onCheckedChange={(c) => setSuspendUser(c as boolean)}
                />
                <label htmlFor="suspend-user" className="text-sm">
                  Suspend user account
                </label>
              </div>

              {suspendUser && (
                <div className="ml-6">
                  <Select
                    value={suspensionDays.toString()}
                    onValueChange={(v) => setSuspensionDays(parseInt(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={!notes || processing}>
              {processing ? 'Resolving...' : 'Resolve Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
