'use client';

/**
 * Article Visual Enhancement Components
 *
 * Provides premium visual treatments for intelligence articles
 * to increase engagement and readability.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  AlertCircle,
  Target,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Sparkles,
  BarChart3,
  Globe,
  Users,
  Building2,
  Cpu,
  Shield,
  GraduationCap,
  FileText,
  Zap,
  Calendar,
  Check,
  X,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Clock,
  Table2,
} from 'lucide-react';

// ============================================================================
// Section Header with Number Badge
// ============================================================================

interface NumberedSectionHeaderProps {
  number: number | string;
  title: string;
  subtitle?: string;
  accentColor?: 'cyan' | 'gold' | 'emerald' | 'purple';
}

export function NumberedSectionHeader({
  number,
  title,
  subtitle,
  accentColor = 'cyan',
}: NumberedSectionHeaderProps) {
  const colorStyles = {
    cyan: 'from-cyan/20 to-cyan/5 border-cyan/30 text-cyan',
    gold: 'from-gold/20 to-gold/5 border-gold/30 text-gold',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
  };

  return (
    <div className="relative my-10 -mx-2">
      {/* Background gradient bar */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-r rounded-lg opacity-50',
        colorStyles[accentColor].split(' ').slice(0, 2).join(' ')
      )} />

      <div className="relative flex items-center gap-4 p-4">
        {/* Number badge */}
        <div className={cn(
          'flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
          colorStyles[accentColor].split(' ').slice(0, 2).join(' '),
          'border',
          colorStyles[accentColor].split(' ')[2]
        )}>
          <span className={cn(
            'text-xl font-mono font-bold',
            colorStyles[accentColor].split(' ')[3]
          )}>
            {number}
          </span>
        </div>

        {/* Title content */}
        <div>
          <h2 className="text-2xl font-headline text-white uppercase tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-dim mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Data Point Card
// ============================================================================

interface DataPointCardProps {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  source?: string;
  icon?: ReactNode;
}

export function DataPointCard({
  value,
  label,
  trend,
  source,
  icon,
}: DataPointCardProps) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-nex-surface to-nex-deep border border-nex-light/50 hover:border-cyan/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-cyan">{value}</span>
            {trend && (
              <TrendingUp
                className={cn(
                  'h-4 w-4',
                  trend === 'up' && 'text-emerald-400',
                  trend === 'down' && 'text-red-400 rotate-180',
                  trend === 'neutral' && 'text-slate-dim rotate-90'
                )}
              />
            )}
          </div>
          <p className="text-sm text-slate-light mt-1">{label}</p>
          {source && (
            <p className="text-xs text-slate-dim mt-2 italic">Source: {source}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-cyan/10 text-cyan">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Stats Grid
// ============================================================================

interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ children, columns = 3 }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4 my-8', gridCols[columns])}>
      {children}
    </div>
  );
}

// ============================================================================
// Insight Highlight Box
// ============================================================================

interface InsightHighlightProps {
  title?: string;
  children: ReactNode;
  variant?: 'default' | 'critical' | 'opportunity' | 'strategic';
  icon?: ReactNode;
}

export function InsightHighlight({
  title,
  children,
  variant = 'default',
  icon,
}: InsightHighlightProps) {
  const variantStyles = {
    default: {
      bg: 'bg-gradient-to-r from-cyan/10 via-cyan/5 to-transparent',
      border: 'border-l-4 border-cyan',
      iconBg: 'bg-cyan/20',
      iconColor: 'text-cyan',
      titleColor: 'text-cyan',
      defaultIcon: <Lightbulb className="h-5 w-5" />,
      defaultTitle: 'Critical Insight',
    },
    critical: {
      bg: 'bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent',
      border: 'border-l-4 border-red-500',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      titleColor: 'text-red-400',
      defaultIcon: <AlertCircle className="h-5 w-5" />,
      defaultTitle: 'Critical Alert',
    },
    opportunity: {
      bg: 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent',
      border: 'border-l-4 border-emerald-500',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      titleColor: 'text-emerald-400',
      defaultIcon: <Target className="h-5 w-5" />,
      defaultTitle: 'Market Opportunity',
    },
    strategic: {
      bg: 'bg-gradient-to-r from-gold/10 via-gold/5 to-transparent',
      border: 'border-l-4 border-gold',
      iconBg: 'bg-gold/20',
      iconColor: 'text-gold',
      titleColor: 'text-gold',
      defaultIcon: <Sparkles className="h-5 w-5" />,
      defaultTitle: 'Strategic Implication',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className={cn('my-8 p-6 rounded-r-xl', style.bg, style.border)}>
      <div className="flex items-start gap-4">
        <div className={cn('p-2.5 rounded-lg flex-shrink-0', style.iconBg, style.iconColor)}>
          {icon || style.defaultIcon}
        </div>
        <div>
          <p className={cn('font-semibold text-sm uppercase tracking-wide mb-2', style.titleColor)}>
            {title || style.defaultTitle}
          </p>
          <div className="text-slate-light leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Executive Summary Box
// ============================================================================

interface ExecutiveSummaryProps {
  points: string[];
  title?: string;
}

export function ExecutiveSummaryBox({ points, title = 'Executive Summary' }: ExecutiveSummaryProps) {
  return (
    <div className="my-10 rounded-2xl overflow-hidden border border-gold/20">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent border-b border-gold/20">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gold" />
          <h3 className="text-lg font-headline text-gold uppercase tracking-wide">
            {title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 bg-nex-surface/50 space-y-4">
        {points.map((point, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-gold">{idx + 1}</span>
            </span>
            <p className="text-slate-light leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Topic Pills / Tags Section
// ============================================================================

interface TopicPillsProps {
  topics: Array<{
    label: string;
    icon?: ReactNode;
    color?: 'cyan' | 'gold' | 'emerald' | 'purple' | 'blue';
  }>;
}

export function TopicPills({ topics }: TopicPillsProps) {
  const colorStyles = {
    cyan: 'bg-cyan/10 text-cyan border-cyan/30',
    gold: 'bg-gold/10 text-gold border-gold/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const defaultIcons: Record<string, ReactNode> = {
    'AI': <Cpu className="h-3.5 w-3.5" />,
    'ML': <Cpu className="h-3.5 w-3.5" />,
    'Global': <Globe className="h-3.5 w-3.5" />,
    'Training': <GraduationCap className="h-3.5 w-3.5" />,
    'Regulatory': <Shield className="h-3.5 w-3.5" />,
    'Data': <BarChart3 className="h-3.5 w-3.5" />,
    'Industry': <Building2 className="h-3.5 w-3.5" />,
    'Teams': <Users className="h-3.5 w-3.5" />,
  };

  return (
    <div className="flex flex-wrap gap-2 my-6">
      {topics.map((topic, idx) => {
        const matchingIcon = Object.entries(defaultIcons).find(([key]) =>
          topic.label.toLowerCase().includes(key.toLowerCase())
        );

        return (
          <span
            key={idx}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
              colorStyles[topic.color || 'cyan']
            )}
          >
            {topic.icon || (matchingIcon && matchingIcon[1])}
            {topic.label}
          </span>
        );
      })}
    </div>
  );
}

// ============================================================================
// Action Items Box
// ============================================================================

interface ActionItemsBoxProps {
  items: string[];
  title?: string;
}

export function ActionItemsBox({ items, title = 'Recommended Actions' }: ActionItemsBoxProps) {
  return (
    <div className="my-8 p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-emerald-400" />
        <h4 className="font-semibold text-emerald-400 uppercase tracking-wide text-sm">
          {title}
        </h4>
      </div>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <ArrowRight className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
            <span className="text-slate-light">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// Content Divider
// ============================================================================

interface ContentDividerProps {
  variant?: 'dots' | 'line' | 'gradient' | 'wave';
}

export function ContentDivider({ variant = 'gradient' }: ContentDividerProps) {
  if (variant === 'dots') {
    return (
      <div className="my-12 flex items-center justify-center gap-3">
        <span className="w-2 h-2 rounded-full bg-cyan/40" />
        <span className="w-2 h-2 rounded-full bg-cyan/60" />
        <span className="w-2 h-2 rounded-full bg-cyan/40" />
      </div>
    );
  }

  if (variant === 'line') {
    return (
      <div className="my-12 flex items-center gap-4">
        <div className="flex-1 h-px bg-nex-light" />
        <BookOpen className="h-5 w-5 text-slate-dim" />
        <div className="flex-1 h-px bg-nex-light" />
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className="my-12 h-8 relative">
        <svg
          viewBox="0 0 400 20"
          className="w-full h-full text-cyan/20"
          preserveAspectRatio="none"
        >
          <path
            d="M0 10 Q50 0 100 10 T200 10 T300 10 T400 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </div>
    );
  }

  // Default: gradient
  return (
    <div className="my-12 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
  );
}

// ============================================================================
// Abstract/TLDR Box
// ============================================================================

interface AbstractBoxProps {
  children: ReactNode;
  readTime?: string;
}

export function AbstractBox({ children, readTime }: AbstractBoxProps) {
  return (
    <div className="my-8 p-6 rounded-xl bg-nex-surface/80 border border-nex-light backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-cyan">
          <BookOpen className="h-4 w-4" />
          <span className="text-xs font-mono uppercase tracking-wider">TL;DR</span>
        </div>
        {readTime && (
          <span className="text-xs text-slate-dim">{readTime} read</span>
        )}
      </div>
      <div className="text-slate-light leading-relaxed italic">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// Quote Attribution
// ============================================================================

interface QuoteAttributionProps {
  quote: string;
  author: string;
  role?: string;
  org?: string;
}

export function QuoteAttribution({ quote, author, role, org }: QuoteAttributionProps) {
  return (
    <figure className="my-10 relative">
      {/* Large quote mark */}
      <div className="absolute -top-4 -left-2 text-7xl font-serif text-cyan/10 select-none">
        "
      </div>

      <blockquote className="pl-8 pr-4">
        <p className="text-xl text-white leading-relaxed font-medium">
          {quote}
        </p>
      </blockquote>

      <figcaption className="mt-4 pl-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-teal-500 flex items-center justify-center text-white font-bold text-sm">
          {author.charAt(0)}
        </div>
        <div>
          <p className="text-white font-medium">{author}</p>
          {(role || org) && (
            <p className="text-sm text-slate-dim">
              {role}{role && org && ' · '}{org}
            </p>
          )}
        </div>
      </figcaption>
    </figure>
  );
}

// ============================================================================
// Enhanced Data Table
// ============================================================================

export interface TableColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  highlight?: boolean;
  format?: 'text' | 'number' | 'percent' | 'currency' | 'trend';
}

export interface TableRow {
  [key: string]: string | number | boolean | null;
}

interface EnhancedDataTableProps {
  columns: TableColumn[];
  data: TableRow[];
  title?: string;
  caption?: string;
  striped?: boolean;
  compact?: boolean;
  highlightFirst?: boolean;
}

export function EnhancedDataTable({
  columns,
  data,
  title,
  caption,
  striped = true,
  compact = false,
  highlightFirst = false,
}: EnhancedDataTableProps) {
  const formatValue = (value: string | number | boolean | null, format?: string) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-4 w-4 text-emerald-400 mx-auto" />
      ) : (
        <X className="h-4 w-4 text-red-400 mx-auto" />
      );
    }
    if (format === 'percent' && typeof value === 'number') {
      return `${value}%`;
    }
    if (format === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
    }
    if (format === 'trend' && typeof value === 'number') {
      const isPositive = value > 0;
      const Icon = isPositive ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
      return (
        <span className={cn(
          'inline-flex items-center gap-1',
          isPositive ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-dim'
        )}>
          <Icon className="h-3.5 w-3.5" />
          {Math.abs(value)}%
        </span>
      );
    }
    return String(value);
  };

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-nex-light/50">
      {title && (
        <div className="px-4 py-3 bg-nex-surface border-b border-nex-light/50 flex items-center gap-2">
          <Table2 className="h-4 w-4 text-cyan" />
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-nex-surface/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-xs font-mono uppercase tracking-wide text-slate-dim border-b border-nex-light/50',
                    compact ? 'px-3 py-2' : 'px-4 py-3',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.highlight && 'text-cyan'
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={cn(
                  'transition-colors hover:bg-cyan/5',
                  striped && rowIdx % 2 === 1 && 'bg-nex-surface/30',
                  highlightFirst && rowIdx === 0 && 'bg-gold/5 border-l-2 border-gold'
                )}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key}
                    className={cn(
                      'text-sm text-slate-light border-b border-nex-light/30',
                      compact ? 'px-3 py-2' : 'px-4 py-3',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.highlight && 'text-white font-medium',
                      colIdx === 0 && 'font-medium text-white'
                    )}
                  >
                    {formatValue(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <div className="px-4 py-2 bg-nex-surface/50 border-t border-nex-light/30">
          <p className="text-xs text-slate-dim italic">{caption}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Timeline Visualization
// ============================================================================

export interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  type?: 'milestone' | 'update' | 'alert' | 'success' | 'default';
  link?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  title?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function Timeline({
  events,
  title,
  orientation = 'vertical',
}: TimelineProps) {
  const typeStyles = {
    milestone: {
      bg: 'bg-gold/20',
      border: 'border-gold',
      dot: 'bg-gold',
      icon: <Sparkles className="h-3 w-3" />,
    },
    update: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500',
      dot: 'bg-blue-500',
      icon: <Clock className="h-3 w-3" />,
    },
    alert: {
      bg: 'bg-red-500/20',
      border: 'border-red-500',
      dot: 'bg-red-500',
      icon: <AlertCircle className="h-3 w-3" />,
    },
    success: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500',
      dot: 'bg-emerald-500',
      icon: <Check className="h-3 w-3" />,
    },
    default: {
      bg: 'bg-cyan/20',
      border: 'border-cyan',
      dot: 'bg-cyan',
      icon: <ChevronRight className="h-3 w-3" />,
    },
  };

  if (orientation === 'horizontal') {
    return (
      <div className="my-8">
        {title && (
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-cyan" />
            <h4 className="font-semibold text-white">{title}</h4>
          </div>
        )}
        <div className="relative">
          {/* Horizontal line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-nex-light" />

          <div className="flex justify-between overflow-x-auto pb-4 gap-4">
            {events.map((event, idx) => {
              const style = typeStyles[event.type || 'default'];
              return (
                <div key={idx} className="flex-shrink-0 relative pt-8 min-w-[140px]">
                  {/* Dot */}
                  <div className={cn(
                    'absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center text-white',
                    style.dot,
                    style.border
                  )}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <p className="text-xs font-mono text-slate-dim mb-1">{event.date}</p>
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-slate-dim mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Vertical timeline (default)
  return (
    <div className="my-8">
      {title && (
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-cyan" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
      )}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-nex-light" />

        <div className="space-y-6">
          {events.map((event, idx) => {
            const style = typeStyles[event.type || 'default'];
            return (
              <div key={idx} className="relative">
                {/* Dot */}
                <div className={cn(
                  'absolute -left-5 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center text-white',
                  style.dot,
                  style.border
                )}>
                  {style.icon}
                </div>

                {/* Content */}
                <div className={cn(
                  'p-4 rounded-lg border',
                  style.bg,
                  style.border
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-dim">{event.date}</span>
                    {event.type && event.type !== 'default' && (
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full capitalize',
                        style.bg,
                        event.type === 'milestone' && 'text-gold',
                        event.type === 'update' && 'text-blue-400',
                        event.type === 'alert' && 'text-red-400',
                        event.type === 'success' && 'text-emerald-400'
                      )}>
                        {event.type}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-white">{event.title}</p>
                  {event.description && (
                    <p className="text-sm text-slate-light mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Comparison Chart
// ============================================================================

export interface ComparisonItem {
  name: string;
  values: Record<string, string | number | boolean | null>;
  highlight?: boolean;
}

interface ComparisonChartProps {
  items: ComparisonItem[];
  features: string[];
  title?: string;
  showCheckmarks?: boolean;
}

export function ComparisonChart({
  items,
  features,
  title,
  showCheckmarks = true,
}: ComparisonChartProps) {
  const renderValue = (value: string | number | boolean | null) => {
    if (value === null || value === undefined) return <Minus className="h-4 w-4 text-slate-dim mx-auto" />;
    if (typeof value === 'boolean') {
      return showCheckmarks ? (
        value ? (
          <Check className="h-5 w-5 text-emerald-400 mx-auto" />
        ) : (
          <X className="h-5 w-5 text-red-400/60 mx-auto" />
        )
      ) : (
        <span className={value ? 'text-emerald-400' : 'text-red-400'}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    return <span className="text-white">{String(value)}</span>;
  };

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-nex-light/50">
      {title && (
        <div className="px-4 py-3 bg-nex-surface border-b border-nex-light/50">
          <h4 className="text-sm font-medium text-white">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-nex-surface/80">
              <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wide text-slate-dim border-b border-nex-light/50">
                Feature
              </th>
              {items.map((item, idx) => (
                <th
                  key={idx}
                  className={cn(
                    'px-4 py-3 text-center text-xs font-mono uppercase tracking-wide border-b border-nex-light/50',
                    item.highlight ? 'text-cyan bg-cyan/5' : 'text-slate-dim'
                  )}
                >
                  {item.highlight && (
                    <span className="block text-[10px] text-cyan mb-1">★ Recommended</span>
                  )}
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, rowIdx) => (
              <tr
                key={feature}
                className={cn(
                  'transition-colors hover:bg-cyan/5',
                  rowIdx % 2 === 1 && 'bg-nex-surface/30'
                )}
              >
                <td className="px-4 py-3 text-sm font-medium text-white border-b border-nex-light/30">
                  {feature}
                </td>
                {items.map((item, colIdx) => (
                  <td
                    key={colIdx}
                    className={cn(
                      'px-4 py-3 text-sm text-center border-b border-nex-light/30',
                      item.highlight && 'bg-cyan/5'
                    )}
                  >
                    {renderValue(item.values[feature])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Progress Bar / Metric Bar
// ============================================================================

interface MetricBarProps {
  label: string;
  value: number;
  max?: number;
  color?: 'cyan' | 'gold' | 'emerald' | 'purple' | 'red';
  showValue?: boolean;
  suffix?: string;
}

export function MetricBar({
  label,
  value,
  max = 100,
  color = 'cyan',
  showValue = true,
  suffix = '%',
}: MetricBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorStyles = {
    cyan: 'bg-cyan',
    gold: 'bg-gold',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-light">{label}</span>
        {showValue && (
          <span className="font-mono text-white">
            {value}{suffix}
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-nex-light overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Metrics Grid (for multiple bars)
// ============================================================================

interface MetricsGridProps {
  metrics: Array<{
    label: string;
    value: number;
    max?: number;
    color?: 'cyan' | 'gold' | 'emerald' | 'purple' | 'red';
    suffix?: string;
  }>;
  title?: string;
  columns?: 1 | 2;
}

export function MetricsGrid({ metrics, title, columns = 1 }: MetricsGridProps) {
  return (
    <div className="my-8 p-6 rounded-xl bg-nex-surface/50 border border-nex-light/50">
      {title && (
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-cyan" />
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
      )}
      <div className={cn(
        'space-y-4',
        columns === 2 && 'grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0'
      )}>
        {metrics.map((metric, idx) => (
          <MetricBar
            key={idx}
            label={metric.label}
            value={metric.value}
            max={metric.max}
            color={metric.color}
            suffix={metric.suffix}
          />
        ))}
      </div>
    </div>
  );
}
