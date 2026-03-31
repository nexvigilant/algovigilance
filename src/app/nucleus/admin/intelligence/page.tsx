'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Eye,
  RefreshCw,
  Loader2,
} from 'lucide-react';

import { Breadcrumbs } from '@/components/layout/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';

import type { ContentType, ContentStatus, IntelligenceListItem } from '@/types/intelligence';
import { CONTENT_TYPE_CONFIG } from '@/types/intelligence';
import {
  getIntelligenceList,
  getIntelligenceStats,
  deleteIntelligence,
  toggleFeatured,
  updateContentStatus,
} from '@/lib/actions/intelligence';
import { STATUS_COLORS, TYPE_ICONS } from './components/constants';

export default function IntelligenceAdminPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<IntelligenceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    total: number;
    published: number;
    draft: number;
    review: number;
    archived: number;
    byType: Record<ContentType, number>;
    featured: number;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [listResult, statsResult] = await Promise.all([
        getIntelligenceList({
          type: typeFilter !== 'all' ? typeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        getIntelligenceStats(),
      ]);

      if (listResult.success && listResult.items) {
        setItems(listResult.items);
      } else {
        toast({
          title: 'Error',
          description: listResult.error || 'Failed to load content',
          variant: 'destructive',
        });
      }

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setActionLoading(deleteId);
    const result = await deleteIntelligence(deleteId);

    if (result.success) {
      toast({ title: 'Success', description: 'Content deleted successfully' });
      setItems((prev) => prev.filter((item) => item.id !== deleteId));
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete content',
        variant: 'destructive',
      });
    }

    setDeleteId(null);
    setActionLoading(null);
  };

  const handleToggleFeatured = async (id: string) => {
    setActionLoading(id);
    const result = await toggleFeatured(id);

    if (result.success) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, featured: result.featured ?? false } : item
        )
      );
      toast({
        title: result.featured ? 'Featured' : 'Unfeatured',
        description: `Content ${result.featured ? 'marked as featured' : 'removed from featured'}`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update featured status',
        variant: 'destructive',
      });
    }

    setActionLoading(null);
  };

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    setActionLoading(id);
    const result = await updateContentStatus(id, status);

    if (result.success) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
      toast({ title: 'Success', description: `Status updated to ${status}` });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update status',
        variant: 'destructive',
      });
    }

    setActionLoading(null);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.slug.toLowerCase().includes(query) ||
      item.author.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/nucleus/admin' },
          { label: 'Intelligence' },
        ]}
        className="mb-8"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-headline text-gold">Intelligence Content</h1>
          <p className="text-slate-dim mt-1">
            Create and manage articles, podcasts, and publications
          </p>
        </div>
        <Button
          onClick={() => router.push('/nucleus/admin/intelligence/new')}
          className="bg-cyan text-nex-deep hover:bg-cyan-glow"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-dim">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-dim">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.published}</div>
            </CardContent>
          </Card>
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-dim">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-400">{stats.draft}</div>
            </CardContent>
          </Card>
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-dim">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">{stats.review}</div>
            </CardContent>
          </Card>
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-dim">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{stats.featured}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-nex-surface border-nex-light mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-light flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim" />
              <Input
                placeholder="Search by title, slug, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-nex-dark border-nex-light"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ContentType | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-nex-dark border-nex-light">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.icon} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ContentStatus | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[150px] bg-nex-dark border-nex-light">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData} className="border-nex-light">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader>
          <CardTitle className="text-lg text-slate-light">
            Content ({filteredItems.length})
          </CardTitle>
          <CardDescription>
            Manage your Intelligence hub content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <VoiceLoading context="admin" variant="spinner" message="Loading content..." />
          ) : filteredItems.length === 0 ? (
            <VoiceEmptyState
              title="No content found"
              description={
                searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first piece of content'
              }
              icon="FileText"
              action={
                !searchQuery && typeFilter === 'all' && statusFilter === 'all'
                  ? {
                      label: 'Create Content',
                      onClick: () => router.push('/nucleus/admin/intelligence/new'),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Intelligence content management table">
                <TableHeader>
                  <TableRow className="border-nex-light hover:bg-transparent">
                    <TableHead className="text-slate-dim">Title</TableHead>
                    <TableHead className="text-slate-dim">Type</TableHead>
                    <TableHead className="text-slate-dim">Status</TableHead>
                    <TableHead className="text-slate-dim">Author</TableHead>
                    <TableHead className="text-slate-dim">Updated</TableHead>
                    <TableHead className="text-slate-dim w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-nex-light hover:bg-nex-dark/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.featured && (
                            <Star className="h-4 w-4 text-gold fill-gold" />
                          )}
                          <div>
                            <div className="font-medium text-slate-light line-clamp-1">
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-dim">{item.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-dim">
                          {TYPE_ICONS[item.type]}
                          <span className="capitalize">
                            {CONTENT_TYPE_CONFIG[item.type]?.label || item.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[item.status]}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-dim">{item.author}</TableCell>
                      <TableCell className="text-slate-dim text-sm">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/nucleus/admin/intelligence/${item.id}`)
                              }
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(`/intelligence/${item.slug}`, '_blank')
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleFeatured(item.id)}
                            >
                              {item.featured ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Unfeature
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Feature
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, 'draft')}
                              disabled={item.status === 'draft'}
                            >
                              Set as Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, 'review')}
                              disabled={item.status === 'review'}
                            >
                              Set as Review
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, 'published')}
                              disabled={item.status === 'published'}
                            >
                              Publish
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, 'archived')}
                              disabled={item.status === 'archived'}
                            >
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(item.id)}
                              className="text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-nex-surface border-nex-light">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-light">
              Delete Content
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-nex-light">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
