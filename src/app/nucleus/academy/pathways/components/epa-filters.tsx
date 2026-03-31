'use client';

import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EPATier, EPACatalogFilters } from '@/types/epa-pathway';

interface EPAFiltersProps {
  filters: EPACatalogFilters;
  onFiltersChange: (filters: EPACatalogFilters) => void;
}

const tierOptions: { value: EPATier | 'all'; label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'Core', label: 'Core (EPA 1-10)' },
  { value: 'Executive', label: 'Executive (EPA 11-20)' },
  { value: 'Network', label: 'Network (EPA 21)' },
];

const difficultyOptions = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Foundation' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const coverageOptions = [
  { value: '0', label: 'Any Coverage' },
  { value: '25', label: '25%+ Coverage' },
  { value: '50', label: '50%+ Coverage' },
  { value: '75', label: '75%+ Coverage' },
];

export function EPAFilters({ filters, onFiltersChange }: EPAFiltersProps) {
  const hasActiveFilters =
    filters.tier || filters.difficulty || (filters.minContentCoverage ?? 0) > 0;

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = [
    filters.tier,
    filters.difficulty,
    filters.minContentCoverage,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-cyan/70" />
        <span className="text-sm font-medium text-slate-light">Filters</span>
        {activeFilterCount > 0 && (
          <Badge
            variant="outline"
            className="bg-cyan/10 text-cyan border-cyan/30 text-xs"
          >
            {activeFilterCount} active
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Tier Filter */}
        <Select
          value={filters.tier ?? 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              tier: value === 'all' ? undefined : (value as EPATier),
            })
          }
        >
          <SelectTrigger className="w-[160px] bg-nex-surface border-nex-border text-slate-light">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent className="bg-nex-surface border-nex-border">
            {tierOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-slate-light hover:bg-nex-light"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty Filter */}
        <Select
          value={filters.difficulty ?? 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              difficulty:
                value === 'all'
                  ? undefined
                  : (value as 'beginner' | 'intermediate' | 'advanced' | 'expert'),
            })
          }
        >
          <SelectTrigger className="w-[160px] bg-nex-surface border-nex-border text-slate-light">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent className="bg-nex-surface border-nex-border">
            {difficultyOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-slate-light hover:bg-nex-light"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Coverage Filter */}
        <Select
          value={String(filters.minContentCoverage ?? 0)}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              minContentCoverage: parseInt(value) || undefined,
            })
          }
        >
          <SelectTrigger className="w-[160px] bg-nex-surface border-nex-border text-slate-light">
            <SelectValue placeholder="Coverage" />
          </SelectTrigger>
          <SelectContent className="bg-nex-surface border-nex-border">
            {coverageOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-slate-light hover:bg-nex-light"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-dim hover:text-slate-light"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
