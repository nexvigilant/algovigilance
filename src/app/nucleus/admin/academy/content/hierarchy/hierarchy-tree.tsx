'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Target,
  Grid3X3,
  Brain,
  Wrench,
  Heart,
  CheckCircle,
  Clock,
  FileEdit,
} from 'lucide-react';
import type { ContentHierarchy, HierarchyCPA, HierarchyEPA, HierarchyDomain } from './actions';

interface HierarchyTreeProps {
  hierarchy: ContentHierarchy;
}

// ============================================================================
// Status Badge Component
// ============================================================================

const StatusBadge = ({ count, status }: { count: number; status: 'published' | 'pending' | 'draft' }) => {
  if (count === 0) return null;

  const styles = {
    published: 'bg-green-500/20 text-green-400',
    pending: 'bg-amber-500/20 text-amber-400',
    draft: 'bg-slate-500/20 text-slate-400',
  };

  const icons = {
    published: CheckCircle,
    pending: Clock,
    draft: FileEdit,
  };

  const Icon = icons[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${styles[status]}`}>
      <Icon className="w-3 h-3" />
      {count}
    </span>
  );
};

// ============================================================================
// Tree Node Components
// ============================================================================

interface DomainNodeProps {
  domain: HierarchyDomain;
  depth: number;
}

function DomainNode({ domain, depth }: DomainNodeProps) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-3 hover:bg-nex-light/30 rounded transition-colors"
      style={{ paddingLeft: `${depth * 24 + 12}px` }}
    >
      <Grid3X3 className="w-4 h-4 text-purple-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-slate-light truncate">{domain.name}</span>
        <span className="text-xs text-slate-light/50 ml-2">({domain.ksbCount} KSBs)</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge count={domain.publishedCount} status="published" />
        <StatusBadge count={domain.draftCount} status="draft" />
      </div>
    </div>
  );
}

interface EPANodeProps {
  epa: HierarchyEPA;
  depth: number;
}

function EPANode({ epa, depth }: EPANodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = epa.domains.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-3 py-2 px-3 hover:bg-nex-light/30 rounded cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-light/50 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-light/50 flex-shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}
        <Target className="w-4 h-4 text-cyan flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-cyan/70 font-mono mr-2">{epa.id}</span>
          <span className="text-sm text-slate-light">{epa.name}</span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            epa.tier === 'executive' ? 'bg-gold/20 text-gold' : 'bg-cyan/20 text-cyan'
          }`}
        >
          {epa.tier}
        </span>
        <span className="text-xs text-slate-light/50">{epa.ksbCount} KSBs</span>
      </div>

      {isExpanded && (
        <div className="border-l border-nex-border/50 ml-6">
          {epa.domains.map((domain) => (
            <DomainNode key={domain.id} domain={domain} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface CPANodeProps {
  cpa: HierarchyCPA;
}

function CPANode({ cpa }: CPANodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = cpa.epas.length > 0;

  return (
    <div className="border-b border-nex-border/50 last:border-b-0">
      <div
        className="flex items-center gap-3 py-3 px-4 hover:bg-nex-light/30 cursor-pointer transition-colors"
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-light/50 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-light/50 flex-shrink-0" />
          )
        ) : (
          <span className="w-5" />
        )}
        <Layers className="w-5 h-5 text-gold flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gold/70 font-mono">{cpa.id}</span>
            <span className="font-medium text-slate-light">{cpa.name}</span>
          </div>
          <p className="text-xs text-slate-light/60 mt-0.5">{cpa.focusArea}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-cyan/10 text-cyan px-2 py-1 rounded">
            {cpa.epas.length} EPAs
          </span>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
            {cpa.ksbCount} KSBs
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-l-2 border-gold/30 ml-6 bg-nex-deep/50">
          {cpa.epas.map((epa) => (
            <EPANode key={epa.id} epa={epa} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Tree Component
// ============================================================================

export function HierarchyTree({ hierarchy }: HierarchyTreeProps) {
  const [filter, setFilter] = useState<'all' | 'core' | 'executive'>('all');

  // Filter CPAs based on EPA tier
  const filteredCPAs = hierarchy.cpas.map((cpa) => ({
    ...cpa,
    epas:
      filter === 'all'
        ? cpa.epas
        : cpa.epas.filter((epa) => epa.tier === filter),
  })).filter((cpa) => filter === 'all' || cpa.epas.length > 0);

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex items-center gap-4 p-4 border-b border-nex-border bg-nex-deep/50">
        <span className="text-xs text-slate-light/70 uppercase tracking-wider">
          Filter by EPA Tier:
        </span>
        <div className="flex gap-2">
          {(['all', 'core', 'executive'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilter(tier)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                filter === tier
                  ? tier === 'executive'
                    ? 'bg-gold text-nex-deep'
                    : 'bg-cyan text-nex-deep'
                  : 'bg-nex-light/30 text-slate-light hover:bg-nex-light/50'
              }`}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Content */}
      <div className="divide-y divide-nex-border/30">
        {filteredCPAs.map((cpa) => (
          <CPANode key={cpa.id} cpa={cpa} />
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-nex-border bg-nex-deep/50">
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-light/60">
          <span className="font-medium text-slate-light/80">Legend:</span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gold" /> CPA
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan" /> EPA
          </span>
          <span className="flex items-center gap-1.5">
            <Grid3X3 className="w-3.5 h-3.5 text-purple-400" /> Domain
          </span>
          <span className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-blue-400" /> Knowledge
          </span>
          <span className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-emerald-400" /> Skill
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" /> Behavior
          </span>
        </div>
      </div>
    </div>
  );
}
