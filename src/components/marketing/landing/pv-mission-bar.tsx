'use client';

import React, { useRef } from 'react';
import { Shield, Brain, Server, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const domains = [
  {
    icon: Shield,
    title: 'Patient Safety',
    abbreviation: 'PV',
    description: 'Safety signal detection, causality assessment, and benefit-risk analysis',
    question: 'Are you catching signals before they become headlines?',
    color: 'text-emerald-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]',
    accentBg: 'bg-emerald-400/15',
    accentBorder: 'border-emerald-400/40',
  },
  {
    icon: Brain,
    title: 'AI Safety',
    abbreviation: 'AV',
    description: 'Algorithmovigilance — drift detection, bias monitoring, model governance',
    question: 'Can you trust your AI to do no harm?',
    color: 'text-violet-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(167,139,250,0.15)]',
    accentBg: 'bg-violet-400/15',
    accentBorder: 'border-violet-400/40',
  },
  {
    icon: Server,
    title: 'Cyber Vigilance',
    abbreviation: 'CV',
    description: 'Availability, resilience, and incident prevention at scale',
    question: 'Is your prevention reactive — or truly predictive?',
    color: 'text-amber-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]',
    accentBg: 'bg-amber-400/15',
    accentBorder: 'border-amber-400/40',
  },
  {
    icon: TrendingUp,
    title: 'Market Vigilance',
    abbreviation: 'MV',
    description: 'Competitive intelligence, trend analysis, and market risk monitoring',
    question: 'Are you reacting to the market, or anticipating it?',
    color: 'text-blue-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(96,165,250,0.15)]',
    accentBg: 'bg-blue-400/15',
    accentBorder: 'border-blue-400/40',
  },
  {
    icon: Activity,
    title: 'Sports Analytics Vigilance',
    abbreviation: 'SAV',
    description: 'Performance anomaly detection and biomechanical risk assessment',
    question: 'Can you predict the risk before an injury occurs?',
    color: 'text-rose-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(251,113,133,0.15)]',
    accentBg: 'bg-rose-400/15',
    accentBorder: 'border-rose-400/40',
  },
];

function TiltCard({ domain, index }: { domain: typeof domains[0], index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
      className="relative perspective-[1000px] h-full"
    >
      {/* Domain Card */}
      <div className={cn(
        "group/card relative flex flex-col items-center text-center p-golden-3 rounded-xl",
        "glass-card transition-all duration-300 cursor-pointer h-full border border-white/5",
        "hover:z-20",
        domain.glowColor
      )}
        style={{ transform: "translateZ(40px)" }}
      >
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg mb-golden-2",
          "border transition-all duration-500",
          domain.accentBorder,
          domain.accentBg,
          "group-hover/card:scale-110 group-hover/card:shadow-lg"
        )}>
          <domain.icon className={cn("h-6 w-6 transition-transform duration-300", domain.color)} aria-hidden="true" />
        </div>
        <span className={cn(
          "text-[10px] font-mono uppercase tracking-widest mb-1 opacity-60",
          domain.color
        )}>
          {domain.abbreviation}
        </span>
        <h3 className={cn(
          "text-sm md:text-base font-semibold uppercase tracking-wide mb-1 transition-colors duration-300",
          domain.color
        )}>
          {domain.title}
        </h3>
        <p className="text-xs text-slate-dim leading-snug transition-opacity duration-300 group-hover/card:opacity-0">
          {domain.description}
        </p>
        {/* Question overlay on hover */}
        <p className="absolute bottom-3 left-3 right-3 text-xs text-white/90 leading-snug italic opacity-0 transition-all duration-300 group-hover/card:opacity-100 transform translate-y-1 group-hover/card:translate-y-0">
          &ldquo;{domain.question}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

export function PVMissionBar() {
  return (
    <section className="group relative overflow-hidden py-golden-4 md:py-golden-5 border-y border-nex-light bg-nex-surface/30">
      {/* Electric node effect - top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
        <div className="absolute h-full w-20 bg-gradient-to-r from-transparent via-cyan to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-electric-pulse-right" />
        <div className="absolute h-full w-20 bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-electric-pulse-left" style={{ animationDelay: '0.5s' }} />
        <div className="absolute h-full w-14 bg-gradient-to-r from-transparent via-ember to-transparent opacity-0 group-hover:opacity-80 group-hover:animate-electric-pulse-right" style={{ animationDelay: '1s' }} />
      </div>

      {/* Electric node effect - bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
        <div className="absolute h-full w-20 bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-electric-pulse-right" style={{ animationDelay: '0.25s' }} />
        <div className="absolute h-full w-20 bg-gradient-to-r from-transparent via-cyan to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-electric-pulse-left" style={{ animationDelay: '0.75s' }} />
        <div className="absolute h-full w-14 bg-gradient-to-r from-transparent via-ember to-transparent opacity-0 group-hover:opacity-80 group-hover:animate-electric-pulse-left" style={{ animationDelay: '1.25s' }} />
      </div>

      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan/10 via-ember/[0.03] to-gold/10 opacity-70" />

      <div className="container relative z-10 mx-auto max-w-golden-wide px-golden-3 md:px-golden-5">
        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-golden-4"
          data-neural-exclude
        >
          <h2 className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-2">
            One Framework. Unlimited Domains.
          </h2>
          <p className="text-sm md:text-base text-slate-dim max-w-2xl mx-auto">
            AlgoVigilance Guardian keeps watch, regardless of your domain. See examples below.
          </p>
        </motion.div>

        {/* Domain Cards Grid */}
        <div className="flex flex-wrap justify-center gap-golden-2 md:gap-golden-4 lg:gap-golden-5" data-neural-exclude>
          {domains.map((domain, index) => (
            <div key={domain.title} className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm">
              <TiltCard
                domain={domain}
                index={index}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
