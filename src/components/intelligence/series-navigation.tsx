import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getContentBySlug } from '@/lib/intelligence';
import { cn } from '@/lib/utils';

interface SeriesNavigationProps {
  prevSlug: string | null;
  nextSlug: string | null;
  seriesTitle: string;
  position?: number;
  total?: number;
  className?: string;
}

/**
 * Series navigation component showing prev/next article links.
 * Displays article titles with directional arrows.
 */
export function SeriesNavigation({
  prevSlug,
  nextSlug,
  seriesTitle,
  position,
  total,
  className,
}: SeriesNavigationProps) {
  // Get article titles for display
  const prevContent = prevSlug ? getContentBySlug(prevSlug) : null;
  const nextContent = nextSlug ? getContentBySlug(nextSlug) : null;

  // Don't render if no navigation
  if (!prevSlug && !nextSlug) return null;

  return (
    <nav
      className={cn(
        'mt-12 pt-8 border-t border-nex-light',
        className
      )}
      aria-label="Series navigation"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-dim uppercase tracking-wide">
          Continue in {seriesTitle}
        </p>
        {position && total && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
            Article {position} of {total}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Previous Article */}
        {prevSlug && prevContent ? (
          <Link
            href={`/intelligence/${prevSlug}`}
            className="group flex items-start gap-3 p-4 rounded-xl bg-nex-surface/50 border border-nex-light hover:border-cyan/40 hover:bg-nex-surface transition-all"
          >
            <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-cyan/10 text-cyan group-hover:bg-cyan/20 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-dim mb-1">Previous</p>
              <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors line-clamp-2">
                {prevContent.meta.title}
              </p>
            </div>
          </Link>
        ) : (
          <div /> /* Empty placeholder for grid alignment */
        )}

        {/* Next Article */}
        {nextSlug && nextContent ? (
          <Link
            href={`/intelligence/${nextSlug}`}
            className="group flex items-start gap-3 p-4 rounded-xl bg-nex-surface/50 border border-nex-light hover:border-cyan/40 hover:bg-nex-surface transition-all sm:text-right sm:flex-row-reverse"
          >
            <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-cyan/10 text-cyan group-hover:bg-cyan/20 transition-colors">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-dim mb-1">Next</p>
              <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors line-clamp-2">
                {nextContent.meta.title}
              </p>
            </div>
          </Link>
        ) : (
          <div /> /* Empty placeholder for grid alignment */
        )}
      </div>
    </nav>
  );
}
