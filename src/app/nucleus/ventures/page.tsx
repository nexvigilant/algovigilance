import { createMetadata } from '@/lib/metadata';
import { Zap, Rocket, Users, Lightbulb, GraduationCap, Presentation, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata = createMetadata({
  title: 'Ventures',
  description: 'Innovation challenges, venture opportunities, and collaborative projects for AlgoVigilances.',
  path: '/nucleus/ventures',
});

interface VentureTrack {
  label: string;
  desc: string;
  icon: typeof Zap;
  color: string;
  bg: string;
  features: string[];
  cta: string;
  href: string;
}

const VENTURE_TRACKS: VentureTrack[] = [
  {
    label: 'Innovation Challenges',
    desc: 'Tackle real pharmacovigilance problems in time-boxed sprints. Submit solutions, get peer review, and win recognition.',
    icon: Lightbulb,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    features: ['Monthly safety data challenges', 'Signal detection competitions', 'Best-practice submissions', 'Peer voting and expert judging'],
    cta: 'View Challenges',
    href: '/nucleus/community',
  },
  {
    label: 'Project Collaboration',
    desc: 'Join cross-functional teams working on open-source PV tools, research papers, and shared resources.',
    icon: Users,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    features: ['Open project board', 'Team formation matching', 'Shared workspaces', 'Progress tracking'],
    cta: 'Browse Projects',
    href: '/nucleus/community',
  },
  {
    label: 'Venture Funding',
    desc: 'Access micro-grants for PV innovation projects. Pitch your idea, get feedback, and secure resources.',
    icon: Rocket,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    features: ['Micro-grant applications', 'Pitch deck templates', 'Mentor matching', 'Milestone-based funding'],
    cta: 'Apply for Funding',
    href: '/nucleus/community',
  },
  {
    label: 'Mentorship Programs',
    desc: 'Connect with senior PV professionals for 1:1 mentorship, career guidance, and skill development.',
    icon: GraduationCap,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    features: ['Mentor directory', 'Structured 12-week programs', 'Specialty matching', 'Progress milestones'],
    cta: 'Find a Mentor',
    href: '/nucleus/careers',
  },
  {
    label: 'Technology Showcase',
    desc: 'Demo your PV tools, get feedback from the community, and discover new technologies in the space.',
    icon: Presentation,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    features: ['Monthly demo sessions', 'Tool reviews', 'Integration guides', 'Community ratings'],
    cta: 'Submit a Demo',
    href: '/nucleus/community',
  },
];

const STATS = [
  { label: 'Active Projects', value: '23', color: 'text-cyan-400' },
  { label: 'Community Members', value: '1.2k', color: 'text-amber-400' },
  { label: 'Challenges Completed', value: '47', color: 'text-emerald-400' },
  { label: 'Mentorship Pairs', value: '36', color: 'text-violet-400' },
];

export default function NucleusVenturesPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)] flex flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <Zap className="h-5 w-5 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/60">
              AlgoVigilance Ventures
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Ventures
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Innovation challenges, collaborative projects, and venture opportunities for AlgoVigilances
        </p>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-golden-2 mb-golden-4">
        {STATS.map((s) => (
          <div key={s.label} className="border border-nex-light bg-nex-surface p-golden-3">
            <p className="text-[9px] font-bold text-slate-dim/50 uppercase tracking-widest font-mono">{s.label}</p>
            <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Venture Tracks */}
      <div className="space-y-golden-3">
        {VENTURE_TRACKS.map((track) => {
          const Icon = track.icon;
          return (
            <div
              key={track.label}
              className="border border-nex-light bg-nex-surface p-golden-4 hover:border-nex-light/80 transition-colors"
            >
              <div className="flex items-start gap-golden-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${track.bg}`}>
                  <Icon className={`h-5 w-5 ${track.color}`} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-golden-1">
                    <h2 className="text-base font-bold text-white">{track.label}</h2>
                    <Link
                      href={track.href}
                      className={`flex items-center gap-1 text-[10px] font-bold font-mono uppercase tracking-widest ${track.color} hover:underline`}
                    >
                      {track.cta}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  <p className="text-sm text-slate-dim/70 mb-golden-2 leading-golden">{track.desc}</p>
                  <div className="grid grid-cols-2 gap-golden-1">
                    {track.features.map((f) => (
                      <div key={f} className="flex items-center gap-golden-1 text-[11px] text-slate-dim/60">
                        <ArrowRight className={`h-3 w-3 shrink-0 ${track.color}`} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
