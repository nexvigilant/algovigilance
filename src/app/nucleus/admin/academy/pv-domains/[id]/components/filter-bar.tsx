'use client';

import { Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { typeConfig, sortOptions, type SortOption } from './constants';
import type { CapabilityComponent } from '@/types/pv-curriculum';

interface FilterBarProps {
  components: CapabilityComponent[];
  filteredComponents: CapabilityComponent[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  typeFilter: string | null;
  onTypeFilterChange: (value: string | null) => void;
}

export function FilterBar({
  components,
  filteredComponents,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
}: FilterBarProps) {
  return (
    <>
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-dim" />
          <Input
            placeholder="Search by name, description, or keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={typeFilter === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeFilterChange(null)}
        >
          All ({components.length})
        </Button>
        {Object.entries(typeConfig).map(([type, config]) => {
          const Icon = config.icon;
          const count = components.filter(c => c.type === type).length;
          return (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTypeFilterChange(type)}
            >
              <Icon className={`h-4 w-4 mr-1 ${typeFilter !== type ? config.color : ''}`} />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Results count */}
      {(searchQuery || typeFilter) && (
        <p className="text-sm text-slate-dim mb-4">
          Showing {filteredComponents.length} of {components.length} components
        </p>
      )}
    </>
  );
}
