'use client';

import { type ReactNode } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  Target,
  Zap,
  Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Key Takeaway Component - Highlighted box for important points
// ============================================================================

interface KeyTakeawayProps {
  children: ReactNode;
  title?: string;
  variant?: 'default' | 'success' | 'warning';
}

export function KeyTakeaway({
  children,
  title = 'Key Takeaway',
  variant = 'default'
}: KeyTakeawayProps) {
  const variants = {
    default: {
      bg: 'bg-cyan/10',
      border: 'border-cyan/30',
      icon: 'text-cyan',
      title: 'text-cyan',
    },
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: 'text-emerald-400',
      title: 'text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: 'text-amber-400',
      title: 'text-amber-400',
    },
  };

  const styles = variants[variant];

  return (
    <div className={cn(
      'my-8 p-6 rounded-xl border',
      styles.bg,
      styles.border
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className={cn('h-5 w-5', styles.icon)} />
        <span className={cn('font-semibold text-sm uppercase tracking-wide', styles.title)}>
          {title}
        </span>
      </div>
      <div className="text-slate-light leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Callout Component - Tips, warnings, notes with icons
// ============================================================================

type CalloutType = 'tip' | 'warning' | 'info' | 'success' | 'insight';

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutConfig: Record<CalloutType, {
  icon: typeof Lightbulb;
  defaultTitle: string;
  bg: string;
  border: string;
  iconColor: string;
}> = {
  tip: {
    icon: Lightbulb,
    defaultTitle: 'Pro Tip',
    bg: 'bg-cyan/10',
    border: 'border-cyan/30',
    iconColor: 'text-cyan',
  },
  warning: {
    icon: AlertTriangle,
    defaultTitle: 'Important',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  info: {
    icon: Info,
    defaultTitle: 'Note',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
  },
  success: {
    icon: CheckCircle2,
    defaultTitle: 'Success',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  insight: {
    icon: Target,
    defaultTitle: 'Industry Insight',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    iconColor: 'text-purple-400',
  },
};

export function Callout({ type, title, children }: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'my-6 p-5 rounded-lg border-l-4',
      config.bg,
      config.border
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconColor)} />
        <div>
          <p className={cn('font-semibold text-sm mb-1', config.iconColor)}>
            {title || config.defaultTitle}
          </p>
          <div className="text-slate-light text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Stat Card - Display a single statistic prominently
// ============================================================================

interface StatCardProps {
  value: string | number;
  label: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

export function StatCard({ value, label, description, trend, icon }: StatCardProps) {
  return (
    <div className="p-5 rounded-xl bg-nex-surface border border-nex-light">
      <div className="flex items-start justify-between mb-2">
        <div className="text-3xl font-bold text-white">
          {value}
        </div>
        {trend && (
          <TrendingUp className={cn(
            'h-5 w-5',
            trend === 'up' && 'text-emerald-400',
            trend === 'down' && 'text-red-400 rotate-180',
            trend === 'neutral' && 'text-slate-dim rotate-90'
          )} />
        )}
        {icon && !trend && (
          <div className="text-cyan">{icon}</div>
        )}
      </div>
      <p className="text-sm font-medium text-white mb-1">{label}</p>
      {description && (
        <p className="text-xs text-slate-dim">{description}</p>
      )}
    </div>
  );
}

// ============================================================================
// Stat Grid - Display multiple stats in a grid
// ============================================================================

interface StatGridProps {
  stats: Array<{
    value: string | number;
    label: string;
    description?: string;
  }>;
  columns?: 2 | 3 | 4;
}

export function StatGrid({ stats, columns = 3 }: StatGridProps) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4 my-8', colClass[columns])}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="p-5 rounded-xl bg-gradient-to-br from-nex-surface to-nex-dark border border-nex-light text-center"
        >
          <div className="text-3xl font-bold text-cyan mb-2">{stat.value}</div>
          <p className="text-sm font-medium text-white">{stat.label}</p>
          {stat.description && (
            <p className="text-xs text-slate-dim mt-1">{stat.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Quick Facts - Compact bullet list in styled box
// ============================================================================

interface QuickFactsProps {
  title?: string;
  facts: string[];
  icon?: ReactNode;
}

export function QuickFacts({
  title = 'Quick Facts',
  facts,
  icon = <Zap className="h-5 w-5" />
}: QuickFactsProps) {
  return (
    <div className="my-8 p-6 rounded-xl bg-gradient-to-r from-cyan/5 to-transparent border border-cyan/20">
      <div className="flex items-center gap-2 mb-4 text-cyan">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      <ul className="space-y-2">
        {facts.map((fact, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-cyan mt-1 flex-shrink-0" />
            <span className="text-slate-light text-sm">{fact}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Section Divider - Visual break between sections
// ============================================================================

interface SectionDividerProps {
  variant?: 'dots' | 'gradient' | 'icon';
  icon?: ReactNode;
}

export function SectionDivider({ variant = 'gradient', icon }: SectionDividerProps) {
  if (variant === 'dots') {
    return (
      <div className="flex justify-center gap-2 my-12">
        <div className="w-2 h-2 rounded-full bg-cyan/50" />
        <div className="w-2 h-2 rounded-full bg-cyan/30" />
        <div className="w-2 h-2 rounded-full bg-cyan/50" />
      </div>
    );
  }

  if (variant === 'icon' && icon) {
    return (
      <div className="flex items-center gap-4 my-12">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-nex-light" />
        <div className="text-cyan/50">{icon}</div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-nex-light" />
      </div>
    );
  }

  // Default gradient
  return (
    <div className="my-12 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
  );
}

// ============================================================================
// Pull Quote - Highlighted quote from the article
// ============================================================================

interface PullQuoteProps {
  children: ReactNode;
  author?: string;
}

export function PullQuote({ children, author }: PullQuoteProps) {
  return (
    <div className="my-10 relative">
      <Quote className="absolute -top-2 -left-2 h-8 w-8 text-cyan/20" />
      <blockquote className="pl-8 pr-4 text-xl font-medium text-white leading-relaxed">
        {children}
      </blockquote>
      {author && (
        <p className="pl-8 mt-3 text-sm text-slate-dim">— {author}</p>
      )}
    </div>
  );
}

// ============================================================================
// Reading Progress Indicator
// ============================================================================

interface ContentProgressProps {
  sections: string[];
  currentSection?: number;
}

export function ContentProgress({ sections, currentSection = 0 }: ContentProgressProps) {
  return (
    <div className="my-8 p-4 rounded-lg bg-nex-surface border border-nex-light">
      <p className="text-xs text-slate-dim uppercase tracking-wide mb-3">In This Article</p>
      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 text-sm',
              index === currentSection ? 'text-cyan' : 'text-slate-dim'
            )}
          >
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
              index < currentSection && 'bg-cyan/20 text-cyan',
              index === currentSection && 'bg-cyan text-nex-background',
              index > currentSection && 'bg-nex-light text-slate-dim'
            )}>
              {index < currentSection ? '✓' : index + 1}
            </div>
            <span>{section}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Comparison Table - Side by side comparison
// ============================================================================

interface ComparisonItem {
  feature: string;
  optionA: string | boolean;
  optionB: string | boolean;
}

interface ComparisonTableProps {
  optionALabel: string;
  optionBLabel: string;
  items: ComparisonItem[];
}

export function ComparisonTable({ optionALabel, optionBLabel, items }: ComparisonTableProps) {
  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-slate-dim mx-auto" />
      );
    }
    return <span className="text-slate-light">{value}</span>;
  };

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-nex-light">
      <table className="w-full">
        <thead>
          <tr className="bg-nex-surface">
            <th className="py-3 px-4 text-left text-sm font-medium text-slate-dim">Feature</th>
            <th className="py-3 px-4 text-center text-sm font-medium text-cyan">{optionALabel}</th>
            <th className="py-3 px-4 text-center text-sm font-medium text-purple-400">{optionBLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-nex-light">
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-nex-surface/50">
              <td className="py-3 px-4 text-sm text-white">{item.feature}</td>
              <td className="py-3 px-4 text-center text-sm">{renderValue(item.optionA)}</td>
              <td className="py-3 px-4 text-center text-sm">{renderValue(item.optionB)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Data Highlight - Emphasize a key data point inline
// ============================================================================

interface DataHighlightProps {
  value: string | number;
  label?: string;
}

export function DataHighlight({ value, label }: DataHighlightProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5 px-2 py-0.5 rounded bg-cyan/10 border border-cyan/20">
      <span className="text-cyan font-semibold">{value}</span>
      {label && <span className="text-xs text-slate-dim">{label}</span>}
    </span>
  );
}
