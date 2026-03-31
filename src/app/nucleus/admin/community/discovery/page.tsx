'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Star,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Tag,
  TrendingUp,
  Layers,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
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
import { customToast } from '@/components/voice';
import {
  getAllCirclesAdmin,
  toggleFeaturedCircle,
} from '@/app/nucleus/admin/community/actions';
import {
  getDiscoveryStats,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSpotlightPosts,
  removeFromSpotlight,
  type DiscoveryStats,
  type Category,
  type SpotlightPost,
} from './actions';
import type { SmartForum } from '@/types/community';

import { logger } from '@/lib/logger';
const log = logger.scope('discovery/page');

export default function DiscoveryManagementPage() {
  const [circles, setCircles] = useState<SmartForum[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [spotlights, setSpotlights] = useState<SpotlightPost[]>([]);
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '',
  });

  // Delete category dialog
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Remove spotlight dialog
  const [removingSpotlight, setRemovingSpotlight] = useState<SpotlightPost | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [circlesData, categoriesData, spotlightsData, statsData] = await Promise.all([
        getAllCirclesAdmin(),
        getAllCategories(),
        getSpotlightPosts(),
        getDiscoveryStats(),
      ]);
      setCircles(circlesData);
      setCategories(categoriesData);
      setSpotlights(spotlightsData);
      setStats(statsData);
    } catch (error) {
      log.error('Error loading data:', error);
      customToast.error('Failed to load discovery data');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFeatured(circleId: string, currentStatus: boolean) {
    // Optimistic update
    setCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? { ...c, metadata: { ...c.metadata, isFeatured: !currentStatus } }
          : c
      )
    );

    const result = await toggleFeaturedCircle(circleId, !currentStatus);
    if (result.success) {
      customToast.success(currentStatus ? 'Removed from featured' : 'Added to featured');
      // Reload stats
      const newStats = await getDiscoveryStats();
      setStats(newStats);
    } else {
      // Revert on failure
      setCircles((prev) =>
        prev.map((c) =>
          c.id === circleId
            ? { ...c, metadata: { ...c.metadata, isFeatured: currentStatus } }
            : c
        )
      );
      customToast.error('Failed to update featured status');
    }
  }

  function openCategoryDialog(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon || '',
        color: category.color || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        icon: '',
        color: '',
      });
    }
    setCategoryDialogOpen(true);
  }

  async function handleSaveCategory() {
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      customToast.error('Name and slug are required');
      return;
    }

    if (editingCategory) {
      const result = await updateCategory(editingCategory.id, {
        name: categoryForm.name,
        description: categoryForm.description,
        icon: categoryForm.icon || undefined,
        color: categoryForm.color || undefined,
      });
      if (result.success) {
        customToast.success('Category updated');
        setCategoryDialogOpen(false);
        await loadAll();
      } else {
        customToast.error(result.error || 'Failed to update category');
      }
    } else {
      const result = await createCategory({
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description,
        icon: categoryForm.icon || undefined,
        color: categoryForm.color || undefined,
      });
      if (result.success) {
        customToast.success('Category created');
        setCategoryDialogOpen(false);
        await loadAll();
      } else {
        customToast.error(result.error || 'Failed to create category');
      }
    }
  }

  async function handleDeleteCategory() {
    if (!deletingCategory) return;

    const result = await deleteCategory(deletingCategory.id);
    if (result.success) {
      customToast.success('Category deleted');
      setDeletingCategory(null);
      await loadAll();
    } else {
      customToast.error(result.error || 'Failed to delete category');
    }
  }

  async function handleToggleCategoryActive(category: Category) {
    const result = await updateCategory(category.id, {
      isActive: !category.isActive,
    });
    if (result.success) {
      customToast.success(category.isActive ? 'Category hidden' : 'Category visible');
      await loadAll();
    } else {
      customToast.error(result.error || 'Failed to update category');
    }
  }

  async function handleRemoveSpotlight() {
    if (!removingSpotlight) return;

    const result = await removeFromSpotlight(removingSpotlight.id);
    if (result.success) {
      customToast.success('Removed from spotlight');
      setRemovingSpotlight(null);
      await loadAll();
    } else {
      customToast.error(result.error || 'Failed to remove from spotlight');
    }
  }

  // Filter circles
  const filteredCircles = circles.filter((circle) => {
    const matchesSearch =
      circle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      circle.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const featuredCount = circles.filter((c) => c.metadata?.isFeatured).length;
  const activeSpotlights = spotlights.filter((s) => s.isActive);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
          Discovery Management
        </h1>
        <p className="text-slate-dim">
          Manage featured communities, categories, and spotlight content
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-light">Categories</CardTitle>
              <Layers className="h-4 w-4 text-slate-dim" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-slate-dim">
                {stats.activeCategories} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-light">Featured</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.featuredCircles}</div>
              <p className="text-xs text-slate-dim">circles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-light">Spotlights</CardTitle>
              <Sparkles className="h-4 w-4 text-slate-dim" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.spotlightPosts}</div>
              <p className="text-xs text-slate-dim">active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-light">Trending</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-dim" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trendingTopics}</div>
              <p className="text-xs text-slate-dim">topics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-light">Total Circles</CardTitle>
              <Tag className="h-4 w-4 text-slate-dim" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{circles.length}</div>
              <p className="text-xs text-slate-dim">communities</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="featured" className="space-y-4">
        <TabsList>
          <TabsTrigger value="featured">
            Featured
            {featuredCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {featuredCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories">
            Categories
            <Badge variant="secondary" className="ml-2">
              {categories.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="spotlights">
            Spotlights
            {activeSpotlights.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeSpotlights.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Featured Tab */}
        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Featured Communities</CardTitle>
              <CardDescription className="text-slate-dim">
                Select communities to appear in the "Featured" section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-dim" />
                  <Input
                    placeholder="Search communities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table aria-label="Featured communities">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Community</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Featured</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCircles.map((circle) => (
                      <TableRow key={circle.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 font-medium">
                              {circle.name}
                              {circle.metadata?.isFeatured && (
                                <Sparkles className="h-3 w-3 text-yellow-500" />
                              )}
                            </div>
                            <div className="line-clamp-1 text-sm text-slate-dim">
                              {circle.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{circle.category}</Badge>
                        </TableCell>
                        <TableCell>{circle.membership?.memberCount || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={circle.metadata?.isFeatured || false}
                              onCheckedChange={() =>
                                handleToggleFeatured(
                                  circle.id,
                                  circle.metadata?.isFeatured || false
                                )
                              }
                            />
                            <span className="text-sm text-slate-dim">
                              {circle.metadata?.isFeatured ? 'Featured' : 'Standard'}
                            </span>
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

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-light">Categories</CardTitle>
                <CardDescription className="text-slate-dim">
                  Manage community categories and organization
                </CardDescription>
              </div>
              <Button onClick={() => openCategoryDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : categories.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-4 text-slate-dim">No categories yet</p>
                  <Button onClick={() => openCategoryDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Category
                  </Button>
                </div>
              ) : (
                <Table aria-label="Community categories">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Circles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="line-clamp-1 text-sm text-slate-dim">
                              {category.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1 text-sm">
                            {category.slug}
                          </code>
                        </TableCell>
                        <TableCell>{category.circleCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={category.isActive}
                              onCheckedChange={() => handleToggleCategoryActive(category)}
                            />
                            <span className="text-sm text-slate-dim">
                              {category.isActive ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCategoryDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingCategory(category)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        {/* Spotlights Tab */}
        <TabsContent value="spotlights">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Spotlight Posts</CardTitle>
              <CardDescription className="text-slate-dim">
                Manage featured and trending posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : activeSpotlights.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-dim">
                    No active spotlights. Add posts to spotlight from the Posts section.
                  </p>
                </div>
              ) : (
                <Table aria-label="Spotlight posts">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Post</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Circle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSpotlights.map((spotlight) => (
                      <TableRow key={spotlight.id}>
                        <TableCell>
                          <div className="max-w-xs truncate font-medium">
                            {spotlight.title}
                          </div>
                        </TableCell>
                        <TableCell>{spotlight.authorName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{spotlight.circleName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              spotlight.spotlightType === 'featured'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : spotlight.spotlightType === 'trending'
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'bg-purple-500/20 text-purple-500'
                            }
                          >
                            {spotlight.spotlightType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {spotlight.startDate.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRemovingSpotlight(spotlight)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update category details'
                : 'Add a new category for organizing communities'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="e.g., Pharmacovigilance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={categoryForm.slug}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
                placeholder="e.g., pharmacovigilance"
                disabled={!!editingCategory}
              />
              {editingCategory && (
                <p className="text-xs text-slate-dim">
                  Slug cannot be changed after creation
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, description: e.target.value })
                }
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (optional)</Label>
                <Input
                  id="icon"
                  value={categoryForm.icon}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, icon: e.target.value })
                  }
                  placeholder="e.g., shield"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color (optional)</Label>
                <Input
                  id="color"
                  value={categoryForm.color}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, color: e.target.value })
                  }
                  placeholder="e.g., #3B82F6"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingCategory?.name}</strong>?
              This action cannot be undone.
              {deletingCategory && deletingCategory.circleCount > 0 && (
                <span className="mt-2 block text-red-500">
                  Warning: {deletingCategory.circleCount} circles use this category.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Spotlight Dialog */}
      <AlertDialog
        open={!!removingSpotlight}
        onOpenChange={() => setRemovingSpotlight(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Spotlight</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this post from the spotlight?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveSpotlight}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
