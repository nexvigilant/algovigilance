'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  MessageSquare,
  Users,
  Activity,
  UserPlus,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAllCirclesAdmin,
  deleteCircleAdmin,
  updateCircleStatusAdmin,
} from '@/app/nucleus/admin/community/actions';
import {
  getCircleMembersAdmin,
  getJoinRequestsAdmin,
  getCircleAnalyticsAdmin,
  getAllPendingRequestsAdmin,
  approveJoinRequestAdmin,
  rejectJoinRequestAdmin,
  type CircleMember,
  type JoinRequest,
  type CircleAnalytics,
} from './actions';
import { MembersTab } from './components/members-tab';
import { JoinRequestsTab } from './components/join-requests-tab';
import { AnalyticsTab } from './components/analytics-tab';
import type { SmartForum } from '@/types/community';
import { customToast } from '@/components/voice';
import { AcademyDashboardStatCard } from '@/app/nucleus/academy/components/dashboard-stat-card';

import { logger } from '@/lib/logger';
const log = logger.scope('circles/page');

export default function CirclesManagementPage() {
  const [circles, setCircles] = useState<SmartForum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Manage dialog state
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<SmartForum | null>(null);
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [circleRequests, setCircleRequests] = useState<JoinRequest[]>([]);
  const [circleAnalytics, setCircleAnalytics] = useState<CircleAnalytics | null>(null);
  const [loadingCircleData, setLoadingCircleData] = useState(false);

  // All pending requests
  const [allPendingRequests, setAllPendingRequests] = useState<
    Array<{ circleId: string; circleName: string; requests: JoinRequest[] }>
  >([]);

  useEffect(() => {
    loadCircles();
  }, []);

  async function loadCircles() {
    setLoading(true);
    try {
      const [circlesData, pendingData] = await Promise.all([
        getAllCirclesAdmin(),
        getAllPendingRequestsAdmin(),
      ]);
      setCircles(circlesData);
      setAllPendingRequests(pendingData);
    } catch (error) {
      log.error('Error loading circles:', error);
      customToast.error('Failed to load circles');
    } finally {
      setLoading(false);
    }
  }

  async function openManageDialog(circle: SmartForum) {
    setSelectedCircle(circle);
    setManageDialogOpen(true);
    setLoadingCircleData(true);

    try {
      const [members, requests, analytics] = await Promise.all([
        getCircleMembersAdmin(circle.id),
        getJoinRequestsAdmin(circle.id),
        getCircleAnalyticsAdmin(circle.id),
      ]);
      setCircleMembers(members);
      setCircleRequests(requests);
      setCircleAnalytics(analytics);
    } catch (error) {
      log.error('Error loading circle data:', error);
      customToast.error('Failed to load circle data');
    } finally {
      setLoadingCircleData(false);
    }
  }

  async function refreshCircleData() {
    if (!selectedCircle) return;
    const [members, requests, analytics] = await Promise.all([
      getCircleMembersAdmin(selectedCircle.id),
      getJoinRequestsAdmin(selectedCircle.id),
      getCircleAnalyticsAdmin(selectedCircle.id),
    ]);
    setCircleMembers(members);
    setCircleRequests(requests);
    setCircleAnalytics(analytics);
    // Also refresh main list
    loadCircles();
  }

  async function handleDelete(circleId: string, name: string) {
    if (
      !confirm(
        `Delete circle "${name}"?\n\nThis action cannot be undone and will remove all posts and memberships.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteCircleAdmin(circleId);
      if (result.success) {
        customToast.success('Circle deleted');
        await loadCircles();
      } else {
        customToast.error(result.error || 'Failed to delete circle');
      }
    } catch (error) {
      log.error('Error deleting circle:', error);
      customToast.error('Failed to delete circle');
    }
  }

  async function handleStatusChange(
    circleId: string,
    newStatus: 'active' | 'archived' | 'draft'
  ) {
    try {
      const result = await updateCircleStatusAdmin(circleId, newStatus);
      if (result.success) {
        customToast.success(`Circle ${newStatus === 'archived' ? 'archived' : 'restored'}`);
        await loadCircles();
      } else {
        customToast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      log.error('Error updating status:', error);
      customToast.error('Failed to update status');
    }
  }

  async function handleQuickApprove(
    circleId: string,
    requestId: string,
    userId: string,
    userName: string
  ) {
    const result = await approveJoinRequestAdmin(circleId, requestId, userId);
    if (result.success) {
      customToast.success(`${userName} approved`);
      loadCircles();
    } else {
      customToast.error(result.error || 'Failed to approve');
    }
  }

  async function handleQuickReject(
    circleId: string,
    requestId: string,
    userName: string
  ) {
    const result = await rejectJoinRequestAdmin(circleId, requestId);
    if (result.success) {
      customToast.success(`${userName}'s request rejected`);
      loadCircles();
    } else {
      customToast.error(result.error || 'Failed to reject');
    }
  }

  // Filter circles
  const filteredCircles = circles.filter((circle) => {
    const matchesSearch =
      circle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      circle.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || circle.category === categoryFilter;
    const status = circle.metadata?.isArchived ? 'archived' : 'active';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories
  const categories = Array.from(
    new Set(circles.map((c) => c.category).filter(Boolean))
  ).sort();

  // Total pending requests count
  const totalPendingRequests = allPendingRequests.reduce(
    (acc, c) => acc + c.requests.length,
    0
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
            Circle Management
          </h1>
          <p className="text-slate-dim">
            Create and manage community circles (forums)
          </p>
        </div>
        <Button asChild>
          <Link href="/nucleus/admin/community/circles/create-post">
            <Plus className="mr-2 h-4 w-4" />
            Create Circle
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <AcademyDashboardStatCard
          title="Total Circles"
          value={circles.length}
          subtext="Active forums"
          icon={MessageSquare}
          variant="cyan"
        />

        <AcademyDashboardStatCard
          title="Total Members"
          value={circles.reduce((acc, c) => acc + (c.membership?.memberCount || 0), 0)}
          subtext="Ecosystem size"
          icon={Users}
          variant="cyan"
        />

        <AcademyDashboardStatCard
          title="Total Posts"
          value={circles.reduce((acc, c) => acc + (c.stats?.postCount || 0), 0)}
          subtext="Content activity"
          icon={Activity}
          variant="cyan"
        />

        <AcademyDashboardStatCard
          title="Pending Requests"
          value={totalPendingRequests}
          subtext="Awaiting review"
          icon={UserPlus}
          variant="gold"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="circles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="circles">
            <MessageSquare className="mr-2 h-4 w-4" />
            Circles
          </TabsTrigger>
          <TabsTrigger value="requests">
            <UserPlus className="mr-2 h-4 w-4" />
            Pending Requests
            {totalPendingRequests > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalPendingRequests}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Circles Tab */}
        <TabsContent value="circles">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-dim" />
                    <Input
                      placeholder="Search circles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Circles Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : filteredCircles.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-4 text-slate-dim">No circles found</p>
                </div>
              ) : (
                <Table aria-label="Community circles">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Members</TableHead>
                      <TableHead className="text-right">Posts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCircles.map((circle) => (
                      <TableRow key={circle.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{circle.name}</div>
                            <div className="line-clamp-1 text-sm text-slate-dim">
                              {circle.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{circle.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {circle.metadata?.isArchived ? (
                            <Badge variant="secondary">Archived</Badge>
                          ) : (
                            <Badge className="border-green-500/30 bg-green-500/20 text-green-500">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {circle.membership?.memberCount || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {circle.stats?.postCount || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              title="View"
                            >
                              <Link href={`/nucleus/community/circles/${circle.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Manage"
                              onClick={() => openManageDialog(circle)}
                            >
                              <Settings className="h-4 w-4" />
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
                                  <Link
                                    href={`/nucleus/admin/community/circles/${circle.id}/edit`}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Details
                                  </Link>
                                </DropdownMenuItem>
                                {circle.metadata?.isArchived ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(circle.id, 'active')
                                    }
                                  >
                                    Restore
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(circle.id, 'archived')
                                    }
                                  >
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDelete(circle.id, circle.name)
                                  }
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
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
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardContent className="pt-6">
              {allPendingRequests.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <UserPlus className="h-6 w-6 text-slate-dim" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No Pending Requests</h3>
                  <p className="text-slate-dim">
                    All join requests have been processed.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allPendingRequests.map((circleGroup) => (
                    <div key={circleGroup.circleId}>
                      <h3 className="mb-3 font-medium">{circleGroup.circleName}</h3>
                      <div className="space-y-2">
                        {circleGroup.requests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between rounded-lg border p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <Users className="h-4 w-4 text-cyan" />
                              </div>
                              <div>
                                <div className="font-medium">{request.odName}</div>
                                <div className="text-sm text-slate-dim">
                                  {request.createdAt.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleQuickReject(
                                    circleGroup.circleId,
                                    request.id,
                                    request.odName
                                  )
                                }
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleQuickApprove(
                                    circleGroup.circleId,
                                    request.id,
                                    request.odspId,
                                    request.odName
                                  )
                                }
                              >
                                Approve
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manage Circle Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage: {selectedCircle?.name}</DialogTitle>
          </DialogHeader>

          {loadingCircleData ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="members" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="members">
                  <Users className="mr-2 h-4 w-4" />
                  Members ({circleMembers.length})
                </TabsTrigger>
                <TabsTrigger value="requests">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Requests ({circleRequests.length})
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-4">
                {selectedCircle && (
                  <MembersTab
                    circleId={selectedCircle.id}
                    members={circleMembers}
                    onRefresh={refreshCircleData}
                  />
                )}
              </TabsContent>

              <TabsContent value="requests" className="mt-4">
                {selectedCircle && (
                  <JoinRequestsTab
                    circleId={selectedCircle.id}
                    requests={circleRequests}
                    onRefresh={refreshCircleData}
                  />
                )}
              </TabsContent>

              <TabsContent value="analytics" className="mt-4">
                {circleAnalytics && <AnalyticsTab analytics={circleAnalytics} />}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
