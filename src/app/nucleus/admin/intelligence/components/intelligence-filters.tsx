'use client';

import { Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContentType, ContentStatus } from '@/types/intelligence';
import { CONTENT_TYPE_CONFIG } from '@/types/intelligence';

interface IntelligenceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: ContentType | 'all';
  onTypeFilterChange: (value: ContentType | 'all') => void;
  statusFilter: ContentStatus | 'all';
  onStatusFilterChange: (value: ContentStatus | 'all') => void;
  onRefresh: () => void;
}

export function IntelligenceFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
}: IntelligenceFiltersProps) {
  return (
    <Card className="bg-nex-surface border-nex-light mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-slate-light flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim" />
            <Input
              placeholder="Search by title, slug, or author..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-nex-dark border-nex-light"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => onTypeFilterChange(v as ContentType | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-nex-dark border-nex-light">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.icon} {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as ContentStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[150px] bg-nex-dark border-nex-light">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onRefresh} className="border-nex-light">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
