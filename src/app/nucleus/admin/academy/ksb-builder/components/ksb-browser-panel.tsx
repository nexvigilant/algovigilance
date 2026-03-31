'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Wrench,
  Target,
  Bot,
} from 'lucide-react';
import type { CapabilityComponent } from '@/types/pv-curriculum';
import { DomainSelector } from './domain-selector';
import { cn } from '@/lib/utils';

interface KSBBrowserPanelProps {
  ksbs: CapabilityComponent[];
  selectedKSB: CapabilityComponent | null;
  onSelectKSB: (ksb: CapabilityComponent) => void;
  selectedDomain: string;
  onDomainChange: (domainId: string) => void;
  loading?: boolean;
}

type KSBTypeFilter = 'all' | 'knowledge' | 'skill' | 'behavior' | 'ai_integration';

const typeConfig = {
  all: { label: 'All', icon: null, color: 'bg-gray-100' },
  knowledge: { label: 'K', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  skill: { label: 'S', icon: Wrench, color: 'bg-green-100 text-green-700' },
  behavior: { label: 'B', icon: Target, color: 'bg-purple-100 text-purple-700' },
  ai_integration: { label: 'AI', icon: Bot, color: 'bg-orange-100 text-orange-700' },
};

export function KSBBrowserPanel({
  ksbs,
  selectedKSB,
  onSelectKSB,
  selectedDomain,
  onDomainChange,
  loading,
}: KSBBrowserPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<KSBTypeFilter>('all');

  // Filter KSBs based on search and type
  const filteredKSBs = useMemo(() => {
    return ksbs.filter((ksb) => {
      // Type filter
      if (typeFilter !== 'all' && ksb.type !== typeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          ksb.itemName.toLowerCase().includes(query) ||
          ksb.id.toLowerCase().includes(query) ||
          ksb.itemDescription?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [ksbs, searchQuery, typeFilter]);

  // Count by type
  const typeCounts = useMemo(() => {
    const counts = { all: ksbs.length, knowledge: 0, skill: 0, behavior: 0, ai_integration: 0 };
    ksbs.forEach((ksb) => {
      if (ksb.type in counts) {
        counts[ksb.type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [ksbs]);

  const isComplete = (ksb: CapabilityComponent) =>
    ksb.hook && ksb.concept && ksb.activity && ksb.reflection;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 space-y-3 bg-background sticky top-0 z-10">
        <CardTitle className="text-sm">KSB Browser</CardTitle>

        {/* Domain Selector */}
        <DomainSelector
          value={selectedDomain}
          onChange={onDomainChange}
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search KSBs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Type Filters */}
        <div className="flex gap-1">
          {(Object.keys(typeConfig) as KSBTypeFilter[]).map((type) => (
            <Button
              key={type}
              size="sm"
              variant={typeFilter === type ? 'default' : 'outline'}
              className={cn(
                'h-7 px-2 text-xs',
                typeFilter === type && type !== 'all' && typeConfig[type].color
              )}
              onClick={() => setTypeFilter(type)}
            >
              {typeConfig[type].label}
              {type !== 'all' && (
                <span className="ml-1 opacity-70">{typeCounts[type]}</span>
              )}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading KSBs...
          </div>
        ) : filteredKSBs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {selectedDomain ? 'No KSBs found' : 'Select a domain'}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-420px)]">
            <div className="px-3 pb-3 space-y-1">
              {filteredKSBs.map((ksb) => (
                <button
                  key={ksb.id}
                  onClick={() => onSelectKSB(ksb)}
                  className={cn(
                    'w-full text-left p-2 rounded-md border transition-colors',
                    'hover:bg-accent hover:border-accent-foreground/20',
                    selectedKSB?.id === ksb.id
                      ? 'bg-accent border-primary'
                      : 'border-transparent'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {/* Status Icon */}
                    {isComplete(ksb) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      {/* KSB Name */}
                      <div className="text-sm font-medium leading-tight">
                        {ksb.itemName}
                      </div>

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1 py-0',
                            typeConfig[ksb.type as keyof typeof typeConfig]?.color
                          )}
                        >
                          {ksb.type === 'knowledge' && 'K'}
                          {ksb.type === 'skill' && 'S'}
                          {ksb.type === 'behavior' && 'B'}
                          {ksb.type === 'ai_integration' && 'AI'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {ksb.id}
                        </span>
                        {ksb.status && ksb.status !== 'draft' && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {ksb.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Footer with count */}
      <div className="px-3 py-2 border-t text-xs text-muted-foreground">
        {filteredKSBs.length} of {ksbs.length} KSBs
      </div>
    </Card>
  );
}

export default KSBBrowserPanel;
