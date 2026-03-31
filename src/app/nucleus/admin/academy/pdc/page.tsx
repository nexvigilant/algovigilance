import { createMetadata } from '@/lib/metadata';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  Layers,
  Target,
  Grid3X3,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileUp,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getPDCStats } from '@/lib/actions/pdc';
import { PDCHierarchyTree } from './components/pdc-hierarchy-tree';
import { SeedCPAsButton } from './components/seed-cpas-button';

export const metadata = createMetadata({
  title: 'PDC Framework',
  description: 'Manage the Pharmacovigilance Development Continuum framework',
  path: '/nucleus/admin/academy/pdc',
});

// ============================================================================
// Stats Card Component
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subtext?: string;
}

function StatCard({ label, value, icon, color, bgColor, subtext }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-nex-border`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={color}>{icon}</div>
        <span className="text-xs text-slate-light/70 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-light/50 mt-1">{subtext}</p>}
    </div>
  );
}

// ============================================================================
// Quick Action Card
// ============================================================================

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

function ActionCard({ title, description, href, icon, color }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 p-4 bg-nex-surface rounded-lg border border-nex-border hover:border-cyan/50 transition-all"
    >
      <div className={`p-2 rounded-lg bg-nex-light/50 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-light group-hover:text-cyan transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-light/60 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-slate-light/30 group-hover:text-cyan group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

// ============================================================================
// Stats Dashboard
// ============================================================================

async function PDCStatsDashboard() {
  const stats = await getPDCStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <StatCard
        label="CPAs"
        value={stats.totalCPAs}
        icon={<Layers className="w-4 h-4" />}
        color="text-gold"
        bgColor="bg-gold/10"
        subtext={`${stats.publishedCPAs} published`}
      />
      <StatCard
        label="EPAs"
        value={stats.totalEPAs}
        icon={<Target className="w-4 h-4" />}
        color="text-cyan"
        bgColor="bg-cyan/10"
      />
      <StatCard
        label="Domains"
        value={stats.totalDomains}
        icon={<Grid3X3 className="w-4 h-4" />}
        color="text-purple-400"
        bgColor="bg-purple-400/10"
      />
      <StatCard
        label="KSBs"
        value={stats.totalKSBs.toLocaleString()}
        icon={<BookOpen className="w-4 h-4" />}
        color="text-emerald-400"
        bgColor="bg-emerald-400/10"
      />
      <StatCard
        label="Coverage"
        value={`${stats.contentCoverage}%`}
        icon={<TrendingUp className="w-4 h-4" />}
        color="text-blue-400"
        bgColor="bg-blue-400/10"
      />
      <StatCard
        label="Published"
        value={stats.publishedCPAs}
        icon={<CheckCircle className="w-4 h-4" />}
        color="text-green-400"
        bgColor="bg-green-400/10"
      />
      <StatCard
        label="Draft"
        value={stats.draftCPAs}
        icon={<Clock className="w-4 h-4" />}
        color="text-amber-400"
        bgColor="bg-amber-400/10"
      />
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default async function PDCDashboardPage() {
  const stats = await getPDCStats();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-cyan/60 mb-2">
          Framework Administration
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline uppercase tracking-wide text-gold">
              PDC Framework
            </h1>
            <p className="text-slate-light mt-1">
              Pharmacovigilance Development Continuum: CPA &rarr; EPA &rarr; Domain &rarr; KSB
            </p>
          </div>

          {/* Seed button if no CPAs exist */}
          {stats.totalCPAs === 0 && <SeedCPAsButton />}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="mb-8">
        <Suspense
          fallback={
            <div className="h-24 bg-nex-surface animate-pulse rounded-lg" />
          }
        >
          <PDCStatsDashboard />
        </Suspense>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-light mb-4">
          Quick Actions
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            title="Manage CPAs"
            description="View and edit Career Practice Activities"
            href="/nucleus/admin/academy/pdc/cpas"
            icon={<Layers className="w-5 h-5" />}
            color="text-gold"
          />
          <ActionCard
            title="View Hierarchy"
            description="Explore the full PDC tree structure"
            href="/nucleus/admin/academy/pdc/hierarchy"
            icon={<Grid3X3 className="w-5 h-5" />}
            color="text-purple-400"
          />
          <ActionCard
            title="Import Data"
            description="Sync from Google Sheet master workbook"
            href="/nucleus/admin/academy/pdc/import"
            icon={<FileUp className="w-5 h-5" />}
            color="text-blue-400"
          />
          <ActionCard
            title="EPA Pathways"
            description="Manage Entrustable Professional Activities"
            href="/nucleus/admin/academy/framework"
            icon={<Target className="w-5 h-5" />}
            color="text-cyan"
          />
          <ActionCard
            title="Domain KSBs"
            description="Edit Knowledge, Skills, and Behaviors"
            href="/nucleus/admin/academy/pv-domains"
            icon={<BookOpen className="w-5 h-5" />}
            color="text-emerald-400"
          />
          <ActionCard
            title="Quality Dashboard"
            description="Coverage matrix and gap analysis"
            href="/nucleus/admin/academy/pdc/quality"
            icon={<Sparkles className="w-5 h-5" />}
            color="text-amber-400"
          />
        </div>
      </div>

      {/* Hierarchy Preview */}
      <div className="bg-nex-surface rounded-lg border border-nex-border">
        <div className="p-4 border-b border-nex-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-light">
              PDC Hierarchy
            </h2>
            <p className="text-sm text-slate-light/70">
              Career Practice Activities and their EPA pathways
            </p>
          </div>
          <Link
            href="/nucleus/admin/academy/pdc/hierarchy"
            className="text-sm text-cyan hover:text-cyan-glow flex items-center gap-1"
          >
            View Full Tree <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="p-8 text-center text-slate-light/50">
              Loading hierarchy...
            </div>
          }
        >
          <PDCHierarchyTree />
        </Suspense>
      </div>
    </div>
  );
}
