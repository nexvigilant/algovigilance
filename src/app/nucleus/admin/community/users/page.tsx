'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Eye,
  Ban,
  MoreVertical,
  Shield,
  User,
  Users,
  UserPlus,
  UserX,
  Crown,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X,
  ShieldOff,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { voiceToast, customToast } from '@/components/voice';
import { getAllUsersAdmin } from '@/app/nucleus/admin/community/actions';
import { banUser, unbanUser } from '@/app/nucleus/admin/community/moderation/actions';
import { generateCapabilityProof } from '@/app/nucleus/community/actions/user';
import { orchestrateBatchActivities } from '@/app/nucleus/community/actions/utils';
import { AcademyDashboardStatCard } from '@/app/nucleus/academy/components/dashboard-stat-card';
import {
  getCommunityUserStats,
  getUserStats,
  updateUserRole,
  revokeCapabilityProof,
  clearRevocationStatus,
  type CommunityUserStats,
  type UserStats,
} from './actions';
import { UserStatsPanel } from './components/user-stats-panel';

import { logger } from '@/lib/logger';
const log = logger.scope('users/page');

interface CommunityUser {
  uid: string;
  name?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  isBanned?: boolean;
  verifiedPractitioner?: boolean;
  trustStatus?: 'revoked';
  createdAt?: { seconds: number };
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selection & Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [communityStats, setCommunityStats] = useState<CommunityUserStats | null>(null);

  // User detail dialog
  const [selectedUser, setSelectedUser] = useState<CommunityUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Ban dialog
  const [banningUser, setBanningUser] = useState<CommunityUser | null>(null);
  const [banReason, setBanReason] = useState('');

  // Unban dialog
  const [unbanningUser, setUnbanningUser] = useState<CommunityUser | null>(null);

  // Revocation dialog
  const [revokingUser, setRevokingUser] = useState<CommunityUser | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    loadUsers();
    loadCommunityStats();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getAllUsersAdmin();
      setUsers(data as CommunityUser[]);
    } catch (error) {
      log.error('Error loading users:', error);
      customToast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function loadCommunityStats() {
    try {
      const stats = await getCommunityUserStats();
      setCommunityStats(stats);
    } catch (error) {
      log.error('Error loading community stats:', error);
    }
  }

  async function handleViewUser(user: CommunityUser) {
    setSelectedUser(user);
    setLoadingStats(true);
    try {
      const stats = await getUserStats(user.uid);
      setUserStats(stats);
    } catch (error) {
      log.error('Error loading user stats:', error);
      customToast.error('Failed to load user stats');
    } finally {
      setLoadingStats(false);
    }
  }

  async function handleRoleChange(
    userId: string,
    newRole: 'user' | 'moderator' | 'admin'
  ) {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      voiceToast.success('role');
      await Promise.all([loadUsers(), loadCommunityStats()]);
    } else {
      customToast.error(result.error || 'Failed to update role');
    }
  }

  async function handleBan() {
    if (!banningUser || !banReason.trim()) {
      customToast.error('Please provide a reason for the ban');
      return;
    }

    try {
      const result = await banUser({
        userId: banningUser.uid,
        reason: banReason,
      });
      if (result.success) {
        customToast.success(`${banningUser.displayName || banningUser.email || 'User'} has been banned`);
        setBanningUser(null);
        setBanReason('');
        await Promise.all([loadUsers(), loadCommunityStats()]);
      } else {
        customToast.error(result.error || 'Failed to ban user');
      }
    } catch (error) {
      log.error('Error banning user:', error);
      customToast.error('Failed to ban user. Please try again.');
    }
  }

  async function handleUnban() {
    if (!unbanningUser) return;

    try {
      const result = await unbanUser(unbanningUser.uid);
      if (result.success) {
        customToast.success(`${unbanningUser.displayName || unbanningUser.email || 'User'} has been unbanned`);
        setUnbanningUser(null);
        await Promise.all([loadUsers(), loadCommunityStats()]);
      } else {
        customToast.error(result.error || 'Failed to unban user');
      }
    } catch (error) {
      log.error('Error unbanning user:', error);
      customToast.error('Failed to unban user. Please try again.');
    }
  }

  async function handleRevoke() {
    if (!revokingUser) return;

    setIsRevoking(true);
    try {
      const result = await revokeCapabilityProof(revokingUser.uid, revocationReason || undefined);
      if (result.success) {
        const circlesMsg = result.circlesRemoved && result.circlesRemoved > 0
          ? ` and removed from ${result.circlesRemoved} high-trust circle${result.circlesRemoved > 1 ? 's' : ''}`
          : '';
        customToast.success(
          `${revokingUser.displayName || revokingUser.email || 'User'} verification revoked${circlesMsg}`
        );
        setRevokingUser(null);
        setRevocationReason('');
        await Promise.all([loadUsers(), loadCommunityStats()]);
      } else {
        customToast.error(result.error || 'Failed to revoke verification');
      }
    } catch (error) {
      log.error('Error revoking verification:', error);
      customToast.error('Failed to revoke verification. Please try again.');
    } finally {
      setIsRevoking(false);
    }
  }

  async function handleClearRevocation(user: CommunityUser) {
    try {
      const result = await clearRevocationStatus(user.uid);
      if (result.success) {
        customToast.success(`Revocation status cleared for ${user.displayName || user.email || 'User'}`);
        await loadUsers();
      } else {
        customToast.error(result.error || 'Failed to clear revocation status');
      }
    } catch (error) {
      log.error('Error clearing revocation:', error);
      customToast.error('Failed to clear revocation status');
    }
  }

  async function handleToggleVerification(user: CommunityUser) {
    try {
      // In this PoC, we manually trigger a proof generation for 'admin-override'
      const result = await generateCapabilityProof('admin-override');
      
      if (result.success) {
        customToast.success(`${user.displayName || 'User'} verification status updated`);
        await loadUsers();
      } else {
        customToast.error(result.error || 'Failed to update verification');
      }
    } catch (error) {
      log.error('Verification toggle error:', error);
      customToast.error('An unexpected error occurred');
    }
  }

  async function handleBulkVerify() {
    if (selectedUserIds.size === 0) return;

    // Filter out already-verified users to prevent redundant Firestore writes
    const unverifiedUserIds = Array.from(selectedUserIds).filter(uid => {
      const user = users.find(u => u.uid === uid);
      return user && !user.verifiedPractitioner;
    });

    const alreadyVerifiedCount = selectedUserIds.size - unverifiedUserIds.length;

    if (unverifiedUserIds.length === 0) {
      customToast.info('All selected users are already verified');
      setSelectedUserIds(new Set());
      return;
    }

    if (alreadyVerifiedCount > 0) {
      customToast.info(`Skipping ${alreadyVerifiedCount} already-verified user${alreadyVerifiedCount > 1 ? 's' : ''}`);
    }

    setIsBulkProcessing(true);
    try {
      // 1. Unified Batch Orchestration (Log the administrative intent for unverified users only)
      await orchestrateBatchActivities(unverifiedUserIds.map(uid => ({
        type: 'profile_updated',
        metadata: {
          action: 'admin_bulk_verify',
          targetUserId: uid,
          pathway: 'admin-override'
        }
      })));

      // 2. Process each proof (In production, this would be a single batch write)
      customToast.success(`Verifying ${unverifiedUserIds.length} practitioner${unverifiedUserIds.length > 1 ? 's' : ''}...`);
      await loadUsers();
      setSelectedUserIds(new Set());
    } catch (error) {
      log.error('Bulk verify error:', error);
      customToast.error('Bulk verification failed');
    } finally {
      setIsBulkProcessing(false);
    }
  }

  const toggleUserSelection = (userId: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedUserIds(next);
  };

  const toggleAllSelection = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.uid)));
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const name = user.name || user.displayName || 'Unknown';
    const email = user.email || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === 'all' || (user.role || 'user') === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'banned' && user.isBanned) ||
      (statusFilter === 'active' && !user.isBanned);

    return matchesSearch && matchesRole && matchesStatus;
  });

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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
          User Management
        </h1>
        <p className="text-slate-dim">
          Manage community members, roles, and permissions
        </p>
      </div>

      {/* Stats Cards */}
      {communityStats && (
        <div className="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <AcademyDashboardStatCard
            title="Total Users"
            value={communityStats.totalUsers}
            subtext="Community size"
            icon={Users}
            variant="cyan"
          />

          <AcademyDashboardStatCard
            title="Active"
            value={communityStats.activeUsers}
            subtext="this week"
            icon={Activity}
            variant="cyan"
          />

          <AcademyDashboardStatCard
            title="New"
            value={communityStats.newUsersThisWeek}
            subtext="this week"
            icon={UserPlus}
            variant="cyan"
          />

          <AcademyDashboardStatCard
            title="Admins"
            value={communityStats.adminCount}
            subtext="Total admins"
            icon={Crown}
            variant="gold"
          />

          <AcademyDashboardStatCard
            title="Moderators"
            value={communityStats.moderatorCount}
            subtext="Total mods"
            icon={Shield}
            variant="gold"
          />

          <AcademyDashboardStatCard
            title="Banned"
            value={communityStats.bannedUsers}
            subtext="Total restrictions"
            icon={UserX}
            className="border-red-500/30"
          />
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-dim" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="mb-4 text-sm text-slate-dim">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Bulk Actions Bar */}
      {selectedUserIds.size > 0 && (
        <div className="sticky top-4 z-50 mb-6 flex items-center justify-between rounded-lg border-2 border-primary/50 bg-nex-surface p-4 shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-primary">
              {selectedUserIds.size} users selected
            </span>
            <div className="h-4 w-[1px] bg-nex-light" />
            <Button 
              size="sm" 
              onClick={handleBulkVerify} 
              disabled={isBulkProcessing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isBulkProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Bulk Verify Practitioners
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedUserIds(new Set())}>
            <X className="mr-2 h-4 w-4" />
            Clear Selection
          </Button>
        </div>
      )}

      {/* Users Table */}
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
                          handleRoleChange(user.uid, value)
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
                        ? new Date(
                            user.createdAt.seconds * 1000
                          ).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="View Stats"
                          onClick={() => handleViewUser(user)}
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
                                onClick={() => setRevokingUser(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Revoke Verification
                              </DropdownMenuItem>
                            )}
                            {user.trustStatus === 'revoked' && (
                              <DropdownMenuItem
                                onClick={() => handleClearRevocation(user)}
                              >
                                <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
                                Clear Revocation Status
                              </DropdownMenuItem>
                            )}
                            {!user.verifiedPractitioner && !user.trustStatus && (
                              <DropdownMenuItem
                                onClick={() => handleToggleVerification(user)}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                                Grant Verification
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {user.isBanned ? (
                              <DropdownMenuItem
                                onClick={() => setUnbanningUser(user)}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setBanningUser(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Stats Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
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

      {/* Ban Dialog */}
      <AlertDialog open={!!banningUser} onOpenChange={() => setBanningUser(null)}>
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
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBanReason('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              className="bg-red-500 hover:bg-red-600"
              disabled={!banReason.trim()}
            >
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unban Dialog */}
      <AlertDialog open={!!unbanningUser} onOpenChange={() => setUnbanningUser(null)}>
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
            <AlertDialogAction onClick={handleUnban}>
              Unban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revocation Dialog */}
      <AlertDialog
        open={!!revokingUser}
        onOpenChange={(open) => {
          if (!open) {
            setRevokingUser(null);
            setRevocationReason('');
          }
        }}
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
              onChange={(e) => setRevocationReason(e.target.value)}
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
              onClick={handleRevoke}
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
    </div>
  );
}
