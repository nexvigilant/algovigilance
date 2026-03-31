'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

export interface SearchFiltersProps {
  category: string;
  setCategory: (value: string) => void;
  selectedTags: string[];
  handleTagToggle: (tag: string) => void;
  status: 'all' | 'solved' | 'unsolved';
  setStatus: (value: 'all' | 'solved' | 'unsolved') => void;
  availableCategories: string[];
  availableTags: string[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export function SearchFilters({
  category,
  setCategory,
  selectedTags,
  handleTagToggle,
  status,
  setStatus,
  availableCategories,
  availableTags,
  clearFilters,
  hasActiveFilters,
}: SearchFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as 'all' | 'solved' | 'unsolved')
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All posts</SelectItem>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="unsolved">Unsolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {availableTags.slice(0, 20).map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => handleTagToggle(tag)}
                />
                <Label
                  htmlFor={`tag-${tag}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  #{tag}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
