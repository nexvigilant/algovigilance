'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Shield,
  UserX,
  UserCheck,
  AlertTriangle,
  Clock,
  History,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import type {
  LearnerProfile,
  UserWarning,
  UserRestriction,
  AdminAction,
} from '@/types/learner-management';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('[userId]/learner-profile-view');

interface LearnerProfileViewProps {
  learner: LearnerProfile;
  warnings: UserWarning[];
  restrictions: UserRestriction[];
  adminActions: AdminAction[];
}

export function LearnerProfileView({
  learner,
  warnings,
  restrictions,
  adminActions,
}: LearnerProfileViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [actionDialog, setActionDialog] = useState<'suspend' | 'role' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [newRole, setNewRole] = useState(learner.role);
  const [processing, setProcessing] = useState(false);

  async function handleSuspend() {
    if (!user) return;
    setProcessing(true);
    try {
      await suspendUser(
        {
          userId: learner.id,
          reason: actionReason,
          duration: suspensionDays === 'permanent' ? undefined : parseInt(suspensionDays),
        },
        user.uid
      );
      router.refresh();
      closeDialog();
    } catch (error) {
      log.error('Error suspending user:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleReactivate() {
    if (!user) return;
    try {
      await reactivateUser(learner.id, 'Admin reactivation from profile', user.uid);
      router.refresh();
    } catch (error) {
      log.error('Error reactivating user:', error);
    }
  }

  async function handleRoleChange() {
    if (!user || !newRole) return;
    setProcessing(true);
    try {
      await changeUserRole(
        {
          userId: learner.id,
          newRole: newRole as LearnerProfile['role'],
          reason: actionReason,
        },
        user.uid
      );
      router.refresh();
      closeDialog();
    } catch (error) {
      log.error('Error changing role:', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleForceLogout() {
    if (!user) return;
    try {
      await forceLogout(learner.id, 'Admin initiated logout from profile', user.uid);
      router.refresh();
    } catch (error) {
      log.error('Error forcing logout:', error);
    }
  }

  function closeDialog() {
    setActionDialog(null);
    setActionReason('');
  }

  function getStatusBadge(status: string) {
    return <StatusBadge status={status} />;
  }

  function getWarningLevelBadge(level: number) {
    const colors = {
      1: 'bg-yellow-500',
      2: 'bg-orange-500',
      3: 'bg-red-500',
      4: 'bg-red-700',
      5: 'bg-red-900',
    };
    return (
      <Badge className={colors[level as keyof typeof colors] || 'bg-gray-500'}>
        Level {level}
      </Badge>
    );
  }

  const activeWarnings = warnings.filter((w) => w.active);
  const _activeRestrictions = restrictions.filter((r) => r.active);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/nucleus/admin/academy/learners">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Learner Profile</h1>
            <p className="text-muted-foreground">
              View and manage learner account details
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={learner.photoURL} />
                <AvatarFallback className="text-2xl">
                  {learner.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold">{learner.displayName}</h2>
                    {getStatusBadge(learner.status)}
                    <Badge variant="outline">{learner.role}</Badge>
                  </div>
                  <p className="text-muted-foreground">{learner.email}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Joined</p>
                    <p className="font-medium">
                      {toDateFromSerialized(learner.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Enrollments</p>
                    <p className="font-medium">{learner.enrollmentCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p className="font-medium">{learner.completedCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contribution</p>
                    <p className="font-medium">{learner.contributionScore}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActionDialog('role')}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Change Role
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleForceLogout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Force Logout
                  </Button>
                  {learner.status === 'suspended' ? (
                    <Button
                      size="sm"
                      onClick={handleReactivate}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Reactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setActionDialog('suspend')}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {activeWarnings.length > 0 && (
          <Card className="border-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Warnings ({activeWarnings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeWarnings.map((warning) => (
                  <div
                    key={warning.warningId}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <div className="flex items-center gap-2">
                      {getWarningLevelBadge(warning.level)}
                      <span className="text-sm">{warning.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {toDateFromSerialized(warning.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              Action History
            </TabsTrigger>
            <TabsTrigger value="warnings" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({warnings.length})
            </TabsTrigger>
            <TabsTrigger value="restrictions" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Restrictions ({restrictions.length})
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Enrollments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {adminActions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No admin actions recorded for this user.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {adminActions.map((action) => (
                      <div
                        key={action.actionId}
                        className="flex items-start justify-between p-3 border rounded"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{action.actionType}</Badge>
                            {action.reversed && (
                              <Badge variant="secondary">Reversed</Badge>
                            )}
                          </div>
                          <p className="text-sm">{action.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {action.performedBy.slice(0, 8)}...
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {toDateFromSerialized(action.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warnings" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {warnings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No warnings issued to this user.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {warnings.map((warning) => (
                      <div
                        key={warning.warningId}
                        className={`p-3 border rounded ${
                          !warning.active ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getWarningLevelBadge(warning.level)}
                              <Badge variant="outline">{warning.type}</Badge>
                              {!warning.active && (
                                <Badge variant="secondary">Expired</Badge>
                              )}
                              {warning.acknowledged && (
                                <Badge variant="outline" className="text-green-500">
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{warning.message}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {toDateFromSerialized(warning.issuedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restrictions" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {restrictions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No restrictions applied to this user.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {restrictions.map((restriction) => (
                      <div
                        key={restriction.restrictionId}
                        className={`p-3 border rounded ${
                          !restriction.active ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={restriction.active ? 'destructive' : 'secondary'}
                              >
                                {restriction.type}
                              </Badge>
                              {!restriction.active && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm">{restriction.reason}</p>
                            {restriction.expiresAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Expires: {toDateFromSerialized(restriction.expiresAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {toDateFromSerialized(restriction.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments" className="mt-4">
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                Enrollment management coming soon.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={actionDialog === 'suspend'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend {learner.displayName}&apos;s account.
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
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Reason for suspension..."
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
              {processing ? 'Suspending...' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={actionDialog === 'role'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update {learner.displayName}&apos;s role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as LearnerProfile['role'])}>
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
                placeholder="Reason for role change..."
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
              disabled={!actionReason || processing}
            >
              {processing ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
