'use client';

import { User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserStatsPanel } from './user-stats-panel';
import type { CommunityUser } from '../types';
import type { UserStats } from '../actions';

interface UserDetailDialogProps {
  selectedUser: CommunityUser | null;
  onClose: () => void;
  loadingStats: boolean;
  userStats: UserStats | null;
}

export function UserDetailDialog({
  selectedUser,
  onClose,
  loadingStats,
  userStats,
}: UserDetailDialogProps) {
  return (
    <Dialog open={!!selectedUser} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {selectedUser?.photoURL ? (
              <img
                src={selectedUser.photoURL}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-cyan" />
              </div>
            )}
            {selectedUser?.name || selectedUser?.displayName || 'Unknown'}
          </DialogTitle>
          <DialogDescription>
            {selectedUser?.email}
          </DialogDescription>
        </DialogHeader>

        {loadingStats ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : userStats ? (
          <UserStatsPanel
            stats={userStats}
            userName={selectedUser?.name || selectedUser?.displayName || 'Unknown'}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
