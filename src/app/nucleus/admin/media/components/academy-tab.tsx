import Link from 'next/link';
import { Loader2, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceLoading } from '@/components/voice';
import { MediaCard } from './media-card';

export interface CourseItem {
  id: string;
  title: string;
  topic: string;
  status: string;
  thumbnailUrl: string | null;
}

interface AcademyTabProps {
  items: CourseItem[];
  missingCount: number;
  loading?: boolean;
  regenerating: string | null;
  bulkGenerating: 'intelligence' | 'academy' | null;
  onRegenerate: (courseId: string) => void;
  onBulkGenerate: () => void;
  title: string;
  titleIconColor?: string;
  alwaysShowBulk?: boolean;
  bulkButtonLabel?: string;
  viewAllHref?: string;
  asSectionTag?: boolean;
}

export function AcademyTab({
  items,
  missingCount,
  loading = false,
  regenerating,
  bulkGenerating,
  onRegenerate,
  onBulkGenerate,
  title,
  titleIconColor,
  alwaysShowBulk = false,
  bulkButtonLabel,
  viewAllHref,
  asSectionTag = false,
}: AcademyTabProps) {
  const showBulkButton = alwaysShowBulk || missingCount > 0;
  const resolvedBulkLabel = bulkButtonLabel ?? `Generate All Missing (${missingCount})`;

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          {titleIconColor && <BookOpen className={`h-5 w-5 ${titleIconColor}`} />}
          {title}
        </h2>
        {showBulkButton && (
          <Button
            onClick={onBulkGenerate}
            disabled={bulkGenerating === 'academy'}
            size="sm"
          >
            {bulkGenerating === 'academy' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {resolvedBulkLabel}
              </>
            )}
          </Button>
        )}
      </div>
      {loading ? (
        <VoiceLoading context="admin" variant="spinner" message="Loading Academy courses..." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((course) => (
            <MediaCard
              key={course.id}
              id={course.id}
              title={course.title}
              type={course.topic}
              image={course.thumbnailUrl}
              isRegenerating={regenerating === `course-${course.id}`}
              onRegenerate={() => onRegenerate(course.id)}
            />
          ))}
        </div>
      )}
      {viewAllHref && (
        <div className="mt-4 text-center">
          <Link href={viewAllHref}>
            <Button variant="outline">View All Academy Courses</Button>
          </Link>
        </div>
      )}
    </>
  );

  if (asSectionTag) return <section>{content}</section>;
  return <>{content}</>;
}
