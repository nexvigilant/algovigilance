'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { logger } from '@/lib/logger';
const log = logger.scope('components/pdc-hierarchy-tree');
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Target,
  Grid3X3,
  CheckCircle,
  Clock,
  FileEdit,
} from 'lucide-react';
import type { PDCHierarchy, PDCHierarchyCPA, PDCHierarchyEPA, PDCHierarchyDomain } from '@/types/pdc-framework';
import { CAREER_STAGE_COLORS, type CPACareerStage } from '@/types/pdc-framework';

// ============================================================================
// Hierarchy Tree Component (Client-side with data fetching)
// ============================================================================

export function PDCHierarchyTree() {
  const [hierarchy, setHierarchy] = useState<PDCHierarchy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHierarchy() {
      try {
        const response = await fetch('/api/admin/pdc/hierarchy');
        if (response.ok) {
          const data = await response.json();
          setHierarchy(data);
        }
      } catch (error) {
        log.error('Failed to fetch hierarchy:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHierarchy();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-light/50">
        Loading hierarchy...
      </div>
    );
  }

  if (!hierarchy || hierarchy.cpas.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-light/70 mb-2">No CPAs found in the database.</p>
        <p className="text-sm text-slate-light/50">
          Use the &quot;Seed CPAs&quot; button above to initialize the framework.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-nex-border/30">
      {hierarchy.cpas.map((cpa) => (
        <CPANode key={cpa.id} cpa={cpa} />
      ))}
    </div>
  );
}

// ============================================================================
// CPA Node
// ============================================================================

interface CPANodeProps {
  cpa: PDCHierarchyCPA;
}

function CPANode({ cpa }: CPANodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = cpa.epas.length > 0;

  const stageColors = CAREER_STAGE_COLORS[cpa.careerStage as CPACareerStage] || {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

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
            <Link
              href={`/nucleus/admin/academy/pdc/cpas/${cpa.id}`}
              className="font-medium text-slate-light hover:text-gold transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {cpa.name}
            </Link>
          </div>
          <p className="text-xs text-slate-light/60 mt-0.5">{cpa.focusArea}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded ${stageColors.bg} ${stageColors.text}`}>
            {cpa.careerStage}
          </span>
          <span className="text-xs bg-cyan/10 text-cyan px-2 py-1 rounded">
            {cpa.epas.length} EPAs
          </span>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
            {cpa.stats.ksbCount} KSBs
          </span>
          <StatusBadge status={cpa.status} />
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
// EPA Node
// ============================================================================

interface EPANodeProps {
  epa: PDCHierarchyEPA;
  depth: number;
}

function EPANode({ epa, depth }: EPANodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = epa.domains.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-3 py-2 px-3 hover:bg-nex-light/30 cursor-pointer transition-colors"
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
            epa.tier === 'Executive' ? 'bg-gold/20 text-gold' : 'bg-cyan/20 text-cyan'
          }`}
        >
          {epa.tier}
        </span>
        <span className="text-xs text-slate-light/50">{epa.stats.ksbCount} KSBs</span>
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

// ============================================================================
// Domain Node
// ============================================================================

interface DomainNodeProps {
  domain: PDCHierarchyDomain;
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
        <span className="text-xs text-slate-light/50 ml-2">
          ({domain.stats.total} KSBs)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
          {domain.stats.published} published
        </span>
        {domain.stats.draft > 0 && (
          <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded">
            {domain.stats.draft} draft
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Status Badge
// ============================================================================

interface StatusBadgeProps {
  status: 'draft' | 'published' | 'archived';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    published: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    draft: { icon: FileEdit, color: 'text-slate-400', bg: 'bg-slate-500/20' },
    archived: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  };

  const { icon: Icon, color, bg } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${color} ${bg}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}
