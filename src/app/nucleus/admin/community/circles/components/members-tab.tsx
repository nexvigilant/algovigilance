'use client';

import { useState } from 'react';
import { Search, UserMinus, Shield, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  type CircleMember,
  updateMemberRoleAdmin,
  removeCircleMemberAdmin,
} from '../actions';

interface MembersTabProps {
  circleId: string;
  members: CircleMember[];
  onRefresh: () => void;
}

export function MembersTab({ circleId, members, onRefresh }: MembersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [removingMember, setRemovingMember] = useState<CircleMember | null>(null);

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.odName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  async function handleRoleChange(
    memberId: string,
    newRole: 'member' | 'moderator' | 'admin'
  ) {
    const result = await updateMemberRoleAdmin(circleId, memberId, newRole);
    if (result.success) {
      customToast.success('Member role updated');
      onRefresh();
    } else {
      customToast.error(result.error || 'Failed to update role');
    }
  }

  async function handleRemoveMember() {
    if (!removingMember) return;

    const result = await removeCircleMemberAdmin(circleId, removingMember.id);
    if (result.success) {
      customToast.success('Member removed from circle');
      setRemovingMember(null);
      onRefresh();
    } else {
      customToast.error(result.error || 'Failed to remove member');
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'moderator':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{members.length} total members</span>
        <span>•</span>
        <span>{members.filter((m) => m.role === 'admin').length} admins</span>
        <span>•</span>
        <span>
          {members.filter((m) => m.role === 'moderator').length} moderators
        </span>
      </div>

      {/* Members Table */}
      {filteredMembers.length > 0 ? (
        <Table aria-label="Circle members">
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Posts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="font-medium">{member.odName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value: 'member' | 'moderator' | 'admin') =>
                      handleRoleChange(member.id, value)
                    }
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Member
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
                  {member.joinedAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {member.postCount}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemovingMember(member)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          {searchTerm || roleFilter !== 'all'
            ? 'No members match your filters'
            : 'No members in this circle'}
        </div>
      )}

      {/* Remove Member Dialog */}
      <AlertDialog
        open={!!removingMember}
        onOpenChange={() => setRemovingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{removingMember?.odName}</strong> from this circle? They
              will need to rejoin or be re-invited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
