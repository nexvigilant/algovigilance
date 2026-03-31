'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceEmptyStateCompact, customToast } from '@/components/voice';
import { searchUsersForAward, awardBadgeToUser, type BadgeWithStats } from '../actions';

interface AwardBadgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges: BadgeWithStats[];
  onSuccess: () => void;
}

export function AwardBadgeModal({
  open,
  onOpenChange,
  badges,
  onSuccess,
}: AwardBadgeModalProps) {
  const [step, setStep] = useState<'user' | 'badge' | 'confirm'>('user');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; photoURL?: string; badgeCount: number }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; photoURL?: string; badgeCount: number } | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStats | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('user');
      setSearchTerm('');
      setUsers([]);
      setSelectedUser(null);
      setSelectedBadge(null);
      setReason('');
    }
  }, [open]);

  // Search users
  useEffect(() => {
    const search = async () => {
      if (searchTerm.length < 2) {
        setUsers([]);
        return;
      }
      setSearching(true);
      const results = await searchUsersForAward(searchTerm);
      setUsers(results);
      setSearching(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  async function handleAward() {
    if (!selectedUser || !selectedBadge) return;

    setLoading(true);
    const result = await awardBadgeToUser(
      selectedUser.id,
      selectedBadge.id,
      reason
    );
    setLoading(false);

    if (result.success) {
      onOpenChange(false);
      onSuccess();
    } else {
      customToast.error(result.error || 'Failed to award badge');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Award Badge</DialogTitle>
          <DialogDescription>
            {step === 'user' && 'Search for a user to award a badge'}
            {step === 'badge' && 'Select a badge to award'}
            {step === 'confirm' && 'Confirm badge award'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select User */}
        {step === 'user' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-dim" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-64">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted"
                      onClick={() => {
                        setSelectedUser(user);
                        setStep('badge');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-slate-dim">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.badgeCount}</p>
                        <p className="text-xs text-slate-dim">badges</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm.length >= 2 ? (
                <VoiceEmptyStateCompact
                  context="circles"
                  description="No users found"
                />
              ) : (
                <VoiceEmptyStateCompact
                  context="circles"
                  description="Type at least 2 characters to search"
                />
              )}
            </ScrollArea>
          </div>
        )}

        {/* Step 2: Select Badge */}
        {step === 'badge' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser?.photoURL} />
                <AvatarFallback>
                  {selectedUser?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser?.name}</p>
                <p className="text-sm text-slate-dim">
                  {selectedUser?.email}
                </p>
              </div>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted"
                    onClick={() => {
                      setSelectedBadge(badge);
                      setStep('confirm');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-sm text-slate-dim">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-dim" />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button variant="outline" onClick={() => setStep('user')}>
              Back
            </Button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser?.photoURL} />
                  <AvatarFallback>
                    {selectedUser?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.name}</p>
                  <p className="text-sm text-slate-dim">
                    {selectedUser?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t pt-4">
                <span className="text-3xl">{selectedBadge?.icon}</span>
                <div>
                  <p className="font-medium">{selectedBadge?.name}</p>
                  <p className="text-sm text-slate-dim">
                    {selectedBadge?.description}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Reason (optional)
              </label>
              <Textarea
                placeholder="Why is this badge being awarded?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('badge')}>
                Back
              </Button>
              <Button onClick={handleAward} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Award Badge
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
