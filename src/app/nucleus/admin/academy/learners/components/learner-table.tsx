'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Shield,
  AlertTriangle,
  Eye,
  Mail,
  LogOut,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { suspendUser, reactivateUser, changeUserRole, forceLogout } from '@/lib/actions/learners';
import type { LearnerProfile } from '@/types/learner-management';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('components/learner-table');

interface LearnerTableProps {
  learners: LearnerProfile[];
  loading: boolean;
  onRefresh: () => void;
}

export function LearnerTable({ learners, loading, onRefresh }: LearnerTableProps) {
  const { user } = useAuth();
  const [selectedLearner, setSelectedLearner] = useState<LearnerProfile | null>(null);
  const [actionDialog, setActionDialog] = useState<'suspend' | 'role' | 'warn' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [newRole, setNewRole] = useState('');
  const [processing, setProcessing] = useState(false);

  async function handleSuspend() {
    if (!selectedLearner || !user) return;
    setProcessing(true);
    try {
      await suspendUser(
        {
          userId: selectedLearner.id,
          reason: actionReason,
          duration: suspensionDays === 'permanent' ? undefined : parseInt(suspensionDays),
        },
        user.uid
      );
      onRefresh();
      closeDialog();
    } catch (error) {
      log.error('Error suspending user:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleReactivate(learner: LearnerProfile) {
    if (!user) return;
    try {
      await reactivateUser(learner.id, 'Admin reactivation', user.uid);
      onRefresh();
    } catch (error) {
      log.error('Error reactivating user:', error);
    }
  }

  async function handleRoleChange() {
    if (!selectedLearner || !user || !newRole) return;
    setProcessing(true);
    try {
      await changeUserRole(
        {
          userId: selectedLearner.id,
          newRole: newRole as LearnerProfile['role'],
          reason: actionReason,
        },
        user.uid
      );
      onRefresh();
      closeDialog();
    } catch (error) {
      log.error('Error changing role:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleForceLogout(learner: LearnerProfile) {
    if (!user) return;
    try {
      await forceLogout(learner.id, 'Admin initiated logout', user.uid);
      onRefresh();
    } catch (error) {
      log.error('Error forcing logout:', error);
    }
  }

  function closeDialog() {
    setActionDialog(null);
    setSelectedLearner(null);
    setActionReason('');
    setSuspensionDays('7');
    setNewRole('');
  }

  function getStatusBadge(status: string) {
    return <StatusBadge status={status} />;
  }

  function getRoleBadge(role: string) {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      case 'moderator':
        return <Badge variant="secondary" className="bg-purple-500 text-white">Mod</Badge>;
      case 'professional':
        return <Badge variant="secondary" className="bg-blue-500 text-white">Pro</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center text-muted-foreground">
          Loading learners...
        </div>
      </div>
    );
  }

  if (learners.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center text-muted-foreground">
          No learners found matching your criteria.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table aria-label="Academy learners table">
          <TableHeader>
            <TableRow>
              <TableHead>Learner</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Warnings</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {learners.map((learner) => (
              <TableRow key={learner.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={learner.photoURL} />
                      <AvatarFallback>
                        {learner.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{learner.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        {learner.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(learner.role)}</TableCell>
                <TableCell>{getStatusBadge(learner.status)}</TableCell>
                <TableCell>
                  <span className="font-medium">{learner.enrollmentCount}</span>
                  <span className="text-muted-foreground text-sm">
                    {' '}/ {learner.completedCount} done
                  </span>
                </TableCell>
                <TableCell>
                  {learner.warningCount > 0 ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                      <AlertTriangle className="h-3 w-3" />
                      {learner.warningCount}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {toDateFromSerialized(learner.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/nucleus/admin/academy/learners/${learner.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedLearner(learner);
                          setNewRole(learner.role);
                          setActionDialog('role');
                        }}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleForceLogout(learner)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Force Logout
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {learner.status === 'suspended' ? (
                        <DropdownMenuItem
                          onClick={() => handleReactivate(learner)}
                          className="text-green-600"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLearner(learner);
                            setActionDialog('suspend');
                          }}
                          className="text-destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={actionDialog === 'suspend'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend {selectedLearner?.displayName}&apos;s account. They will be unable to access the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={suspensionDays} onValueChange={setSuspensionDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Provide a reason for this suspension..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!actionReason || processing}
            >
              {processing ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={actionDialog === 'role'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update {selectedLearner?.displayName}&apos;s role and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="practitioner">Practitioner</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Provide a reason for this role change..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={!actionReason || !newRole || processing}
            >
              {processing ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
