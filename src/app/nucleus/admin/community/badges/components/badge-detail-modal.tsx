'use client';

import { useState, useEffect } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceEmptyStateCompact } from '@/components/voice';
import { getUsersWithBadge, type BadgeWithStats } from '../actions';
import { formatDistanceToNow } from 'date-fns';

interface BadgeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: BadgeWithStats | null;
  onAward: () => void;
}

export function BadgeDetailModal({
  open,
  onOpenChange,
  badge,
  onAward,
}: BadgeDetailModalProps) {
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; photoURL?: string; awardedAt: Date }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && badge) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, badge]);

  async function loadUsers() {
    if (!badge) return;
    setLoading(true);
    const result = await getUsersWithBadge(badge.id);
    setUsers(result);
    setLoading(false);
  }

  if (!badge) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{badge.icon}</span>
            <div>
              <DialogTitle>{badge.name}</DialogTitle>
              <DialogDescription>{badge.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-2xl font-bold">{badge.totalAwarded}</p>
              <p className="text-sm text-slate-dim">Times Awarded</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-lg font-bold capitalize">{badge.rarity}</p>
              <p className="text-sm text-slate-dim">Rarity</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Requirement</p>
            <p className="text-sm text-slate-dim">
              {badge.requirement.type}: {badge.requirement.count}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              Recent Earners ({users.length})
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : users.length > 0 ? (
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {users.slice(0, 10).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{user.name}</span>
                      <span className="text-slate-dim">
                        {formatDistanceToNow(user.awardedAt, { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <VoiceEmptyStateCompact
                context="badges"
                description="No users have earned this badge yet"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onAward}>
            <Gift className="mr-2 h-4 w-4" />
            Award This Badge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
