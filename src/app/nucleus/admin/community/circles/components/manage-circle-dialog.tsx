'use client';

import { Users, UserPlus, BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersTab } from './members-tab';
import { JoinRequestsTab } from './join-requests-tab';
import { AnalyticsTab } from './analytics-tab';
import type { SmartForum } from '@/types/community';
import type { CircleMember, JoinRequest, CircleAnalytics } from '../actions';

interface ManageCircleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCircle: SmartForum | null;
  loading: boolean;
  members: CircleMember[];
  requests: JoinRequest[];
  analytics: CircleAnalytics | null;
  onRefresh: () => void;
}

export function ManageCircleDialog({
  open,
  onOpenChange,
  selectedCircle,
  loading,
  members,
  requests,
  analytics,
  onRefresh,
}: ManageCircleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage: {selectedCircle?.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="members" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">
                <Users className="mr-2 h-4 w-4" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="requests">
                <UserPlus className="mr-2 h-4 w-4" />
                Requests ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              {selectedCircle && (
                <MembersTab
                  circleId={selectedCircle.id}
                  members={members}
                  onRefresh={onRefresh}
                />
              )}
            </TabsContent>

            <TabsContent value="requests" className="mt-4">
              {selectedCircle && (
                <JoinRequestsTab
                  circleId={selectedCircle.id}
                  requests={requests}
                  onRefresh={onRefresh}
                />
              )}
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              {analytics && <AnalyticsTab analytics={analytics} />}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
