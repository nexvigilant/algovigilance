'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Edit, Archive, Trash2, CheckCircle2, XCircle, Sparkles, Upload, MoreVertical, ImageIcon, Loader2 } from 'lucide-react';
import { VoiceLoading, VoiceEmptyState, customToast } from '@/components/voice';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
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
// Note: Using admin SDK actions instead: updateCourseStatusAdmin, deleteCourseAdmin
// import { updateCourseStatus, archiveCourse, deleteCourse } from '@/app/nucleus/admin/academy/actions';
import { deleteCourseAdmin, updateCourseStatusAdmin, getAllCoursesAdmin } from '@/app/nucleus/admin/academy/admin-actions';
import type { Course } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('courses/page');

export default function CoursesManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      // Use admin SDK server action to fetch all courses
      const coursesData = await getAllCoursesAdmin();
      setCourses(coursesData);
    } catch (error) {
      log.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(courseId: string, title: string) {
    if (!confirm(`Publish "${title}"? This will make it visible to all students.`)) {
      return;
    }

    try {
      const result = await updateCourseStatusAdmin(courseId, 'published');
      if (result.success) {
        await loadCourses(); // Reload to show updated status
      } else {
        customToast.error(result.error || 'Failed to publish course');
      }
    } catch (error) {
      log.error('Error publishing course:', error);
      customToast.error('Failed to publish course');
    }
  }

  async function handleUnpublish(courseId: string, title: string) {
    if (!confirm(`Unpublish "${title}"? This will hide it from students.`)) {
      return;
    }

    try {
      const result = await updateCourseStatusAdmin(courseId, 'draft');
      if (result.success) {
        await loadCourses();
      } else {
        customToast.error(result.error || 'Failed to unpublish course');
      }
    } catch (error) {
      log.error('Error unpublishing course:', error);
      customToast.error('Failed to unpublish course');
    }
  }

  async function handleArchive(courseId: string, title: string) {
    if (!confirm(`Archive "${title}"? You can restore it later if needed.`)) {
      return;
    }

    try {
      const result = await updateCourseStatusAdmin(courseId, 'archived');
      if (result.success) {
        await loadCourses();
      } else {
        customToast.error(result.error || 'Failed to archive course');
      }
    } catch (error) {
      log.error('Error archiving course:', error);
      customToast.error('Failed to archive course');
    }
  }

  async function handleDelete(courseId: string, title: string) {
    // Simplified confirmation for testing
    if (!confirm(`Delete "${title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteCourseAdmin(courseId);
      if (result.success) {
        await loadCourses();
        setSelectedCourses(prev => prev.filter(id => id !== courseId));
      } else {
        customToast.error(result.error || 'Failed to delete course');
      }
    } catch (error) {
      log.error('Error deleting course:', error);
      customToast.error('Failed to delete course');
    }
  }

  async function handleBulkDelete() {
    if (selectedCourses.length === 0) {
      customToast.error('No courses selected');
      return;
    }

    if (!confirm(`Delete ${selectedCourses.length} selected course(s)?\n\nThis action cannot be undone.`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const courseId of selectedCourses) {
      try {
        const result = await deleteCourseAdmin(courseId);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        log.error(`Error deleting course ${courseId}:`, error);
        failCount++;
      }
    }

    await loadCourses();
    setSelectedCourses([]);
    setBulkDeleteMode(false);

    if (failCount > 0) {
      customToast.error(`Deleted ${successCount} course(s), ${failCount} failed`);
    } else {
      customToast.success(`Successfully deleted ${successCount} course(s)`);
    }
  }

  async function handleDeleteAllDrafts() {
    const draftCourses = courses.filter(c => c.status === 'draft');

    if (draftCourses.length === 0) {
      customToast.info('No draft courses to delete');
      return;
    }

    if (!confirm(`Delete ALL ${draftCourses.length} draft course(s)?\n\nThis action cannot be undone.`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const course of draftCourses) {
      try {
        const result = await deleteCourseAdmin(course.id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        log.error(`Error deleting course ${course.id}:`, error);
        failCount++;
      }
    }

    await loadCourses();
    setSelectedCourses([]);

    if (failCount > 0) {
      customToast.error(`Deleted ${successCount} draft course(s), ${failCount} failed`);
    } else {
      customToast.success(`Successfully deleted ${successCount} draft course(s)`);
    }
  }

  async function handleGenerateThumbnail(courseId: string, title: string) {
    setGeneratingThumbnail(courseId);
    try {
      const response = await fetch('/api/admin/academy/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, style: 'professional' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate thumbnail');
      }

      const _result = await response.json();
      await loadCourses(); // Reload to show updated thumbnail

      customToast.success(`Thumbnail generated for "${title}"`);
    } catch (error) {
      log.error('Error generating thumbnail:', error);
      customToast.error(error instanceof Error ? error.message : 'Failed to generate thumbnail');
    } finally {
      setGeneratingThumbnail(null);
    }
  }

  async function handleBulkGenerateThumbnails() {
    const coursesWithoutThumbnails = courses.filter(c => !c.metadata?.thumbnailUrl);

    if (coursesWithoutThumbnails.length === 0) {
      customToast.info('All courses already have thumbnails!');
      return;
    }

    if (!confirm(`Generate thumbnails for ${coursesWithoutThumbnails.length} course(s)?\n\nThis may take a few minutes.`)) {
      return;
    }

    setBulkGenerating(true);
    setBulkProgress({ current: 0, total: coursesWithoutThumbnails.length });

    try {
      const response = await fetch('/api/admin/academy/generate-thumbnails-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: 'professional' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate thumbnails');
      }

      const result = await response.json();
      await loadCourses();

      customToast.success(`Thumbnails generated: ${result.summary.succeeded} succeeded, ${result.summary.failed} failed`);
    } catch (error) {
      log.error('Error in bulk thumbnail generation:', error);
      customToast.error(error instanceof Error ? error.message : 'Failed to generate thumbnails');
    } finally {
      setBulkGenerating(false);
      setBulkProgress(null);
    }
  }

  function toggleCourseSelection(courseId: string) {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  }

  function toggleSelectAll() {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map(c => c.id));
    }
  }

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    const matchesTopic = topicFilter === 'all' || course.topic === topicFilter;

    return matchesSearch && matchesStatus && matchesTopic;
  });

  // Get unique topics for filter (filter out undefined/null/empty values)
  const topics = Array.from(
    new Set(
      courses
        .map(c => c.topic)
        .filter(topic => topic && topic.trim().length > 0)
    )
  ).sort();

  const statusIcons: Record<string, typeof Edit> = { published: CheckCircle2, draft: Edit, archived: Archive };
  function getStatusBadge(status: string | undefined | null) {
    const s = status?.trim() || 'draft';
    return <StatusBadge status={s} icon={statusIcons[s]} />;
  }

  function getQualityBadge(score: number) {
    if (score >= 80) {
      return <Badge className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">High Quality</Badge>;
    } else if (score >= 60) {
      return <Badge variant="outline">Good</Badge>;
    } else {
      return <Badge variant="secondary">Needs Review</Badge>;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">Course Management</h1>
          <p className="text-slate-dim">
            Create and manage Academy courses
          </p>
        </div>
        <div className="flex gap-2">
          {bulkDeleteMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setBulkDeleteMode(false);
                  setSelectedCourses([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={selectedCourses.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedCourses.length})
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setBulkDeleteMode(true)}
                title="Bulk Delete Mode"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Bulk Delete
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteAllDrafts}
                title="Delete all draft courses"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Clear Drafts
              </Button>
              <Button variant="outline" asChild>
                <Link href="/nucleus/admin/academy/courses/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Manually
                </Link>
              </Button>
              <Button asChild className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
                <Link href="/nucleus/admin/academy/courses/generate">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-dim" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics.map(topic => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-sm text-slate-dim">Total Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{courses.filter(c => c.status === 'published').length}</div>
            <p className="text-sm text-slate-dim">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{courses.filter(c => c.status === 'draft').length}</div>
            <p className="text-sm text-slate-dim">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{courses.filter(c => c.qualityScore >= 80).length}</div>
            <p className="text-sm text-slate-dim">High Quality</p>
          </CardContent>
        </Card>
        <Card className={courses.filter(c => !c.metadata?.thumbnailUrl).length > 0 ? 'border-amber-500/30' : 'border-green-500/30'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${courses.filter(c => !c.metadata?.thumbnailUrl).length > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                  {courses.filter(c => !c.metadata?.thumbnailUrl).length}
                </div>
                <p className="text-sm text-slate-dim">Missing Thumbnails</p>
              </div>
              {courses.filter(c => !c.metadata?.thumbnailUrl).length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkGenerateThumbnails}
                  disabled={bulkGenerating}
                  className="text-xs"
                >
                  {bulkGenerating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Generate All
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <VoiceLoading context="admin" variant="spinner" message="Loading courses..." />
          ) : filteredCourses.length === 0 ? (
            <VoiceEmptyState
              context="courses"
              title={searchTerm || statusFilter !== 'all' || topicFilter !== 'all'
                ? 'No courses match your filters'
                : 'No courses found'}
              description="Create your first course to get started"
              variant="inline"
              size="lg"
              action={{
                label: 'Create Your First Course',
                href: '/nucleus/admin/academy/courses/new',
              }}
            />
          ) : (
            <Table aria-label="Academy courses management table">
              <TableHeader>
                <TableRow>
                  {bulkDeleteMode && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4"
                      />
                    </TableHead>
                  )}
                  <TableHead>Course</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead className="text-right">Modules</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    {bulkDeleteMode && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => toggleCourseSelection(course.id)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <Link
                          href={`/nucleus/admin/academy/courses/${course.id}/preview`}
                          className="font-medium hover:text-cyan transition-colors hover:underline"
                        >
                          {course.title}
                        </Link>
                        <div className="text-sm text-slate-dim line-clamp-1">
                          {course.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{course.topic}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                    <TableCell>{getQualityBadge(course.qualityScore)}</TableCell>
                    <TableCell className="text-right">{course.modules.length}</TableCell>
                    <TableCell className="text-right">
                      {Math.floor(course.metadata.estimatedDuration / 60)}h {Math.round(course.metadata.estimatedDuration % 60)}m
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Actions */}
                        <Link
                          href={`/nucleus/admin/academy/courses/${course.id}/preview`}
                          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/nucleus/admin/academy/courses/${course.id}/edit`}
                          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        {/* Publish/Unpublish Button */}
                        {course.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(course.id, course.title)}
                            title="Publish course"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                        {course.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnpublish(course.id, course.title)}
                            title="Unpublish course"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* More Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleGenerateThumbnail(course.id, course.title)}
                              disabled={generatingThumbnail === course.id}
                            >
                              {generatingThumbnail === course.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  {course.metadata?.thumbnailUrl ? 'Regenerate Thumbnail' : 'Generate Thumbnail'}
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {course.status !== 'archived' && (
                              <DropdownMenuItem onClick={() => handleArchive(course.id, course.title)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}

                            {course.status === 'archived' && (
                              <DropdownMenuItem onClick={() => handleUnpublish(course.id, course.title)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Restore to Draft
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(course.id, course.title)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Permanently
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
    </div>
  );
}
