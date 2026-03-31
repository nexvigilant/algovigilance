'use client';

/**
 * Strategic Diagnostic Assessment - Welcome Screen
 *
 * Entry point for the lead generation exam. Sets expectations and invites users to begin.
 */

import { ArrowRight, Radar, ClipboardCheck, BarChart4, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Title text shadow style extracted to prevent recreation on each render
const TITLE_TEXT_SHADOW = {
  textShadow: '0 0 40px rgba(212, 175, 55, 0.3), 0 2px 4px rgba(0, 0, 0, 0.8)',
} as const;

interface WizardWelcomeProps {
  onStart: () => void;
}

export function WizardWelcome({ onStart }: WizardWelcomeProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero Section */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono uppercase tracking-widest mb-6">
          <Radar className="h-4 w-4" aria-hidden="true" />
          Diagnostic V4.1
        </div>

        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-white mb-6 uppercase tracking-tight"
          style={TITLE_TEXT_SHADOW}
        >
          Strategic
          <br />
          <span className="text-gold">Diagnostic Assessment</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-slate-dim mb-8 leading-relaxed">
          Assess your safety operations. Find gaps, benchmark your maturity, and get
          <span className="text-cyan font-semibold"> a clear path forward</span>.
        </p>

        <Button
          onClick={onStart}
          size="lg"
          className="bg-gold hover:bg-gold-bright text-nex-deep font-bold px-8 py-6 text-lg uppercase tracking-wide transition-all shadow-lg shadow-gold/20"
        >
          Begin Diagnostic
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Value Props */}
      <h2 className="sr-only">What You&apos;ll Discover</h2>
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-3xl">
        <ValueProp
          icon={ClipboardCheck}
          title="Capability Benchmarking"
          description="Assess maturity across 5 areas of drug safety"
        />
        <ValueProp
          icon={ShieldAlert}
          title="Gap Identification"
          description="Locate structural failure modes before they impact regulatory readiness"
        />
        <ValueProp
          icon={BarChart4}
          title="Validated Outcomes"
          description="Receive a precision-mapped intervention strategy based on your data"
        />
      </div>

      {/* Trust Signal */}
      <div className="mt-12 pt-8 border-t border-nex-light w-full max-w-2xl">
        <p className="text-sm font-mono uppercase tracking-widest text-slate-dim/60 mb-2">
          Diagnostic Protocol
        </p>
        <p className="text-sm text-slate-dim leading-relaxed">
          Based on AlgoVigilance standards.
          We build drug safety tools free from corporate influence.
          <span className="text-gold font-medium"> Clinical expertise. Data science. Clear thinking.</span>
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ValuePropProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function ValueProp({ icon: Icon, title, description }: ValuePropProps) {
  return (
    <div className="p-5 rounded-xl bg-nex-surface border border-nex-light transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 group">
      <div className="flex flex-col items-center gap-3 mb-3">
        <div className="p-3 rounded-lg bg-gold/5 group-hover:bg-gold/10 transition-colors" aria-hidden="true">
          <Icon className="h-6 w-6 text-gold" />
        </div>
        <h3 className="font-semibold text-white uppercase tracking-wide text-xs text-center">{title}</h3>
      </div>
      <p className="text-xs text-slate-dim leading-relaxed text-center">{description}</p>
    </div>
  );
}