'use client';

import { Loader2, ShieldOff } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { CommunityUser } from '../types';

interface BanDialogProps {
  banningUser: CommunityUser | null;
  onBanOpenChange: (open: boolean) => void;
  banReason: string;
  onBanReasonChange: (reason: string) => void;
  onBan: () => void;
  unbanningUser: CommunityUser | null;
  onUnbanOpenChange: (open: boolean) => void;
  onUnban: () => void;
  revokingUser: CommunityUser | null;
  onRevokeOpenChange: (open: boolean) => void;
  revocationReason: string;
  onRevocationReasonChange: (reason: string) => void;
  onRevoke: () => void;
  isRevoking: boolean;
}

export function BanDialog({
  banningUser,
  onBanOpenChange,
  banReason,
  onBanReasonChange,
  onBan,
  unbanningUser,
  onUnbanOpenChange,
  onUnban,
  revokingUser,
  onRevokeOpenChange,
  revocationReason,
  onRevocationReasonChange,
  onRevoke,
  isRevoking,
}: BanDialogProps) {
  return (
    <>
      {/* Ban Dialog */}
      <AlertDialog open={!!banningUser} onOpenChange={onBanOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban{' '}
              <strong>{banningUser?.name || banningUser?.displayName}</strong>?
              They will not be able to access the community.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="ban-reason">Reason for ban</Label>
            <Textarea
              id="ban-reason"
              placeholder="Enter reason for banning this user..."
              value={banReason}
              onChange={(e) => onBanReasonChange(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onBanReasonChange('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onBan}
              className="bg-red-500 hover:bg-red-600"
              disabled={!banReason.trim()}
            >
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unban Dialog */}
      <AlertDialog open={!!unbanningUser} onOpenChange={onUnbanOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban{' '}
              <strong>{unbanningUser?.name || unbanningUser?.displayName}</strong>?
              They will regain access to the community.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onUnban}>
              Unban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revocation Dialog */}
      <AlertDialog
        open={!!revokingUser}
        onOpenChange={onRevokeOpenChange}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <ShieldOff className="h-5 w-5" />
              Revoke Verified Practitioner Status
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to revoke the verified practitioner status for{' '}
                  <strong className="text-white">
                    {revokingUser?.name || revokingUser?.displayName || revokingUser?.email || 'this user'}
                  </strong>.
                </p>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                  <strong>Warning:</strong> This action will:
                  <ul className="mt-2 list-disc pl-4 space-y-1">
                    <li>Invalidate their capability proof token immediately</li>
                    <li>Remove them from all high-trust circles</li>
                    <li>Mark their account with &quot;Trust Revoked&quot; status</li>
                    <li>Notify the user of this action</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="revocation-reason">Reason for revocation (optional)</Label>
            <Textarea
              id="revocation-reason"
              placeholder="Enter reason for revoking verification..."
              value={revocationReason}
              onChange={(e) => onRevocationReasonChange(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-slate-dim">
              This reason will be logged in the audit trail and shown in the user&apos;s notification.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRevoke}
              className="bg-red-500 hover:bg-red-600"
              disabled={isRevoking}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Revoke Verification
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
