'use client';

// ============================================================================
// Markdown Visual Box Components
// Extracted from enhanced-markdown.tsx for modularity
// ============================================================================

import { type ReactNode } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle2,
  Target,
  Quote,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CALLOUT_STYLES } from './markdown-pattern-utils';
import { type CalloutType } from './markdown-types';

// ============================================================================
// Callout Box Component
// ============================================================================

interface CalloutBoxProps {
  type: CalloutType;
  children: ReactNode;
}

const CALLOUT_ICONS: Record<CalloutType, typeof Lightbulb> = {
  tip: Lightbulb,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
  insight: Target,
};

export function CalloutBox({ type, children }: CalloutBoxProps) {
  const style = CALLOUT_STYLES[type];
  const Icon = CALLOUT_ICONS[type];

  return (
    <div className={cn('my-6 p-5 rounded-lg border-l-4', style.bg, style.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', style.iconColor)} />
        <div>
          <p className={cn('font-semibold text-sm mb-1', style.iconColor)}>
            {style.title}
          </p>
          <div className="text-slate-light text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Key Takeaway Box Component
// ============================================================================

interface KeyTakeawayBoxProps {
  children: ReactNode;
}

export function KeyTakeawayBox({ children }: KeyTakeawayBoxProps) {
  return (
    <div className="my-8 p-6 rounded-xl border bg-cyan/10 border-cyan/30">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-5 w-5 text-cyan" />
        <span className="font-semibold text-sm uppercase tracking-wide text-cyan">
          Key Takeaway
        </span>
      </div>
      <div className="text-slate-light leading-relaxed">{children}</div>
    </div>
  );
}

// ============================================================================
// Stat Highlight Component
// ============================================================================

interface StatHighlightProps {
  value: string;
  label?: string;
}

export function StatHighlight({ value, label }: StatHighlightProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5 px-2 py-0.5 rounded bg-cyan/10 border border-cyan/20">
      <span className="text-cyan font-semibold">{value}</span>
      {label && <span className="text-xs text-slate-dim">{label}</span>}
    </span>
  );
}

// ============================================================================
// Quick Facts Box Component
// ============================================================================

interface QuickFactsBoxProps {
  children: ReactNode;
}

export function QuickFactsBox({ children }: QuickFactsBoxProps) {
  return (
    <div className="my-8 p-6 rounded-xl bg-gradient-to-r from-cyan/5 to-transparent border border-cyan/20">
      <div className="flex items-center gap-2 mb-4 text-cyan">
        <Zap className="h-5 w-5" />
        <span className="font-semibold">Quick Facts</span>
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// Pull Quote Box Component
// ============================================================================

interface PullQuoteBoxProps {
  children: ReactNode;
}

export function PullQuoteBox({ children }: PullQuoteBoxProps) {
  return (
    <div className="my-10 relative">
      <Quote className="absolute -top-2 -left-2 h-8 w-8 text-cyan/20" />
      <blockquote className="pl-8 pr-4 text-xl font-medium text-white leading-relaxed">
        {children}
      </blockquote>
    </div>
  );
}
