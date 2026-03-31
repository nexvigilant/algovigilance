'use client';

import Link from 'next/link';
import {
  Eye,
  Ban,
  MoreVertical,
  Shield,
  User,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CommunityUser } from '../types';

interface UserActionsMenuProps {
  user: CommunityUser;
  onViewUser: (user: CommunityUser) => void;
  onRevoke: (user: CommunityUser) => void;
  onClearRevocation: (user: CommunityUser) => void;
  onToggleVerification: (user: CommunityUser) => void;
  onBan: (user: CommunityUser) => void;
  onUnban: (user: CommunityUser) => void;
}

export function UserActionsMenu({
  user,
  onViewUser,
  onRevoke,
  onClearRevocation,
  onToggleVerification,
  onBan,
  onUnban,
}: UserActionsMenuProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        title="View Stats"
        onClick={() => onViewUser(user)}
      >
        <Eye className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/nucleus/profile/${user.uid}`}>
              <User className="mr-2 h-4 w-4" />
              View Profile
            </Link>
          </DropdownMenuItem>
          {user.verifiedPractitioner && !user.trustStatus && (
            <DropdownMenuItem
              onClick={() => onRevoke(user)}
              className="text-red-600 focus:text-red-600"
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Revoke Verification
            </DropdownMenuItem>
          )}
          {user.trustStatus === 'revoked' && (
            <DropdownMenuItem onClick={() => onClearRevocation(user)}>
              <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
              Clear Revocation Status
            </DropdownMenuItem>
          )}
          {!user.verifiedPractitioner && !user.trustStatus && (
            <DropdownMenuItem onClick={() => onToggleVerification(user)}>
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
              Grant Verification
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {user.isBanned ? (
            <DropdownMenuItem onClick={() => onUnban(user)}>
              <Shield className="mr-2 h-4 w-4" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => onBan(user)}
              className="text-red-600 focus:text-red-600"
            >
              <Ban className="mr-2 h-4 w-4" />
              Ban User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
