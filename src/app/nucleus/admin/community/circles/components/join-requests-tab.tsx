'use client';

import { useState } from 'react';
import { Check, X, User, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { customToast } from '@/components/voice';
import {
  type JoinRequest,
  approveJoinRequestAdmin,
  rejectJoinRequestAdmin,
} from '../actions';

interface JoinRequestsTabProps {
  circleId: string;
  requests: JoinRequest[];
  onRefresh: () => void;
}

export function JoinRequestsTab({
  circleId,
  requests,
  onRefresh,
}: JoinRequestsTabProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<JoinRequest | null>(
    null
  );

  async function handleApprove(request: JoinRequest) {
    setProcessing(request.id);
    const result = await approveJoinRequestAdmin(
      circleId,
      request.id,
      request.odspId
    );
    if (result.success) {
      customToast.success(`${request.odName} has been approved`);
      onRefresh();
    } else {
      customToast.error(result.error || 'Failed to approve request');
    }
    setProcessing(null);
  }

  async function handleReject() {
    if (!rejectingRequest) return;

    setProcessing(rejectingRequest.id);
    const result = await rejectJoinRequestAdmin(circleId, rejectingRequest.id);
    if (result.success) {
      customToast.success('Request rejected');
      setRejectingRequest(null);
      onRefresh();
    } else {
      customToast.error(result.error || 'Failed to reject request');
    }
    setProcessing(null);
  }

  if (requests.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Check className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-medium">No Pending Requests</h3>
        <p className="text-muted-foreground">
          All join requests have been processed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
          {requests.length} pending
        </Badge>
        <span>requests awaiting review</span>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {request.avatar ? (
                      <img
                        src={request.avatar}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="font-medium">{request.odName}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {request.createdAt.toLocaleDateString()} at{' '}
                      {request.createdAt.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {request.message && (
                      <div className="mt-2 flex items-start gap-2 text-sm">
                        <MessageSquare className="mt-0.5 h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          "{request.message}"
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectingRequest(request)}
                    disabled={processing === request.id}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request)}
                    disabled={processing === request.id}
                  >
                    {processing === request.id ? (
                      <div className="mr-1 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    ) : (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        open={!!rejectingRequest}
        onOpenChange={() => setRejectingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Join Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject{' '}
              <strong>{rejectingRequest?.odName}</strong>'s request to join this
              circle? They will be able to request again in the future.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-500 hover:bg-red-600"
            >
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
