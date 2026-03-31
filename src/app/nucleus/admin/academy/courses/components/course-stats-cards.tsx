'use client';

import { Loader2, ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Course } from '@/types/academy';

interface CourseStatsCardsProps {
  courses: Course[];
  bulkGenerating: boolean;
  onBulkGenerateThumbnails: () => void;
}

export function CourseStatsCards({ courses, bulkGenerating, onBulkGenerateThumbnails }: CourseStatsCardsProps) {
  const missingThumbnailCount = courses.filter(c => !c.metadata?.thumbnailUrl).length;

  return (
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
      <Card className={missingThumbnailCount > 0 ? 'border-amber-500/30' : 'border-green-500/30'}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${missingThumbnailCount > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                {missingThumbnailCount}
              </div>
              <p className="text-sm text-slate-dim">Missing Thumbnails</p>
            </div>
            {missingThumbnailCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onBulkGenerateThumbnails}
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
  );
}
