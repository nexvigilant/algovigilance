'use client';

import { UserPlus, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { JoinRequest } from '../actions';

interface PendingRequestGroup {
  circleId: string;
  circleName: string;
  requests: JoinRequest[];
}

interface PendingRequestsPanelProps {
  allPendingRequests: PendingRequestGroup[];
  onApprove: (circleId: string, requestId: string, userId: string, userName: string) => void;
  onReject: (circleId: string, requestId: string, userName: string) => void;
}

export function PendingRequestsPanel({
  allPendingRequests,
  onApprove,
  onReject,
}: PendingRequestsPanelProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {allPendingRequests.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <UserPlus className="h-6 w-6 text-slate-dim" />
            </div>
            <h3 className="mb-2 text-lg font-medium">No Pending Requests</h3>
            <p className="text-slate-dim">All join requests have been processed.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {allPendingRequests.map((circleGroup) => (
              <div key={circleGroup.circleId}>
                <h3 className="mb-3 font-medium">{circleGroup.circleName}</h3>
                <div className="space-y-2">
                  {circleGroup.requests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-4 w-4 text-cyan" />
                        </div>
                        <div>
                          <div className="font-medium">{request.odName}</div>
                          <div className="text-sm text-slate-dim">
                            {request.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onReject(circleGroup.circleId, request.id, request.odName)
                          }
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            onApprove(
                              circleGroup.circleId,
                              request.id,
                              request.odspId,
                              request.odName
                            )
                          }
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
