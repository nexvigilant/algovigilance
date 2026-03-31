'use client';

import Link from 'next/link';
import { Plus, XCircle, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_ACADEMY_ROUTES } from '@/lib/routes';

interface CoursePageHeaderProps {
  bulkDeleteMode: boolean;
  selectedCourses: string[];
  onBulkDeleteModeOn: () => void;
  onCancelBulkDelete: () => void;
  onBulkDelete: () => void;
  onDeleteAllDrafts: () => void;
}

export function CoursePageHeader({
  bulkDeleteMode,
  selectedCourses,
  onBulkDeleteModeOn,
  onCancelBulkDelete,
  onBulkDelete,
  onDeleteAllDrafts,
}: CoursePageHeaderProps) {
  return (
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
              onClick={onCancelBulkDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onBulkDelete}
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
              onClick={onBulkDeleteModeOn}
              title="Bulk Delete Mode"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Bulk Delete
            </Button>
            <Button
              variant="outline"
              onClick={onDeleteAllDrafts}
              title="Delete all draft courses"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Drafts
            </Button>
            <Button variant="outline" asChild>
              <Link href={ADMIN_ACADEMY_ROUTES.COURSES_NEW}>
                <Plus className="h-4 w-4 mr-2" />
                Create Manually
              </Link>
            </Button>
            <Button asChild className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
              <Link href={ADMIN_ACADEMY_ROUTES.COURSES_GENERATE}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate with AI
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
