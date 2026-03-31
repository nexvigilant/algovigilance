import { createMetadata } from '@/lib/metadata';
import Link from 'next/link';
import {
  Layers,
  Target,
  Grid3X3,
  ArrowRight,
  CheckCircle,
  Clock,
  FileEdit,
  Plus,
} from 'lucide-react';
import { getAllCPAs } from '@/lib/actions/pdc';
import { CAREER_STAGE_COLORS, type CPACareerStage } from '@/types/pdc-framework';

export const metadata = createMetadata({
  title: 'CPA Management',
  description: 'Manage Career Practice Activities in the PDC framework',
  path: '/nucleus/admin/academy/pdc/cpas',
});

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: 'draft' | 'published' | 'archived' }) {
  const config = {
    published: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Published' },
    draft: { icon: FileEdit, color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Draft' },
    archived: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Archived' },
  };

  const { icon: Icon, color, bg, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${color} ${bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ============================================================================
// CPA Card
// ============================================================================

interface CPACardProps {
  cpa: {
    id: string;
    name: string;
    focusArea: string;
    careerStage: CPACareerStage;
    summary: string;
    keyEPAs: string[];
    primaryDomains: string[];
    status: 'draft' | 'published' | 'archived';
    stats: {
      epaCount: number;
      domainCount: number;
      ksbCount: number;
      contentCoverage: number;
    };
  };
}

function CPACard({ cpa }: CPACardProps) {
  const stageColors = CAREER_STAGE_COLORS[cpa.careerStage] || {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

  return (
    <Link
      href={`/nucleus/admin/academy/pdc/cpas/${cpa.id}`}
      className="group block bg-nex-surface rounded-lg border border-nex-border hover:border-gold/50 transition-all"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold" />
            <span className="text-sm font-mono text-gold/70">{cpa.id}</span>
          </div>
          <StatusBadge status={cpa.status} />
        </div>

        {/* Title & Focus */}
        <h3 className="text-lg font-semibold text-slate-light group-hover:text-gold transition-colors mb-1">
          {cpa.name}
        </h3>
        <p className="text-sm text-slate-light/70 mb-3">{cpa.focusArea}</p>

        {/* Career Stage */}
        <div className="mb-4">
          <span className={`inline-block text-xs px-2.5 py-1 rounded ${stageColors.bg} ${stageColors.text} ${stageColors.border} border`}>
            {cpa.careerStage}
          </span>
        </div>

        {/* Summary (truncated) */}
        {cpa.summary && (
          <p className="text-sm text-slate-light/60 line-clamp-2 mb-4">
            {cpa.summary}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Target className="w-4 h-4 text-cyan" />
            <span className="text-slate-light">{cpa.keyEPAs.length}</span>
            <span className="text-slate-light/50">EPAs</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Grid3X3 className="w-4 h-4 text-purple-400" />
            <span className="text-slate-light">{cpa.primaryDomains.length}</span>
            <span className="text-slate-light/50">Domains</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-emerald-400 font-medium">{cpa.stats.ksbCount}</span>
            <span className="text-slate-light/50">KSBs</span>
          </div>
        </div>

        {/* Coverage Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-light/50">Content Coverage</span>
            <span className="text-slate-light">{cpa.stats.contentCoverage}%</span>
          </div>
          <div className="h-1.5 bg-nex-light/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan to-gold rounded-full transition-all"
              style={{ width: `${cpa.stats.contentCoverage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-nex-border/50 flex items-center justify-between">
        <span className="text-xs text-slate-light/50">
          Order: {parseInt(cpa.id.replace('CPA-', ''))}
        </span>
        <span className="text-sm text-cyan group-hover:text-cyan-glow flex items-center gap-1">
          View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default async function CPAsPage() {
  const cpas = await getAllCPAs();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <nav className="text-sm text-slate-light/50 mb-2">
            <Link href="/nucleus/admin/academy/pdc" className="hover:text-cyan">
              PDC Framework
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-light">CPAs</span>
          </nav>
          <h1 className="text-3xl font-headline uppercase tracking-wide text-gold">
            Career Practice Activities
          </h1>
          <p className="text-slate-light mt-1">
            {cpas.length} CPAs define the major career pathways in pharmacovigilance
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/nucleus/admin/academy/pdc/cpas/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-nex-deep rounded-lg font-medium hover:bg-gold-bright transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add CPA
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex items-center gap-4">
        <span className="text-xs text-slate-light/70 uppercase tracking-wider">
          Filter by Stage:
        </span>
        <div className="flex gap-2">
          {['All', 'Foundation', 'Advanced', 'Executive'].map((stage) => (
            <button
              key={stage}
              className="px-3 py-1 text-xs rounded bg-nex-light/30 text-slate-light hover:bg-nex-light/50 transition-colors"
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* CPA Grid */}
      {cpas.length === 0 ? (
        <div className="text-center py-16 bg-nex-surface rounded-lg border border-nex-border">
          <Layers className="w-12 h-12 text-gold/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-light mb-2">No CPAs Found</h3>
          <p className="text-slate-light/60 mb-4">
            Get started by seeding the 8 standard CPAs from the PDC Manual.
          </p>
          <Link
            href="/nucleus/admin/academy/pdc"
            className="text-cyan hover:text-cyan-glow"
          >
            Go to PDC Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {cpas.map((cpa) => (
            <CPACard key={cpa.id} cpa={cpa} />
          ))}
        </div>
      )}
    </div>
  );
}
