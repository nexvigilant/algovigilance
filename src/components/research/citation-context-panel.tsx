'use client';

/**
 * Citation Context Panel
 *
 * Displays Semantic Scholar citation context data including:
 * - Citation intents (background, methodology, result_comparison)
 * - Influential citations indicator
 * - Text snippets where citations appear
 */

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BookOpen,
  FlaskConical,
  BarChart3,
  Star,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Quote,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { CitationContextData } from '@/app/nucleus/admin/research/actions';

// =============================================================================
// TYPES
// =============================================================================

interface CitationContextPanelProps {
  /** Citation context data from S2 enrichment */
  contexts: CitationContextData[];
  /** S2 enrichment status */
  status?: 'success' | 'partial' | 'failed';
  /** Error message if enrichment failed */
  errorMessage?: string;
  /** Maximum items to display initially */
  initialDisplayCount?: number;
}

// =============================================================================
// INTENT HELPERS
// =============================================================================

const INTENT_CONFIG = {
  background: {
    label: 'Background',
    icon: BookOpen,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Used to provide context or foundational information',
  },
  methodology: {
    label: 'Methodology',
    icon: FlaskConical,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Applied or adapted the method from this work',
  },
  result_comparison: {
    label: 'Result',
    icon: BarChart3,
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    description: 'Compared results or findings with this work',
  },
} as const;

function IntentBadge({ intent }: { intent: string }) {
  const config = INTENT_CONFIG[intent as keyof typeof INTENT_CONFIG];

  if (!config) {
    return (
      <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-400">
        {intent}
      </Badge>
    );
  }

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs ${config.color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-nex-surface border-nex-border">
          <p className="text-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =============================================================================
// CITATION ITEM
// =============================================================================

interface CitationItemProps {
  context: CitationContextData;
  index: number;
}

function CitationItem({ context, index }: CitationItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasContexts = context.contexts.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-nex-border rounded-lg bg-nex-deep/50">
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 text-left hover:bg-nex-surface/50 transition-colors rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-xs font-mono text-slate-light/30 mt-1">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-light font-mono truncate">
                    {context.source}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {context.isInfluential && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-gold/10 text-gold border-gold/30"
                      >
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Influential
                      </Badge>
                    )}
                    {context.intents.map((intent) => (
                      <IntentBadge key={intent} intent={intent} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasContexts && (
                  <Badge variant="outline" className="text-xs border-nex-border text-slate-light/50">
                    <Quote className="h-3 w-3 mr-1" />
                    {context.contexts.length}
                  </Badge>
                )}
                {hasContexts ? (
                  isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-light/40" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-light/40" />
                  )
                ) : null}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {hasContexts && (
          <CollapsibleContent>
            <div className="px-3 pb-3 border-t border-nex-border/50 pt-3 ml-8">
              <p className="text-xs font-mono uppercase tracking-wider text-slate-light/40 mb-2">
                Citation Contexts
              </p>
              <div className="space-y-2">
                {context.contexts.map((text, i) => (
                  <blockquote
                    key={i}
                    className="text-sm text-slate-light/70 border-l-2 border-cyan/30 pl-3 py-1 italic"
                  >
                    &ldquo;{text}&rdquo;
                  </blockquote>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

// =============================================================================
// STATISTICS CARD
// =============================================================================

interface StatsCardProps {
  contexts: CitationContextData[];
}

function StatsCard({ contexts }: StatsCardProps) {
  const stats = useMemo(() => {
    const totalCitations = contexts.length;
    const influentialCount = contexts.filter((c) => c.isInfluential).length;
    const withContexts = contexts.filter((c) => c.contexts.length > 0).length;

    const intentCounts: Record<string, number> = {};
    for (const c of contexts) {
      for (const intent of c.intents) {
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      }
    }

    return {
      totalCitations,
      influentialCount,
      influentialPercent: totalCitations > 0 ? (influentialCount / totalCitations) * 100 : 0,
      withContexts,
      withContextsPercent: totalCitations > 0 ? (withContexts / totalCitations) * 100 : 0,
      intentCounts,
    };
  }, [contexts]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-nex-deep border-nex-border">
        <CardContent className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-light/40">
            Total Citations
          </p>
          <p className="text-2xl font-bold text-slate-light mt-1">
            {stats.totalCitations}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-nex-deep border-nex-border">
        <CardContent className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-gold/60">
            Influential
          </p>
          <p className="text-2xl font-bold text-gold mt-1">
            {stats.influentialCount}
          </p>
          <p className="text-xs text-slate-light/40 mt-0.5">
            {stats.influentialPercent.toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card className="bg-nex-deep border-nex-border">
        <CardContent className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-cyan/60">
            With Context
          </p>
          <p className="text-2xl font-bold text-cyan mt-1">
            {stats.withContexts}
          </p>
          <p className="text-xs text-slate-light/40 mt-0.5">
            {stats.withContextsPercent.toFixed(1)}% of total
          </p>
        </CardContent>
      </Card>

      <Card className="bg-nex-deep border-nex-border">
        <CardContent className="p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-light/40">
            Intent Types
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(stats.intentCounts).map(([intent, count]) => (
              <Badge
                key={intent}
                variant="outline"
                className="text-xs border-nex-border text-slate-light/60"
              >
                {intent}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CitationContextPanel({
  contexts,
  status = 'success',
  errorMessage,
  initialDisplayCount = 20,
}: CitationContextPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInfluential, setFilterInfluential] = useState(false);
  const [filterIntent, setFilterIntent] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(initialDisplayCount);

  // Filter contexts based on search and filters
  const filteredContexts = useMemo(() => {
    return contexts.filter((c) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSource = c.source.toLowerCase().includes(query);
        const matchesContext = c.contexts.some((ctx) =>
          ctx.toLowerCase().includes(query)
        );
        if (!matchesSource && !matchesContext) return false;
      }

      // Influential filter
      if (filterInfluential && !c.isInfluential) return false;

      // Intent filter
      if (filterIntent && !c.intents.includes(filterIntent)) return false;

      return true;
    });
  }, [contexts, searchQuery, filterInfluential, filterIntent]);

  const displayedContexts = filteredContexts.slice(0, displayCount);
  const hasMore = filteredContexts.length > displayCount;

  // Error state
  if (status === 'failed') {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="flex items-start gap-3 py-6">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-400">Citation Context Unavailable</p>
            <p className="text-sm text-slate-light/70 mt-1">
              {errorMessage || 'Failed to fetch citation context from Semantic Scholar.'}
            </p>
            <p className="text-xs text-slate-light/50 mt-2">
              The CIDRE analysis results are still valid. Citation context is an optional enrichment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (contexts.length === 0) {
    return (
      <Card className="bg-nex-surface border-nex-border border-dashed">
        <CardContent className="py-8 text-center">
          <Quote className="h-10 w-10 text-slate-light/20 mx-auto mb-3" />
          <p className="text-slate-light/50">No citation context data available</p>
          <p className="text-sm text-slate-light/30 mt-1">
            Enable S2 Enrichment to see how papers cite this work
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Quote className="h-5 w-5 text-cyan" />
          <h3 className="text-lg font-medium text-slate-light">Citation Context</h3>
          {status === 'success' && (
            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              S2 Enriched
            </Badge>
          )}
          {status === 'partial' && (
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
              Partial Data
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics */}
      <StatsCard contexts={contexts} />

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-light/40" />
          <Input
            placeholder="Search citations or contexts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-nex-deep border-nex-border text-slate-light placeholder:text-slate-light/40"
          />
        </div>

        <Button
          variant={filterInfluential ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterInfluential(!filterInfluential)}
          className={
            filterInfluential
              ? 'bg-gold hover:bg-gold/90 text-nex-deep'
              : 'border-nex-border text-slate-light hover:bg-nex-surface'
          }
        >
          <Star className="h-4 w-4 mr-1" />
          Influential Only
        </Button>

        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-slate-light/40" />
          {Object.entries(INTENT_CONFIG).map(([intent, config]) => {
            const Icon = config.icon;
            const isActive = filterIntent === intent;
            return (
              <Button
                key={intent}
                variant="outline"
                size="sm"
                onClick={() => setFilterIntent(isActive ? null : intent)}
                className={
                  isActive
                    ? config.color
                    : 'border-nex-border text-slate-light/60 hover:bg-nex-surface'
                }
              >
                <Icon className="h-3 w-3" />
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      {(searchQuery || filterInfluential || filterIntent) && (
        <p className="text-xs text-slate-light/50">
          Showing {filteredContexts.length} of {contexts.length} citations
        </p>
      )}

      {/* Citation List */}
      <div className="space-y-2">
        {displayedContexts.map((context, index) => (
          <CitationItem key={context.source} context={context} index={index} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => setDisplayCount((c) => c + 20)}
            className="border-nex-border text-slate-light hover:bg-nex-surface"
          >
            Load More ({filteredContexts.length - displayCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
