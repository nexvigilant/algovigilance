'use client';

import Link from 'next/link';
import { Briefcase, Target, FolderOpen, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CareerSection {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'cyan' | 'gold' | 'copper';
  comingSoon?: boolean;
}

const CAREER_SECTIONS: CareerSection[] = [
  {
    title: 'Capability Tracker',
    description: 'Track your skills, identify gaps, and match with career paths',
    href: '/nucleus/careers/skills',
    icon: Target,
    color: 'cyan',
  },
  {
    title: 'Portfolio',
    description: 'Showcase your work samples and professional artifacts',
    href: '/nucleus/careers/portfolio',
    icon: FolderOpen,
    color: 'gold',
    comingSoon: true,
  },
  {
    title: 'Assessments',
    description: 'Evaluate competencies and accelerate career development',
    href: '/nucleus/careers/assessments',
    icon: ClipboardCheck,
    color: 'copper',
  },
];

function SectionCard({ section }: { section: CareerSection }) {
  const Icon = section.icon;
  const colorClasses = {
    cyan: {
      glow: 'bg-cyan',
      border: 'border-cyan/30 hover:border-cyan hover:shadow-glow-cyan',
      orb: 'bg-cyan/10 border-cyan/40 group-hover:bg-cyan/20 group-hover:border-cyan group-hover:shadow-glow-cyan',
      icon: 'text-cyan',
      title: 'text-slate-light group-hover:text-cyan',
      accent: 'bg-cyan',
    },
    gold: {
      glow: 'bg-gold',
      border: 'border-gold/30 hover:border-gold hover:shadow-glow-gold',
      orb: 'bg-gold/10 border-gold/40 group-hover:bg-gold/20 group-hover:border-gold group-hover:shadow-glow-gold',
      icon: 'text-gold',
      title: 'text-slate-light group-hover:text-gold',
      accent: 'bg-gold',
    },
    copper: {
      glow: 'bg-copper',
      border: 'border-copper/30 hover:border-copper hover:shadow-glow-copper',
      orb: 'bg-copper/10 border-copper/40 group-hover:bg-copper/20 group-hover:border-copper group-hover:shadow-glow-copper',
      icon: 'text-copper',
      title: 'text-slate-light group-hover:text-copper',
      accent: 'bg-copper',
    },
  }[section.color];

  const cardContent = (
    <div
      className={cn(
        "relative flex flex-col items-center p-golden-4 border transition-all duration-300",
        "bg-nex-surface/80 backdrop-blur-sm",
        colorClasses.border,
        !section.comingSoon && "group-hover:-translate-y-1"
      )}
    >
      {/* Coming Soon Badge */}
      {section.comingSoon && (
        <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-mono uppercase tracking-widest bg-nex-light text-slate-dim border border-nex-light">
          Coming Soon
        </div>
      )}

      {/* Icon box */}
      <div
        className={cn(
          "w-14 h-14 flex items-center justify-center mb-golden-3 transition-all duration-300",
          "border",
          colorClasses.orb
        )}
      >
        <Icon
          className={cn(
            "w-7 h-7 transition-transform duration-300",
            !section.comingSoon && "group-hover:scale-110",
            colorClasses.icon
          )}
        />
      </div>

      {/* Title */}
      <h2
        className={cn(
          "text-lg font-bold font-headline mb-golden-1 transition-colors duration-300",
          colorClasses.title
        )}
      >
        {section.title}
      </h2>

      {/* Description */}
      <p className="text-sm text-slate-dim text-center leading-golden">
        {section.description}
      </p>

      {/* Bottom accent line */}
      {!section.comingSoon && (
        <div
          className={cn(
            "absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-300 group-hover:w-full",
            colorClasses.accent
          )}
        />
      )}
    </div>
  );

  if (section.comingSoon) {
    return (
      <div className="group relative cursor-not-allowed opacity-70">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={section.href} className="group relative">
      {cardContent}
    </Link>
  );
}

export default function CareersLandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <Briefcase className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Careers
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Build your professional profile, track career progress, and connect with opportunities
        </p>
      </header>

      {/* Section Cards — 3-column grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-golden-3 max-w-5xl w-full">
          {CAREER_SECTIONS.map((section, i) => (
            <motion.div
              key={section.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              <SectionCard section={section} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
