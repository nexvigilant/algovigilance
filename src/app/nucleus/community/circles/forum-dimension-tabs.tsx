'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Star,
  Filter,
  ChevronDown,
  Briefcase,
  Building2,
  GraduationCap,
  Lightbulb,
  Target,
  Compass,
  Grid3X3,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CircleDimension } from '@/types/circle-taxonomy';
import type { SmartForum } from '@/types/community';

/**
 * Dimension configuration for the browse tabs
 */
export const BROWSE_DIMENSIONS: {
  id: CircleDimension | 'all' | 'official' | 'my-circles';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { id: 'all', label: 'All Circles', icon: Grid3X3, description: 'Browse all community circles' },
  { id: 'official', label: 'Official', icon: CheckCircle2, description: 'Official AlgoVigilance circles' },
  { id: 'function', label: 'By Function', icon: Briefcase, description: 'Browse by job function' },
  { id: 'organization', label: 'Organizations', icon: Building2, description: 'Professional & Greek organizations' },
  { id: 'career-stage', label: 'Career Stage', icon: GraduationCap, description: 'Find peers at your level' },
  { id: 'skill', label: 'Skills', icon: Lightbulb, description: 'Skill development circles' },
  { id: 'pathway', label: 'Pathways', icon: Compass, description: 'Career transition paths' },
  { id: 'interest', label: 'Interests', icon: Target, description: 'Interest-based communities' },
];

interface ForumDimensionTabsProps {
  activeDimension: CircleDimension | 'all' | 'official' | 'my-circles';
  setActiveDimension: (dim: CircleDimension | 'all' | 'official' | 'my-circles') => void;
  setSelectedFilter: (filter: string | null) => void;
  userForums: SmartForum[];
}

export function ForumDimensionTabs({
  activeDimension,
  setActiveDimension,
  setSelectedFilter,
  userForums,
}: ForumDimensionTabsProps) {
  function handleSelect(dim: CircleDimension | 'all' | 'official' | 'my-circles') {
    setActiveDimension(dim);
    setSelectedFilter(null);
  }

  return (
    <>
      {/* Dimension Tabs - Desktop */}
      <div className="mb-6 hidden lg:block">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {userForums.length > 0 && (
            <button
              onClick={() => handleSelect('my-circles')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                activeDimension === 'my-circles'
                  ? 'bg-nex-gold-500/20 text-nex-gold-300 border border-nex-gold-500/30'
                  : 'bg-nex-light text-cyan-soft/70 border border-cyan/20 hover:border-cyan/40'
              )}
            >
              <Star className="h-4 w-4" />
              My Circles
              <Badge className="ml-1 bg-nex-gold-500/30 text-nex-gold-300 border-none">
                {userForums.length}
              </Badge>
            </button>
          )}
          {BROWSE_DIMENSIONS.map((dim) => {
            const Icon = dim.icon;
            return (
              <button
                key={dim.id}
                onClick={() => handleSelect(dim.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  activeDimension === dim.id
                    ? 'bg-cyan/20 text-cyan-soft border border-cyan/40'
                    : 'bg-nex-light text-cyan-soft/70 border border-cyan/20 hover:border-cyan/40'
                )}
              >
                <Icon className="h-4 w-4" />
                {dim.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dimension Tabs - Mobile */}
      <div className="mb-6 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full border-cyan/30 text-cyan-soft">
              <Filter className="mr-2 h-4 w-4" />
              Browse by: {BROWSE_DIMENSIONS.find((d) => d.id === activeDimension)?.label || 'All Circles'}
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-nex-surface border-cyan/30">
            <SheetHeader>
              <SheetTitle className="text-white">Browse Circles By</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {userForums.length > 0 && (
                <button
                  onClick={() => handleSelect('my-circles')}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors',
                    activeDimension === 'my-circles'
                      ? 'bg-nex-gold-500/20 text-nex-gold-300 border border-nex-gold-500/30'
                      : 'bg-nex-light text-cyan-soft/70 border border-cyan/20'
                  )}
                >
                  <Star className="h-4 w-4" />
                  My Circles
                </button>
              )}
              {BROWSE_DIMENSIONS.map((dim) => {
                const Icon = dim.icon;
                return (
                  <button
                    key={dim.id}
                    onClick={() => handleSelect(dim.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors',
                      activeDimension === dim.id
                        ? 'bg-cyan/20 text-cyan-soft border border-cyan/40'
                        : 'bg-nex-light text-cyan-soft/70 border border-cyan/20'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {dim.label}
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
