'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, Briefcase, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { searchExperts, getRecommendedExperts, type MarketplaceExpert } from '../../actions/marketplace';

const CATEGORY_OPTIONS = [
  { value: 'pharmacovigilance', label: 'Vigilance' },
  { value: 'signal_detection', label: 'Signal Det.' },
  { value: 'regulatory_affairs', label: 'Regulatory' },
  { value: 'drug_safety', label: 'Drug Safety' },
  { value: 'biostatistics', label: 'Biostatistics' },
  { value: 'medicinal_chemistry', label: 'Med. Chem.' },
  { value: 'toxicology', label: 'Toxicology' },
  { value: 'clinical_research', label: 'Clinical' },
];

function ClearanceBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-cyan/8 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-cyan border border-cyan/20">
      <Shield className="h-2.5 w-2.5" />
      Verified
    </span>
  );
}

function AvailabilityIndicator({ status }: { status: string }) {
  const isAvailable = status === 'available';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-gold/60'}`} />
      <span className={`text-[10px] font-mono uppercase tracking-wider ${isAvailable ? 'text-emerald-400' : 'text-gold/80'}`}>
        {isAvailable ? 'Available' : 'Limited'}
      </span>
    </span>
  );
}

function ExpertCard({ expert, index }: { expert: MarketplaceExpert; index: number }) {
  return (
    <div className="group relative overflow-hidden border border-nex-light/60 bg-gradient-to-b from-nex-surface/80 to-nex-deep/40 transition-all duration-300 hover:border-cyan/25 hover:shadow-[0_0_40px_rgba(0,174,239,0.04)]">
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="p-5">
        {/* Header row: index + name + clearance */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="flex-shrink-0 mt-0.5 text-[10px] font-mono text-slate-dim/50 tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-semibold text-slate-light truncate tracking-tight">
                  {expert.displayName}
                </h3>
                <ClearanceBadge verified={expert.verified} />
              </div>
              <p className="text-xs text-slate-dim/80 truncate font-mono">
                {expert.title}
              </p>
            </div>
          </div>

          {/* Rating block */}
          <div className="flex-shrink-0 ml-3 text-right">
            <div className="text-lg font-bold tabular-nums text-white leading-none">
              {expert.rating.toFixed(1)}
            </div>
            <div className="text-[10px] text-slate-dim/60 font-mono">
              {expert.reviewCount} reviews
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {expert.topSkills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-slate-dim/90 bg-nex-deep/80 border border-nex-light/40 tracking-wide"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Footer: metadata + action */}
        <div className="flex items-center justify-between pt-3 border-t border-nex-light/30">
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-dim/70">
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {expert.yearsExperience}Y EXP
            </span>
            <AvailabilityIndicator status={expert.availability} />
          </div>
          <button className="flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-widest text-cyan/70 hover:text-cyan transition-colors">
            Engage
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Match reason */}
        {expert.matchReasons.length > 0 && (
          <div className="mt-3 pt-2 border-t border-dashed border-nex-light/20">
            <p className="text-[10px] font-mono text-cyan/50 tracking-wide">
              MATCH: {expert.matchReasons[0]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpertCardSkeleton() {
  return (
    <div className="border border-nex-light/60 bg-nex-surface/40 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-1.5" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="flex gap-1 mb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="pt-3 border-t border-nex-light/30 flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function MarketplaceDashboard() {
  const [query, setQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [experts, setExperts] = useState<MarketplaceExpert[]>([]);
  const [recommended, setRecommended] = useState<MarketplaceExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    async function loadRecommended() {
      const result = await getRecommendedExperts();
      if (result.success && result.data) {
        setRecommended(result.data.experts);
        setExperts(result.data.experts);
      }
      setLoading(false);
    }
    loadRecommended();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() && selectedCategories.length === 0) {
      setExperts(recommended);
      return;
    }

    setSearchLoading(true);
    const result = await searchExperts(
      query,
      selectedCategories.length > 0 ? selectedCategories : undefined
    );
    if (result.success && result.data) {
      setExperts(result.data.experts);
    }
    setSearchLoading(false);
  }, [query, selectedCategories, recommended]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(handleSearch, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [query, selectedCategories, handleSearch, loading]);

  return (
    <div className="flex flex-col gap-golden-3 lg:flex-row">
      {/* Sidebar — filters */}
      <aside className="w-full lg:w-60 flex-shrink-0 space-y-4">
        <div className="border border-nex-light/60 bg-nex-surface/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/70">
              Query Interface
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-dim/50" />
            <Input
              placeholder="Search experts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-8 text-xs font-mono bg-nex-deep/80 border-nex-light/40 text-slate-light placeholder:text-slate-dim/40 focus:border-cyan/40 rounded-none"
            />
          </div>
        </div>

        <div className="border border-nex-light/60 bg-nex-surface/30 p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/70 block mb-3">
            Classification Filter
          </span>
          <div className="flex flex-wrap gap-1">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all ${
                  selectedCategories.includes(cat.value)
                    ? 'bg-cyan/12 text-cyan border border-cyan/30'
                    : 'bg-nex-deep/60 text-slate-dim/60 border border-nex-light/30 hover:border-cyan/20 hover:text-slate-dim'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry block */}
        <div className="border border-nex-light/60 bg-nex-surface/30 p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/70 block mb-3">
            Network Status
          </span>
          <div className="space-y-2">
            {[
              { label: 'ACTIVE EXPERTS', value: String(experts.length), color: 'text-cyan' },
              { label: 'DISCIPLINES', value: '14', color: 'text-slate-light' },
              { label: 'PLATFORM FEE', value: '15%', color: 'text-gold' },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center">
                <span className="text-[9px] font-mono text-slate-dim/50 tracking-wider">{stat.label}</span>
                <span className={`text-xs font-mono font-semibold tabular-nums ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main grid */}
      <main className="flex-1">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-nex-light/60 to-transparent" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50">
            {searchLoading ? 'Querying...' : `${experts.length} results`}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-nex-light/60 to-transparent" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ExpertCardSkeleton key={i} />
            ))}
          </div>
        ) : experts.length === 0 ? (
          <div className="border border-nex-light/60 bg-nex-surface/30 p-12 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50">
              No experts match your current filters
            </p>
            <button
              onClick={() => { setQuery(''); setSelectedCategories([]); }}
              className="mt-4 text-[10px] font-mono uppercase tracking-widest text-cyan/60 hover:text-cyan transition-colors"
            >
              [ Reset Filters ]
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-golden-2">
            {experts.map((expert, i) => (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
              >
                <ExpertCard expert={expert} index={i} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
