'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Headphones, FileText, Lightbulb, PenLine, Link2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentType } from '@/types/intelligence';

interface FilterOption {
  value: ContentType | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All', icon: LayoutGrid },
  { value: 'podcast', label: 'Transmissions', icon: Headphones },
  { value: 'publication', label: 'Publications', icon: FileText },
  { value: 'perspective', label: 'Strategic Analysis', icon: Lightbulb },
  { value: 'field-note', label: 'Field Intel', icon: PenLine },
  { value: 'signal', label: 'Signals', icon: Link2 },
];

interface Props {
  /** Current active filter */
  activeFilter?: ContentType | 'all';
  /** Additional class names */
  className?: string;
}

/**
 * Content type filter for Intelligence hub
 * Implements WAI-ARIA tabs pattern for screen reader accessibility
 */
export function ContentFilter({ activeFilter = 'all', className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = useCallback(
    (value: ContentType | 'all') => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === 'all') {
        params.delete('type');
      } else {
        params.set('type', value);
      }

      const newPath = params.toString()
        ? `/intelligence?${params.toString()}`
        : '/intelligence';

      router.push(newPath, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div
      role="tablist"
      aria-label="Filter content by type"
      className={cn('flex flex-wrap gap-2', className)}
    >
      {FILTER_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = activeFilter === option.value;

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            aria-controls="intelligence-content"
            onClick={() => handleFilterChange(option.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium touch-target',
              'transition-all duration-200',
              isActive
                ? 'bg-cyan text-nex-background'
                : 'bg-nex-surface text-slate-light hover:bg-nex-light hover:text-white border border-nex-light'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
