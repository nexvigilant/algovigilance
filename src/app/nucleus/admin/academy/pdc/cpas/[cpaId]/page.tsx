import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Target,
  Grid3X3,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  FileEdit,
  Edit,
  BookOpen,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { getCPAById, getCPAEPAs, getCPADomains } from '@/lib/actions/pdc';
import { CAREER_STAGE_COLORS, type CPACareerStage, type CPAProficiencyLevel } from '@/types/pdc-framework';

// ============================================================================
// Generate Metadata
// ============================================================================

interface PageProps {
  params: Promise<{ cpaId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cpaId } = await params;
  const cpa = await getCPAById(cpaId);

  if (!cpa) {
    return { title: 'CPA Not Found' };
  }

  return {
    title: `${cpa.name} | PDC Framework`,
    description: cpa.summary || cpa.focusArea,
  };
}

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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium ${color} ${bg}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}

// ============================================================================
// Stat Card
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-nex-light/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={color}>{icon}</div>
        <span className="text-xs text-slate-light/70 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ============================================================================
// EPA Card
// ============================================================================

interface EPACardProps {
  epa: {
    id: string;
    name: string;
    tier: string;
    description?: string;
    domains: string[];
    ksbCount: number;
  };
}

function EPACard({ epa }: EPACardProps) {
  return (
    <Link
      href={`/nucleus/admin/academy/framework/${epa.id}`}
      className="group block bg-nex-light/20 rounded-lg p-4 border border-nex-border hover:border-cyan/50 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan" />
          <span className="text-xs font-mono text-cyan/70">{epa.id}</span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            epa.tier === 'Executive' ? 'bg-gold/20 text-gold' : 'bg-cyan/20 text-cyan'
          }`}
        >
          {epa.tier}
        </span>
      </div>
      <h4 className="font-medium text-slate-light group-hover:text-cyan transition-colors mb-2">
        {epa.name}
      </h4>
      {epa.description && (
        <p className="text-sm text-slate-light/60 line-clamp-2 mb-3">{epa.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-light/50">
        <span>{epa.domains.length} domains</span>
        <span>{epa.ksbCount} KSBs</span>
      </div>
    </Link>
  );
}

// ============================================================================
// Domain Card
// ============================================================================

interface DomainCardProps {
  domain: {
    id: string;
    name: string;
    ksbCount: number;
    publishedCount: number;
  };
}

function DomainCard({ domain }: DomainCardProps) {
  return (
    <Link
      href={`/nucleus/admin/academy/pv-domains/${domain.id}`}
      className="group flex items-center gap-4 bg-nex-light/20 rounded-lg p-4 border border-nex-border hover:border-purple-400/50 transition-all"
    >
      <div className="p-2 bg-purple-400/10 rounded-lg">
        <Grid3X3 className="w-5 h-5 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-purple-400/70">{domain.id}</span>
        </div>
        <h4 className="font-medium text-slate-light group-hover:text-purple-400 transition-colors truncate">
          {domain.name}
        </h4>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-emerald-400">{domain.ksbCount}</p>
        <p className="text-xs text-slate-light/50">KSBs</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-light/30 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default async function CPADetailPage({ params }: PageProps) {
  const { cpaId } = await params;
  const cpa = await getCPAById(cpaId);

  if (!cpa) {
    notFound();
  }

  // Fetch related EPAs and domains
  const [epas, domains] = await Promise.all([
    getCPAEPAs(cpaId),
    getCPADomains(cpaId),
  ]);

  const stageColors = CAREER_STAGE_COLORS[cpa.careerStage as CPACareerStage] || {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-slate-light/50 mb-4">
          <Link href="/nucleus/admin/academy/pdc" className="hover:text-cyan">
            PDC Framework
          </Link>
          <span>/</span>
          <Link href="/nucleus/admin/academy/pdc/cpas" className="hover:text-cyan">
            CPAs
          </Link>
          <span>/</span>
          <span className="text-slate-light">{cpa.id}</span>
        </nav>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Layers className="w-6 h-6 text-gold" />
              <span className="text-sm font-mono text-gold/70">{cpa.id}</span>
              <StatusBadge status={cpa.status} />
            </div>
            <h1 className="text-3xl font-headline uppercase tracking-wide text-gold mb-2">
              {cpa.name}
            </h1>
            <p className="text-lg text-slate-light/80">{cpa.focusArea}</p>
            <div className="mt-3">
              <span
                className={`inline-block text-sm px-3 py-1.5 rounded ${stageColors.bg} ${stageColors.text} ${stageColors.border} border`}
              >
                {cpa.careerStage}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={`/nucleus/admin/academy/pdc/cpas/${cpa.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-nex-light rounded-lg text-slate-light hover:text-gold transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="EPAs"
          value={cpa.stats.epaCount}
          icon={<Target className="w-4 h-4" />}
          color="text-cyan"
        />
        <StatCard
          label="Domains"
          value={cpa.stats.domainCount}
          icon={<Grid3X3 className="w-4 h-4" />}
          color="text-purple-400"
        />
        <StatCard
          label="KSBs"
          value={cpa.stats.ksbCount}
          icon={<BookOpen className="w-4 h-4" />}
          color="text-emerald-400"
        />
        <StatCard
          label="Coverage"
          value={`${cpa.stats.contentCoverage}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="text-blue-400"
        />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary */}
          {cpa.summary && (
            <section className="bg-nex-surface rounded-lg border border-nex-border p-6">
              <h2 className="text-lg font-semibold text-slate-light mb-4">Summary</h2>
              <p className="text-slate-light/80 leading-relaxed">{cpa.summary}</p>
            </section>
          )}

          {/* AI Integration */}
          {cpa.aiIntegration && (
            <section className="bg-nex-surface rounded-lg border border-nex-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-semibold text-slate-light">AI Integration</h2>
              </div>
              <p className="text-slate-light/80 leading-relaxed">{cpa.aiIntegration}</p>
            </section>
          )}

          {/* Key EPAs */}
          <section className="bg-nex-surface rounded-lg border border-nex-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan" />
                <h2 className="text-lg font-semibold text-slate-light">Key EPAs</h2>
              </div>
              <span className="text-sm text-slate-light/50">{epas.length} activities</span>
            </div>

            {epas.length === 0 ? (
              <p className="text-slate-light/60 text-center py-8">
                No EPAs linked to this CPA yet.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {epas.map((epa) => (
                  <EPACard key={epa.id} epa={epa} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Primary Domains */}
          <section className="bg-nex-surface rounded-lg border border-nex-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Grid3X3 className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-slate-light">Primary Domains</h2>
            </div>

            {domains.length === 0 ? (
              <p className="text-slate-light/60 text-center py-4">
                No domains linked yet.
              </p>
            ) : (
              <div className="space-y-3">
                {domains.map((domain) => (
                  <DomainCard key={domain.id} domain={domain} />
                ))}
              </div>
            )}
          </section>

          {/* Proficiency Levels */}
          {cpa.proficiencyLevels && Object.keys(cpa.proficiencyLevels).length > 0 && (
            <section className="bg-nex-surface rounded-lg border border-nex-border p-6">
              <h2 className="text-lg font-semibold text-slate-light mb-4">
                Proficiency Levels
              </h2>
              <div className="space-y-3">
                {(Object.entries(cpa.proficiencyLevels) as [string, CPAProficiencyLevel][]).map(([levelKey, levelData], index) => (
                  <div
                    key={levelKey}
                    className="bg-nex-light/20 rounded p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 flex items-center justify-center bg-gold/20 text-gold rounded text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-light">{levelData.title}</span>
                      <span className="text-xs text-slate-light/50 ml-auto">{levelKey}</span>
                    </div>
                    {levelData.description && (
                      <p className="text-sm text-slate-light/70 ml-8">{levelData.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Links */}
          <section className="bg-nex-surface rounded-lg border border-nex-border p-6">
            <h2 className="text-lg font-semibold text-slate-light mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/nucleus/admin/academy/pdc/cpas/${cpa.id}/edit`}
                className="flex items-center gap-2 text-sm text-slate-light/70 hover:text-gold transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit CPA Details
              </Link>
              <Link
                href="/nucleus/admin/academy/framework"
                className="flex items-center gap-2 text-sm text-slate-light/70 hover:text-cyan transition-colors"
              >
                <Target className="w-4 h-4" />
                Manage EPA Pathways
              </Link>
              <Link
                href="/nucleus/admin/academy/pv-domains"
                className="flex items-center gap-2 text-sm text-slate-light/70 hover:text-purple-400 transition-colors"
              >
                <Grid3X3 className="w-4 h-4" />
                Manage Domains
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-12 pt-6 border-t border-nex-border flex items-center justify-between">
        <Link
          href="/nucleus/admin/academy/pdc/cpas"
          className="inline-flex items-center gap-2 text-slate-light/70 hover:text-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All CPAs
        </Link>
      </div>
    </div>
  );
}
