'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { VIGILANCE_SECTIONS } from './components/vigilance-hub-config';
import type { VigilanceDomain } from './components/vigilance-hub-config';
import { DomainSelector, type DomainFilter } from './components/domain-selector';
import { BrandedSectionCard } from '@/components/ui/branded/branded-section-card';
import Link from 'next/link';
import { ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { AtmosphereLayers, ATMOSPHERE_WAR_ROOM } from '@/components/ui/branded/atmosphere-layers';
import { SPHERE_PRESET_WAR_ROOM } from '@/components/ui/branded/shader-sphere';

const ShaderSphere = dynamic(
  () => import('@/components/ui/branded/shader-sphere').then(m => ({ default: m.ShaderSphere })),
  { ssr: false, loading: () => <div className="h-[120px] w-[120px] rounded-full bg-nex-dark/50 animate-pulse" /> }
);

export default function VigilanceHubPage() {
  const { user, loading } = useAuth();
  const [activeDomain, setActiveDomain] = useState<DomainFilter>('all');

  const filteredSections = useMemo(() => {
    if (activeDomain === 'all') return VIGILANCE_SECTIONS;
    return VIGILANCE_SECTIONS.filter((s) => s.domains.includes(activeDomain as VigilanceDomain));
  }, [activeDomain]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col" aria-busy="true">
        <header className="mb-12 text-center">
          <Skeleton className="h-3 w-48 mx-auto mb-3" />
          <Skeleton className="h-10 w-56 mx-auto mb-4" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </header>
        <div className="flex items-start justify-center pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="relative h-full overflow-hidden border border-white/[0.08] bg-white/[0.04] p-6">
                <div className="relative z-10">
                  <Skeleton className="mb-4 h-10 w-10" />
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="mb-4 h-10 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* War-room sphere hero */}
      <div className="relative mb-golden-3 h-[180px] overflow-hidden border border-red-400/20 bg-nex-deep">
        <AtmosphereLayers config={ATMOSPHERE_WAR_ROOM} layers={['glow', 'grid', 'vignette']} />
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <ShaderSphere config={{ ...SPHERE_PRESET_WAR_ROOM, size: [100, 140] }} />
        </div>
      </div>

      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-red-400/30 bg-red-400/5">
            <Activity className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-red-400/60">
              AlgoVigilance Vigilance
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Vigilance
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Signal detection, causality assessment, and safety classification tools powered by NexCore
        </p>
        {user?.displayName && (
          <p className="mt-golden-2 text-[10px] font-mono uppercase tracking-widest text-cyan/50">
            Welcome, {user.displayName.split(' ')[0]}
          </p>
        )}
      </header>

      <div className="flex items-center gap-2 mb-golden-3 text-[10px] font-mono uppercase tracking-widest text-slate-dim/50">
        <span>Related:</span>
        <Link
          href="/nucleus/guardian"
          className="inline-flex items-center gap-1 text-cyan/60 hover:text-cyan transition-colors"
        >
          <ShieldCheck className="h-3 w-3" />
          Guardian Dashboard
        </Link>
      </div>

      <div className="mb-golden-3">
        <DomainSelector value={activeDomain} onChange={setActiveDomain} />
      </div>

      <div className="flex items-start justify-center pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-golden-2 max-w-5xl w-full">
          {filteredSections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="relative"
            >
              {section.comingSoon && (
                <div className="absolute top-3 right-3 z-20 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border border-white/10 bg-nex-deep/80 text-slate-dim/60">
                  Coming Soon
                </div>
              )}
              <div className={section.comingSoon ? 'opacity-60 pointer-events-none' : undefined}>
                <BrandedSectionCard
                  title={section.title}
                  description={section.description}
                  href={section.comingSoon ? '#' : section.href}
                  icon={section.icon}
                  color={section.color}
                  hoverBorder={section.hoverBorder}
                  shadowHoverClass="hover:shadow-[0_0_30px_rgba(239,68,68,0.06)]"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
