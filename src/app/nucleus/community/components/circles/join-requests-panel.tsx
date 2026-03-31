'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { VoiceEmptyStateCompact } from '@/components/voice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { parseTimestamp } from '@/lib/firestore-utils';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import {
  getPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from '../../actions/forums';
import { useToast } from '@/hooks/use-toast';
import { type Timestamp } from 'firebase/firestore';

interface JoinRequest {
  id: string;
  forumId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  answers?: Array<{
    questionId: string;
    questionLabel: string;
    answer: string | string[];
  }>;
  message?: string;
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewNote?: string;
}

interface JoinRequestsPanelProps {
  forumId: string;
  forumName: string;
}

export function JoinRequestsPanel({
  forumId,
  forumName: _forumName,
}: JoinRequestsPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    request: JoinRequest | null;
    decision: 'approved' | 'rejected';
  }>({ open: false, request: null, decision: 'approved' });
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    loadRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumId]);

  async function loadRequests() {
    setLoading(true);
    const result = await getPendingJoinRequests(forumId);
    if (result.success && result.requests) {
      setRequests(result.requests as JoinRequest[]);
    }
    setLoading(false);
  }

  async function handleReview(
    request: JoinRequest,
    decision: 'approved' | 'rejected'
  ) {
    if (decision === 'rejected') {
      // Show dialog for rejection note
      setReviewDialog({ open: true, request, decision });
      return;
    }

    // Direct approval
    setReviewingId(request.id);
    const result = await approveJoinRequest(forumId, request.id);

    if (result.success) {
      toast({
        title: 'Request approved',
        description: `${request.userName || 'User'} has been added to the circle`,
      });
      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to approve request',
        variant: 'destructive',
      });
    }
    setReviewingId(null);
  }

  async function handleRejectConfirm() {
    if (!reviewDialog.request) return;

    setReviewingId(reviewDialog.request.id);
    const result = await rejectJoinRequest(
      forumId,
      reviewDialog.request.id,
      reviewNote || undefined
    );

    if (result.success) {
      toast({
        title: 'Request rejected',
        description: `${reviewDialog.request.userName || 'User'}'s request has been rejected`,
      });
      // Remove from list
      setRequests((prev) =>
        prev.filter((r) => r.id !== reviewDialog.request?.id)
      );
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to reject request',
        variant: 'destructive',
      });
    }

    setReviewingId(null);
    setReviewDialog({ open: false, request: null, decision: 'approved' });
    setReviewNote('');
  }

  function formatDate(timestamp: Timestamp | string | Date) {
    if (!timestamp) return '';
    try {
      const date = parseTimestamp(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <VoiceLoading context="community" variant="spinner" message="Loading join requests..." />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Join Requests</CardTitle>
          <CardDescription>No pending requests</CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceEmptyStateCompact
            context="circles"
            description="When users request to join this circle, their requests will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Join Requests</CardTitle>
              <CardDescription>
                {requests.length} pending{' '}
                {requests.length === 1 ? 'request' : 'requests'}
              </CardDescription>
            </div>
            <Badge variant="secondary">{requests.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((request) => {
            const isExpanded = expandedId === request.id;
            const isReviewing = reviewingId === request.id;

            return (
              <div key={request.id} className="space-y-3 rounded-lg border p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {request.userName || 'Anonymous User'}
                      </div>
                      {request.userEmail && (
                        <div className="text-sm text-muted-foreground">
                          {request.userEmail}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  </div>
                </div>

                {/* Answers toggle */}
                {request.answers && request.answers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : request.id)
                    }
                    className="w-full justify-between text-muted-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {request.answers.length}{' '}
                      {request.answers.length === 1 ? 'answer' : 'answers'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}

                {/* Expanded answers */}
                {isExpanded && request.answers && (
                  <div className="space-y-3 border-t pt-2">
                    {request.answers.map((answer) => (
                      <div key={answer.questionId} className="space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">
                          {answer.questionLabel}
                        </div>
                        <div className="text-sm">
                          {Array.isArray(answer.answer)
                            ? answer.answer.join(', ')
                            : answer.answer || (
                                <span className="italic text-muted-foreground">
                                  No answer
                                </span>
                              )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleReview(request, 'approved')}
                    disabled={isReviewing}
                    className="flex-1"
                  >
                    {isReviewing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(request, 'rejected')}
                    disabled={isReviewing}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Rejection dialog */}
      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialog({
              open: false,
              request: null,
              decision: 'approved',
            });
            setReviewNote('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Join Request</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejecting{' '}
              {reviewDialog.request?.userName || 'this user'}'s request. They
              will be notified of your decision.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (optional)..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialog({
                  open: false,
                  request: null,
                  decision: 'approved',
                });
                setReviewNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={reviewingId === reviewDialog.request?.id}
            >
              {reviewingId === reviewDialog.request?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Reject Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
