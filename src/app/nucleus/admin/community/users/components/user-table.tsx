'use client';

import { User, Shield, Crown, ShieldCheck, ShieldOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { UserActionsMenu } from './user-actions-menu';
import type { CommunityUser } from '../types';

function getRoleIcon(role: string): ReactNode {
  switch (role) {
    case 'admin':
      return <Crown className="h-3 w-3" />;
    case 'moderator':
      return <Shield className="h-3 w-3" />;
    default:
      return <User className="h-3 w-3" />;
  }
}

interface UserTableProps {
  loading: boolean;
  filteredUsers: CommunityUser[];
  selectedUserIds: Set<string>;
  toggleAllSelection: () => void;
  toggleUserSelection: (userId: string) => void;
  onRoleChange: (userId: string, role: 'user' | 'moderator' | 'admin') => void;
  onViewUser: (user: CommunityUser) => void;
  onRevoke: (user: CommunityUser) => void;
  onClearRevocation: (user: CommunityUser) => void;
  onToggleVerification: (user: CommunityUser) => void;
  onBan: (user: CommunityUser) => void;
  onUnban: (user: CommunityUser) => void;
}

export function UserTable({
  loading,
  filteredUsers,
  selectedUserIds,
  toggleAllSelection,
  toggleUserSelection,
  onRoleChange,
  onViewUser,
  onRevoke,
  onClearRevocation,
  onToggleVerification,
  onBan,
  onUnban,
}: UserTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-slate-dim">No users found</p>
          </div>
        ) : (
          <Table aria-label="Community users management table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.uid} className={selectedUserIds.has(user.uid) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUserIds.has(user.uid)}
                      onCheckedChange={() => toggleUserSelection(user.uid)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-cyan" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.name || user.displayName || 'Unknown'}
                        </div>
                        <div className="text-sm text-slate-dim">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role || 'user'}
                      onValueChange={(value: 'user' | 'moderator' | 'admin') =>
                        onRoleChange(user.uid, value)
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role || 'user')}
                            <span className="capitalize">{user.role || 'user'}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            User
                          </div>
                        </SelectItem>
                        <SelectItem value="moderator">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Moderator
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Crown className="h-3 w-3" />
                            Admin
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.trustStatus === 'revoked' ? (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/30">
                        <ShieldOff className="h-3 w-3 mr-1" />
                        Trust Revoked
                      </Badge>
                    ) : user.verifiedPractitioner ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-dim opacity-50">
                        Standard
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge className="border-green-500/30 bg-green-500/20 text-green-500">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.createdAt?.seconds
                      ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActionsMenu
                      user={user}
                      onViewUser={onViewUser}
                      onRevoke={onRevoke}
                      onClearRevocation={onClearRevocation}
                      onToggleVerification={onToggleVerification}
                      onBan={onBan}
                      onUnban={onUnban}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
