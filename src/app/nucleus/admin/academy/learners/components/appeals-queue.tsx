'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/hooks/use-auth';
import { reviewAppeal } from '@/lib/actions/learners';
import type { Appeal } from '@/types/learner-management';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('components/appeals-queue');

interface AppealsQueueProps {
  appeals: Appeal[];
  loading: boolean;
  onRefresh: () => void;
}

export function AppealsQueue({ appeals, loading, onRefresh }: AppealsQueueProps) {
  const { user } = useAuth();
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'denied'>('denied');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  async function handleReview() {
    if (!selectedAppeal || !user) return;
    setProcessing(true);
    try {
      await reviewAppeal(selectedAppeal.appealId, decision, notes, user.uid);
      onRefresh();
      closeDialog();
    } catch (error) {
      log.error('Error reviewing appeal:', error);
    } finally {
      setProcessing(false);
    }
  }

  function closeDialog() {
    setShowReviewDialog(false);
    setSelectedAppeal(null);
    setNotes('');
  }

  function openReviewDialog(appeal: Appeal, decision: 'approved' | 'denied') {
    setSelectedAppeal(appeal);
    setDecision(decision);
    setShowReviewDialog(true);
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading appeals...
      </div>
    );
  }

  if (appeals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Appeals</h3>
          <p className="text-muted-foreground">
            All appeals have been reviewed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {appeals.map((appeal) => (
          <Card key={appeal.appealId} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Pending Review</Badge>
                  {appeal.caseId && (
                    <Badge variant="outline">Case #{appeal.caseId.slice(0, 8)}</Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {toDateFromSerialized(appeal.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    User: {appeal.userId.slice(0, 8)}...
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {Math.round(
                      (Date.now() - toDateFromSerialized(appeal.submittedAt).getTime()) / (1000 * 60 * 60)
                    )}h ago
                  </span>
                </div>

                <div>
                  <Label className="text-sm font-medium">Appeal Reason</Label>
                  <p className="text-sm mt-1 bg-muted p-3 rounded">
                    {appeal.reason}
                  </p>
                </div>

                {appeal.evidence && appeal.evidence.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Evidence Provided</Label>
                    <div className="mt-1 space-y-1">
                      {appeal.evidence.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-primary hover:underline cursor-pointer">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => openReviewDialog(appeal, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openReviewDialog(appeal, 'denied')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Deny
                  </Button>
                  <Button size="sm" variant="ghost">
                    View Original Case
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === 'approved' ? 'Approve Appeal' : 'Deny Appeal'}
            </DialogTitle>
            <DialogDescription>
              {decision === 'approved'
                ? 'Approving this appeal will reverse the original action (warning/suspension).'
                : 'Denying this appeal will uphold the original decision.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Review Notes</Label>
              <Textarea
                placeholder={
                  decision === 'approved'
                    ? 'Explain why this appeal is being approved...'
                    : 'Explain why this appeal is being denied...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={!notes || processing}
              variant={decision === 'approved' ? 'default' : 'destructive'}
              className={decision === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {processing
                ? 'Processing...'
                : decision === 'approved'
                ? 'Approve Appeal'
                : 'Deny Appeal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
