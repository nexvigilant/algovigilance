'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Eye,
  MessageSquare,
  Heart,
  Pin,
  Lock,
  EyeOff,
  Trash2,
  MoreHorizontal,
  ArrowLeft,
} from 'lucide-react';
import { VoiceLoading, VoiceEmptyStateCompact } from '@/components/voice';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn, toDate } from '@/lib/utils';
import {
  getAllPostsAdmin,
  getPostAnalytics,
  getPostAdminHistory,
  togglePostPinned,
  togglePostLocked,
  togglePostHidden,
  deletePostAdmin,
  bulkPostAction,
  type PostWithAuthor,
  type PostAnalytics,
  type PostFilters,
  type PostAdminHistoryEntry,
} from '@/lib/actions/community-posts';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import {
  CATEGORIES,
  isPostStatusFilter,
  isPostSortFilter,
} from './constants';

import { logger } from '@/lib/logger';
const log = logger.scope('posts/page');

export default function PostsAdminPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null);
  const [history, setHistory] = useState<PostAdminHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<PostFilters>({
    category: 'all',
    status: 'all',
    sortBy: 'recent',
    dateRange: 'all',
    search: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<PostWithAuthor | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadData() {
    try {
      setLoading(true);
      const [postsData, analyticsData, historyData] = await Promise.all([
        getAllPostsAdmin(filters),
        getPostAnalytics(),
        getPostAdminHistory(),
      ]);
      setPosts(postsData);
      setAnalytics(analyticsData);
      setHistory(historyData);
    } catch (error) {
      log.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadPosts() {
    try {
      const postsData = await getAllPostsAdmin(filters);
      setPosts(postsData);
    } catch (error) {
      log.error('Error loading posts:', error);
    }
  }

  async function handleTogglePin(postId: string) {
    const result = await togglePostPinned(postId);
    if (result.success) {
      loadPosts();
      toast({ title: 'Pin status updated' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleToggleLock(postId: string) {
    const result = await togglePostLocked(postId);
    if (result.success) {
      loadPosts();
      toast({ title: 'Lock status updated' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleToggleHide(postId: string) {
    const result = await togglePostHidden(postId);
    if (result.success) {
      loadPosts();
      toast({ title: 'Visibility updated' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleDelete() {
    if (!postToDelete) return;

    const result = await deletePostAdmin(postToDelete.id, deleteReason);
    if (result.success) {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      setDeleteReason('');
      loadData();
      toast({ title: 'Post deleted' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleBulkAction(
    action: 'hide' | 'unhide' | 'delete' | 'pin' | 'unpin'
  ) {
    if (selectedPosts.size === 0) return;

    setBulkActionLoading(true);
    const result = await bulkPostAction(Array.from(selectedPosts), action);
    setBulkActionLoading(false);

    if (result.success) {
      setSelectedPosts(new Set());
      loadData();
      toast({ title: `${result.count} posts updated` });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  function toggleSelectPost(postId: string) {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  }

  function toggleSelectAll() {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map((p) => p.id)));
    }
  }

  if (loading) {
    return <VoiceLoading context="admin" variant="fullpage" />;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/nucleus/admin/community"
          className="mb-4 inline-flex items-center text-sm text-slate-dim hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community Admin
        </Link>
        <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
          Post Management
        </h1>
        <p className="text-slate-dim">
          View, moderate, and manage all community posts.
        </p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-dim">Total Posts</p>
                  <p className="text-2xl font-bold">{analytics.totalPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Eye className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-dim">Total Views</p>
                  <p className="text-2xl font-bold">
                    {analytics.totalViews.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-red-500/10 p-3">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-dim">Reactions</p>
                  <p className="text-2xl font-bold">
                    {analytics.totalReactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <MessageSquare className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-dim">Replies</p>
                  <p className="text-2xl font-bold">
                    {analytics.totalReplies.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">All Posts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">Admin History</TabsTrigger>
        </TabsList>

        {/* Posts List */}
        <TabsContent value="posts">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-dim" />
                  <Input
                    placeholder="Search posts..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) => {
                    if (isPostStatusFilter(value)) {
                      setFilters({ ...filters, status: value });
                    }
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="pinned">Pinned</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => {
                    if (isPostSortFilter(value)) {
                      setFilters({ ...filters, sortBy: value });
                    }
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Views</SelectItem>
                    <SelectItem value="replies">Most Replies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedPosts.size > 0 && (
            <Card className="mb-4 border-primary">
              <CardContent className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">
                  {selectedPosts.size} post(s) selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('hide')}
                    disabled={bulkActionLoading}
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('unhide')}
                    disabled={bulkActionLoading}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Unhide
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('pin')}
                    disabled={bulkActionLoading}
                  >
                    <Pin className="mr-2 h-4 w-4" />
                    Pin
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                    disabled={bulkActionLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-4 text-left">
                        <Checkbox
                          checked={selectedPosts.size === posts.length && posts.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-4 text-left text-sm font-medium">Post</th>
                      <th className="p-4 text-left text-sm font-medium">Author</th>
                      <th className="p-4 text-left text-sm font-medium">Stats</th>
                      <th className="p-4 text-left text-sm font-medium">Status</th>
                      <th className="p-4 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        className={cn(
                          'border-b hover:bg-muted/50',
                          post.isHidden && 'opacity-50'
                        )}
                      >
                        <td className="p-4">
                          <Checkbox
                            checked={selectedPosts.has(post.id)}
                            onCheckedChange={() => toggleSelectPost(post.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="max-w-[300px]">
                            <p className="font-medium truncate">{post.title}</p>
                            <p className="text-sm text-slate-dim">
                              {post.category} •{' '}
                              {formatDistanceToNow(
                                toDate(post.createdAt),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{post.authorName}</p>
                            <p className="text-sm text-slate-dim">
                              {post.authorEmail}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3 text-sm text-slate-dim">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.viewCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {Object.values(post.reactionCounts || {}).reduce(
                                (a, b) => a + b,
                                0
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {post.replyCount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {post.isPinned && (
                              <Badge variant="secondary" className="text-xs">
                                <Pin className="mr-1 h-3 w-3" />
                                Pinned
                              </Badge>
                            )}
                            {post.isLocked && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="mr-1 h-3 w-3" />
                                Locked
                              </Badge>
                            )}
                            {post.isHidden && (
                              <Badge variant="destructive" className="text-xs">
                                <EyeOff className="mr-1 h-3 w-3" />
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleTogglePin(post.id)}
                              >
                                <Pin className="mr-2 h-4 w-4" />
                                {post.isPinned ? 'Unpin' : 'Pin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleLock(post.id)}
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                {post.isLocked ? 'Unlock' : 'Lock'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleHide(post.id)}
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                {post.isHidden ? 'Unhide' : 'Hide'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setPostToDelete(post);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {posts.length === 0 && (
                <VoiceEmptyStateCompact
                  context="posts"
                  description="No posts found"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Top Posts</CardTitle>
                <CardDescription className="text-slate-dim">By views and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.topPosts && analytics.topPosts.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                            {index + 1}
                          </span>
                          <p className="font-medium truncate max-w-[200px]">
                            {post.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-dim">
                          <span>{post.views} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-dim">No data</p>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Category Distribution</CardTitle>
                <CardDescription className="text-slate-dim">Posts by category</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.categoryDistribution && (
                  <div className="space-y-3">
                    {Object.entries(analytics.categoryDistribution).map(
                      ([category, count]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between"
                        >
                          <span className="capitalize">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-slate-light">Recent Activity</CardTitle>
                <CardDescription className="text-slate-dim">Latest posts created</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-sm text-slate-dim">
                            by {activity.authorName} • {activity.category}
                          </p>
                        </div>
                        <p className="text-sm text-slate-dim">
                          {formatDistanceToNow(activity.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-dim">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Admin Action History</CardTitle>
              <CardDescription className="text-slate-dim">
                Recent moderation actions on posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div>
                        <p className="font-medium">
                          <span className="capitalize">{action.type}</span>
                          {action.postTitle && (
                            <span className="text-slate-dim">
                              {' '}
                              - {action.postTitle}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-dim">
                          by {action.adminName}
                          {action.reason && ` • ${action.reason}`}
                        </p>
                      </div>
                      <p className="text-sm text-slate-dim">
                        {formatDistanceToNow(action.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <VoiceEmptyStateCompact
                  context="posts"
                  description="No admin actions yet"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the post "{postToDelete?.title}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason for deletion</label>
            <Textarea
              placeholder="Enter reason..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
