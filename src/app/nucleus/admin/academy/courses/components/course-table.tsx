'use client';

import Link from 'next/link';
import { Eye, Edit, Archive, CheckCircle2, Upload, XCircle, MoreVertical, Loader2, ImageIcon, Trash2 } from 'lucide-react';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
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
import type { Course } from '@/types/academy';
import { ADMIN_ACADEMY_ROUTES } from '@/lib/routes';

interface CourseTableProps {
  loading: boolean;
  courses: Course[];
  searchTerm: string;
  statusFilter: string;
  topicFilter: string;
  bulkDeleteMode: boolean;
  selectedCourses: string[];
  generatingThumbnail: string | null;
  onToggleCourseSelection: (courseId: string) => void;
  onToggleSelectAll: () => void;
  onPublish: (courseId: string, title: string) => void;
  onUnpublish: (courseId: string, title: string) => void;
  onArchive: (courseId: string, title: string) => void;
  onDelete: (courseId: string, title: string) => void;
  onGenerateThumbnail: (courseId: string, title: string) => void;
}

const statusIcons: Record<string, typeof Edit> = {
  published: CheckCircle2,
  draft: Edit,
  archived: Archive,
};

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

export function CourseTable({
  loading,
  courses,
  searchTerm,
  statusFilter,
  topicFilter,
  bulkDeleteMode,
  selectedCourses,
  generatingThumbnail,
  onToggleCourseSelection,
  onToggleSelectAll,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
  onGenerateThumbnail,
}: CourseTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <VoiceLoading context="admin" variant="spinner" message="Loading courses..." />
        ) : courses.length === 0 ? (
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
              href: ADMIN_ACADEMY_ROUTES.COURSES_NEW,
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
                      checked={selectedCourses.length === courses.length && courses.length > 0}
                      onChange={onToggleSelectAll}
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
              {courses.map((course) => (
                <TableRow key={course.id}>
                  {bulkDeleteMode && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => onToggleCourseSelection(course.id)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <Link
                        href={ADMIN_ACADEMY_ROUTES.coursePreview(course.id)}
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
                      <Link
                        href={ADMIN_ACADEMY_ROUTES.coursePreview(course.id)}
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={ADMIN_ACADEMY_ROUTES.courseEdit(course.id)}
                        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>

                      {course.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPublish(course.id, course.title)}
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
                          onClick={() => onUnpublish(course.id, course.title)}
                          title="Unpublish course"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}

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
                            onClick={() => onGenerateThumbnail(course.id, course.title)}
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
                            <DropdownMenuItem onClick={() => onArchive(course.id, course.title)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}

                          {course.status === 'archived' && (
                            <DropdownMenuItem onClick={() => onUnpublish(course.id, course.title)}>
                              <Upload className="h-4 w-4 mr-2" />
                              Restore to Draft
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(course.id, course.title)}
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
  );
}
