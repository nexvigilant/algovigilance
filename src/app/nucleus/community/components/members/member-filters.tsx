'use client';

import { useState, useEffect, useRef } from 'react';
import { Filter, X, Search, ChevronDown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getMemberFilterOptions, type MemberFilters as MemberFiltersType } from '../../actions/user/directory';

interface MemberFiltersProps {
  filters: MemberFiltersType;
  onFiltersChange: (filters: MemberFiltersType) => void;
  className?: string;
}

const careerStageLabels: Record<string, string> = {
  practitioner: 'Practitioner',
  transitioning: 'Transitioning',
  'early-career': 'Early Career',
  'mid-career': 'Mid Career',
  senior: 'Senior',
  expert: 'Expert',
};

const goalLabels: Record<string, string> = {
  networking: 'Networking',
  learning: 'Learning',
  'job-seeking': 'Job Seeking',
  mentoring: 'Mentoring',
  'sharing-knowledge': 'Sharing Knowledge',
};

export function MemberFilters({ filters, onFiltersChange, className }: MemberFiltersProps) {
  const [options, setOptions] = useState<{
    specialties: string[];
    careerStages: string[];
    locations: string[];
    goals: string[];
  }>({
    specialties: [],
    careerStages: [],
    locations: [],
    goals: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    const result = await getMemberFilterOptions();
    if (result.success && result.options) {
      setOptions(result.options);
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the actual filter change by 300ms
    debounceTimerRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, 300);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSpecialtyToggle = (specialty: string) => {
    const current = filters.specialties || [];
    const updated = current.includes(specialty)
      ? current.filter((s) => s !== specialty)
      : [...current, specialty];
    onFiltersChange({ ...filters, specialties: updated.length > 0 ? updated : undefined });
  };

  const handleGoalToggle = (goal: string) => {
    const current = filters.goals || [];
    const updated = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal];
    onFiltersChange({ ...filters, goals: updated.length > 0 ? updated : undefined });
  };

  const handleCareerStageChange = (value: string) => {
    onFiltersChange({ ...filters, careerStage: value === 'all' ? undefined : value });
  };

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value === 'all' ? undefined : value });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value as MemberFiltersType['sortBy'] });
  };

  const handleVerifiedToggle = (checked: boolean) => {
    onFiltersChange({ ...filters, verifiedOnly: checked || undefined });
  };

  const clearAllFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.specialties?.length || 0) +
    (filters.careerStage ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.goals?.length || 0) +
    (filters.verifiedOnly ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Verified Practitioners Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <Label htmlFor="verified-filter" className="text-emerald-300 cursor-pointer text-sm">
            Verified Practitioners Only
          </Label>
        </div>
        <Switch
          id="verified-filter"
          checked={filters.verifiedOnly || false}
          onCheckedChange={handleVerifiedToggle}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label className="text-slate-light">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-dim" />
          <Input
            placeholder="Search by name, title, org..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-nex-surface border-nex-border"
          />
        </div>
      </div>

      {/* Career Stage */}
      <div className="space-y-2">
        <Label className="text-slate-light">Career Stage</Label>
        <Select
          value={filters.careerStage || 'all'}
          onValueChange={handleCareerStageChange}
        >
          <SelectTrigger className="bg-nex-surface border-nex-border">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {options.careerStages.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {careerStageLabels[stage] || stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      {options.locations.length > 0 && (
        <div className="space-y-2">
          <Label className="text-slate-light">Location</Label>
          <Select
            value={filters.location || 'all'}
            onValueChange={handleLocationChange}
          >
            <SelectTrigger className="bg-nex-surface border-nex-border">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {options.locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Specialties */}
      {options.specialties.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
            <Label className="text-slate-light cursor-pointer">Specialties</Label>
            <ChevronDown className="h-4 w-4 text-slate-dim" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {options.specialties.slice(0, 15).map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={`specialty-${specialty}`}
                    checked={filters.specialties?.includes(specialty) || false}
                    onCheckedChange={() => handleSpecialtyToggle(specialty)}
                  />
                  <label
                    htmlFor={`specialty-${specialty}`}
                    className="text-sm text-slate-dim cursor-pointer hover:text-slate-light"
                  >
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Goals */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
          <Label className="text-slate-light cursor-pointer">Goals</Label>
          <ChevronDown className="h-4 w-4 text-slate-dim" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {options.goals.map((goal) => (
            <div key={goal} className="flex items-center space-x-2">
              <Checkbox
                id={`goal-${goal}`}
                checked={filters.goals?.includes(goal) || false}
                onCheckedChange={() => handleGoalToggle(goal)}
              />
              <label
                htmlFor={`goal-${goal}`}
                className="text-sm text-slate-dim cursor-pointer hover:text-slate-light"
              >
                {goalLabels[goal] || goal}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-slate-light">Sort by</Label>
        <Select
          value={filters.sortBy || 'newest'}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="bg-nex-surface border-nex-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest Members</SelectItem>
            <SelectItem value="reputation">Highest Reputation</SelectItem>
            <SelectItem value="activity">Most Active</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          className="w-full text-slate-dim hover:text-slate-light"
          onClick={clearAllFilters}
        >
          <X className="mr-2 h-4 w-4" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn('', className)}>
      {/* Desktop: Inline filters */}
      <div className="hidden lg:block">
        <div className="rounded-lg border border-nex-border bg-nex-surface/50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gold">Filters</h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-7 px-2 text-xs text-slate-dim hover:text-cyan"
                >
                  Clear
                </Button>
              )}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-cyan/20 text-cyan">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile: Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full border-nex-border">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-cyan/20 text-cyan">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 bg-nex-surface border-nex-border">
            <SheetHeader>
              <SheetTitle className="text-gold">Filter Members</SheetTitle>
              <SheetDescription className="text-slate-dim">
                Narrow down the member directory
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
