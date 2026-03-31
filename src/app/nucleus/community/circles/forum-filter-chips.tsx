'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  category?: string;
}

interface ForumFilterChipsProps {
  groupedFilterOptions: Record<string, FilterOption[]>;
  selectedFilter: string | null;
  setSelectedFilter: (filter: string | null) => void;
}

export function ForumFilterChips({
  groupedFilterOptions,
  selectedFilter,
  setSelectedFilter,
}: ForumFilterChipsProps) {
  const hasOptions = Object.keys(groupedFilterOptions).length > 0;

  if (!hasOptions) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-cyan-soft/70">Filter by:</span>
        {selectedFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFilter(null)}
            className="text-cyan-soft hover:text-cyan-faint h-auto py-1 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
        {Object.entries(groupedFilterOptions).map(([category, options]) => (
          <div key={category} className="flex flex-wrap gap-1.5">
            {options.slice(0, 8).map((option) => (
              <button
                key={option.id}
                onClick={() =>
                  setSelectedFilter(selectedFilter === option.id ? null : option.id)
                }
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  selectedFilter === option.id
                    ? 'bg-cyan text-white'
                    : 'bg-nex-light text-cyan-soft/70 border border-cyan/20 hover:border-cyan/40'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
