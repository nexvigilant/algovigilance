'use client';

// ============================================================================
// Enhanced Markdown Component V2
// Upgraded with premium visual treatments for better engagement
// ============================================================================

import { useRef, useMemo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CheckCircle2,
  BarChart3,
  ArrowRight,
  FileText,
  Zap,
  Target,
  AlertCircle,
  Lightbulb,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import utilities
import {
  detectCalloutType,
  stripCalloutEmoji,
  isKeyTakeawayHeader,
  isStatsHeader,
  isReferencesHeader,
  isPullQuote,
  detectStatPattern,
  generateHeadingId,
  detectNumberedHeader,
  isExecutiveSummaryHeader,
  isActionsHeader,
  isStrategicInsight,
  detectInsightVariant,
  isTimelineHeader,
  isComparisonHeader,
  isMetricsHeader,
  detectTimelinePattern,
  detectMetricBar,
  type InsightVariant,
} from './markdown-pattern-utils';

import { hasCitations } from './markdown-citation-utils';

// Import components
import {
  CalloutBox,
  KeyTakeawayBox,
  StatHighlight,
  QuickFactsBox,
  PullQuoteBox,
} from './markdown-visual-boxes';

import {
  MetricBar,
  type TimelineEvent,
} from './article-visual-enhancements';
import { GitCompare } from 'lucide-react';

import {
  TextWithCitations,
  ReferenceBackLink,
  processCitationsInChildren,
} from './markdown-citation-components';

// ============================================================================
// Types
// ============================================================================

interface EnhancedMarkdownProps {
  content: string;
  /** Enable auto-detection of visual elements (callouts, stats, quotes) */
  enableAutoVisuals?: boolean;
}

// ============================================================================
// Inline Visual Components
// ============================================================================

/** Numbered section header with badge */
function NumberedSectionHeader({
  number,
  title,
  id,
}: {
  number: string;
  title: string;
  id: string;
}) {
  return (
    <div id={id} className="relative my-10 -mx-2 scroll-mt-24">
      {/* Background gradient bar */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan/15 to-transparent rounded-lg" />

      <div className="relative flex items-center gap-4 p-4">
        {/* Number badge */}
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-cyan/20 to-cyan/5 border border-cyan/30 flex items-center justify-center">
          <span className="text-lg font-mono font-bold text-cyan">{number}</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-headline text-white uppercase tracking-wide">
          {title}
        </h2>
      </div>
    </div>
  );
}

/** Executive Summary styled box */
function ExecutiveSummaryHeader({ children, id }: { children: ReactNode; id: string }) {
  return (
    <div id={id} className="my-10 scroll-mt-24">
      <div className="px-6 py-4 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent border-b border-gold/20 rounded-t-xl">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-headline text-gold uppercase tracking-wide">
            {children}
          </h2>
        </div>
      </div>
    </div>
  );
}

/** Recommended Actions styled header */
function ActionsHeader({ children, id }: { children: ReactNode; id: string }) {
  return (
    <div id={id} className="mt-10 mb-4 scroll-mt-24">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Zap className="h-5 w-5 text-emerald-400" />
        </div>
        <h2 className="text-xl font-headline text-emerald-400 uppercase tracking-wide">
          {children}
        </h2>
      </div>
    </div>
  );
}

/** Insight highlight box for strategic content */
function InsightBox({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: InsightVariant;
}) {
  const variantStyles = {
    default: {
      bg: 'bg-gradient-to-r from-cyan/10 via-cyan/5 to-transparent',
      border: 'border-l-4 border-cyan',
      iconBg: 'bg-cyan/20',
      iconColor: 'text-cyan',
      Icon: Lightbulb,
      title: 'Critical Insight',
    },
    critical: {
      bg: 'bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent',
      border: 'border-l-4 border-red-500',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      Icon: AlertCircle,
      title: 'Critical Alert',
    },
    opportunity: {
      bg: 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent',
      border: 'border-l-4 border-emerald-500',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      Icon: Target,
      title: 'Market Opportunity',
    },
    strategic: {
      bg: 'bg-gradient-to-r from-gold/10 via-gold/5 to-transparent',
      border: 'border-l-4 border-gold',
      iconBg: 'bg-gold/20',
      iconColor: 'text-gold',
      Icon: Sparkles,
      title: 'Strategic Implication',
    },
  };

  const style = variantStyles[variant];
  const Icon = style.Icon;

  return (
    <div className={cn('my-8 p-5 rounded-r-xl', style.bg, style.border)}>
      <div className="flex items-start gap-4">
        <div className={cn('p-2 rounded-lg flex-shrink-0', style.iconBg, style.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={cn('font-semibold text-xs uppercase tracking-wide mb-2', style.iconColor)}>
            {style.title}
          </p>
          <div className="text-slate-light leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Enhanced Markdown Component V2
// ============================================================================

export function EnhancedMarkdownV2({ content, enableAutoVisuals = true }: EnhancedMarkdownProps) {
  // Track context for enhanced rendering using refs to persist across renders
  const inKeyTakeawaySectionRef = useRef(false);
  const inStatsSectionRef = useRef(false);
  const inReferencesSectionRef = useRef(false);
  const inActionsSectionRef = useRef(false);
  const inExecutiveSummarySectionRef = useRef(false);
  const inTimelineSectionRef = useRef(false);
  const inMetricsSectionRef = useRef(false);
  const inComparisonSectionRef = useRef(false);
  // Use ref for counter to avoid StrictMode double-increment
  const referenceCounterRef = useRef(0);
  // Collect timeline events and metrics for batch rendering
  const timelineEventsRef = useRef<TimelineEvent[]>([]);
  const metricsRef = useRef<Array<{ label: string; value: number; suffix: string }>>([]);
  const currentTimelineTitleRef = useRef<string>('');
  const currentMetricsTitleRef = useRef<string>('');

  // Reset section tracking refs on each render
  inKeyTakeawaySectionRef.current = false;
  inStatsSectionRef.current = false;
  inReferencesSectionRef.current = false;
  inActionsSectionRef.current = false;
  inExecutiveSummarySectionRef.current = false;
  inTimelineSectionRef.current = false;
  inMetricsSectionRef.current = false;
  inComparisonSectionRef.current = false;
  timelineEventsRef.current = [];
  metricsRef.current = [];
  currentTimelineTitleRef.current = '';
  currentMetricsTitleRef.current = '';

  // Custom components with auto-visual detection
  const components: Components = useMemo(
    () => ({
      h1: ({ children, ...props }) => (
        <h1 className="text-3xl font-headline text-white mt-12 mb-6" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => {
        const text = String(children);
        const id = generateHeadingId(text);

        // Check for special section headers and update section tracking
        if (enableAutoVisuals) {
          // Helper to reset all section flags
          const resetSections = () => {
            inKeyTakeawaySectionRef.current = false;
            inStatsSectionRef.current = false;
            inReferencesSectionRef.current = false;
            inActionsSectionRef.current = false;
            inExecutiveSummarySectionRef.current = false;
            inTimelineSectionRef.current = false;
            inMetricsSectionRef.current = false;
            inComparisonSectionRef.current = false;
          };

          if (isKeyTakeawayHeader(text)) {
            resetSections();
            inKeyTakeawaySectionRef.current = true;
          } else if (isStatsHeader(text)) {
            resetSections();
            inStatsSectionRef.current = true;
          } else if (isReferencesHeader(text)) {
            resetSections();
            inReferencesSectionRef.current = true;
            referenceCounterRef.current = 0;
          } else if (isActionsHeader(text)) {
            resetSections();
            inActionsSectionRef.current = true;
          } else if (isExecutiveSummaryHeader(text)) {
            resetSections();
            inExecutiveSummarySectionRef.current = true;
          } else if (isTimelineHeader(text)) {
            resetSections();
            inTimelineSectionRef.current = true;
            currentTimelineTitleRef.current = text;
            timelineEventsRef.current = [];
          } else if (isMetricsHeader(text)) {
            resetSections();
            inMetricsSectionRef.current = true;
            currentMetricsTitleRef.current = text;
            metricsRef.current = [];
          } else if (isComparisonHeader(text)) {
            resetSections();
            inComparisonSectionRef.current = true;
          } else {
            resetSections();
          }

          // Detect numbered section headers (e.g., "1. Digital Transformation")
          const numberedHeader = detectNumberedHeader(text);
          if (numberedHeader) {
            return (
              <NumberedSectionHeader
                number={numberedHeader.number}
                title={numberedHeader.title}
                id={id}
              />
            );
          }

          // Executive summary header styling
          if (isExecutiveSummaryHeader(text)) {
            return <ExecutiveSummaryHeader id={id}>{children}</ExecutiveSummaryHeader>;
          }

          // Recommended actions header styling
          if (isActionsHeader(text)) {
            return <ActionsHeader id={id}>{children}</ActionsHeader>;
          }

          // Timeline section header styling
          if (isTimelineHeader(text)) {
            return (
              <div id={id} className="mt-10 mb-4 scroll-mt-24">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-headline text-blue-400 uppercase tracking-wide">
                    {children}
                  </h2>
                </div>
              </div>
            );
          }

          // Metrics section header styling
          if (isMetricsHeader(text)) {
            return (
              <div id={id} className="mt-10 mb-4 scroll-mt-24">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-headline text-purple-400 uppercase tracking-wide">
                    {children}
                  </h2>
                </div>
              </div>
            );
          }

          // Comparison section header styling
          if (isComparisonHeader(text)) {
            return (
              <div id={id} className="mt-10 mb-4 scroll-mt-24">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan/20">
                    <GitCompare className="h-5 w-5 text-cyan" />
                  </div>
                  <h2 className="text-xl font-headline text-cyan uppercase tracking-wide">
                    {children}
                  </h2>
                </div>
              </div>
            );
          }
        }

        // Special styling for References section
        if (isReferencesHeader(text)) {
          return (
            <h2
              id={id}
              className="text-2xl font-headline text-white mt-14 mb-6 scroll-mt-24 flex items-center gap-3"
              {...props}
            >
              <span className="inline-block w-8 h-0.5 bg-cyan rounded"></span>
              {children}
            </h2>
          );
        }

        // Default H2 with visual separator
        return (
          <div className="mt-14 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-nex-light to-transparent mb-8" />
            <h2 id={id} className="text-2xl font-headline text-white scroll-mt-24" {...props}>
              {children}
            </h2>
          </div>
        );
      },
      h3: ({ children, ...props }) => {
        const text = String(children);
        const id = generateHeadingId(text);

        // Check for special section headers
        if (enableAutoVisuals) {
          if (isKeyTakeawayHeader(text)) {
            inKeyTakeawaySectionRef.current = true;
            inReferencesSectionRef.current = false;
          } else if (isStatsHeader(text)) {
            inStatsSectionRef.current = true;
            inReferencesSectionRef.current = false;
          } else if (isReferencesHeader(text)) {
            inReferencesSectionRef.current = true;
            referenceCounterRef.current = 0;
            inKeyTakeawaySectionRef.current = false;
            inStatsSectionRef.current = false;
          } else {
            // Don't reset references section for other h3s within it
            inKeyTakeawaySectionRef.current = false;
            inStatsSectionRef.current = false;
          }
        }

        return (
          <h3 id={id} className="text-xl font-semibold text-white mt-10 mb-4 scroll-mt-24" {...props}>
            {children}
          </h3>
        );
      },
      p: ({ children, ...props }) => {
        const text = String(children);

        // Detect and render pull quotes
        if (enableAutoVisuals && isPullQuote(text)) {
          const cleanText = text.replace(/^[""]|[""]$/g, '').trim();
          return <PullQuoteBox>{cleanText}</PullQuoteBox>;
        }

        // Detect strategic insight paragraphs (contain "Critical insight:" etc.)
        if (enableAutoVisuals && isStrategicInsight(text)) {
          const variant = detectInsightVariant(text);
          return <InsightBox variant={variant}>{children}</InsightBox>;
        }

        return (
          <p className="text-slate-light leading-relaxed mb-6 text-base" {...props}>
            {enableAutoVisuals ? processCitationsInChildren(children) : children}
          </p>
        );
      },
      ul: ({ children, ...props }) => {
        // Render stats section lists differently
        if (inStatsSectionRef.current && enableAutoVisuals) {
          return (
            <QuickFactsBox>
              <ul className="space-y-3" {...props}>
                {children}
              </ul>
            </QuickFactsBox>
          );
        }

        // Actions section with arrow icons
        if (inActionsSectionRef.current && enableAutoVisuals) {
          return (
            <div className="my-6 p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
              <ul className="space-y-3" {...props}>
                {children}
              </ul>
            </div>
          );
        }

        // Executive summary with numbered bullets
        if (inExecutiveSummarySectionRef.current && enableAutoVisuals) {
          return (
            <div className="p-6 bg-nex-surface/50 rounded-b-xl border-x border-b border-gold/10">
              <ul className="space-y-4" {...props}>
                {children}
              </ul>
            </div>
          );
        }

        // Timeline section with vertical line
        if (inTimelineSectionRef.current && enableAutoVisuals) {
          return (
            <div className="my-6 p-5 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20">
              <ul className="space-y-0" {...props}>
                {children}
              </ul>
            </div>
          );
        }

        // Metrics section with progress bars
        if (inMetricsSectionRef.current && enableAutoVisuals) {
          return (
            <div className="my-6 p-5 rounded-xl bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/20">
              <ul className="space-y-4" {...props}>
                {children}
              </ul>
            </div>
          );
        }

        return (
          <ul className="text-slate-light mb-6 space-y-3 ml-1" {...props}>
            {children}
          </ul>
        );
      },
      ol: ({ children, ...props }) => {
        // Reset reference counter when entering a new ordered list in references section
        if (inReferencesSectionRef.current) {
          referenceCounterRef.current = 0;
        }
        return (
          <ol className="list-decimal list-inside text-slate-light mb-6 space-y-3 ml-1" {...props}>
            {children}
          </ol>
        );
      },
      li: ({ children, node, ...props }) => {
        const text = String(children);

        // Action items with arrow icons
        if (inActionsSectionRef.current && enableAutoVisuals) {
          return (
            <li className="flex items-start gap-3" {...props}>
              <ArrowRight className="h-4 w-4 text-emerald-400 mt-1.5 flex-shrink-0" />
              <span className="text-slate-light">{children}</span>
            </li>
          );
        }

        // Executive summary numbered items
        if (inExecutiveSummarySectionRef.current && enableAutoVisuals) {
          return (
            <li className="flex items-start gap-3" {...props}>
              <CheckCircle2 className="h-4 w-4 text-gold mt-1.5 flex-shrink-0" />
              <span className="text-slate-light">{children}</span>
            </li>
          );
        }

        // Timeline items - detect "2024: Event" patterns
        if (inTimelineSectionRef.current && enableAutoVisuals) {
          const timelinePattern = detectTimelinePattern(text);
          if (timelinePattern) {
            return (
              <li className="relative pl-8 pb-6 border-l-2 border-blue-500/30 last:pb-0" {...props}>
                <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-mono text-blue-400">{timelinePattern.date}</span>
                  <span className="text-slate-light">{timelinePattern.event}</span>
                </div>
              </li>
            );
          }
          // Fallback for timeline items without date pattern
          return (
            <li className="relative pl-8 pb-6 border-l-2 border-blue-500/30 last:pb-0" {...props}>
              <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-blue-500/50" />
              <span className="text-slate-light">{children}</span>
            </li>
          );
        }

        // Metrics items - detect "Label: 85%" patterns
        if (inMetricsSectionRef.current && enableAutoVisuals) {
          const metricPattern = detectMetricBar(text);
          if (metricPattern) {
            return (
              <li className="py-2" {...props}>
                <MetricBar
                  label={metricPattern.label}
                  value={metricPattern.value}
                  suffix={metricPattern.suffix}
                  color="purple"
                />
              </li>
            );
          }
          // Fallback for metrics items without number pattern
          return (
            <li className="flex items-start gap-3" {...props}>
              <BarChart3 className="h-4 w-4 text-purple-400 mt-1.5 flex-shrink-0" />
              <span className="text-slate-light">{children}</span>
            </li>
          );
        }

        // Detect stat patterns in list items
        if (enableAutoVisuals) {
          const stat = detectStatPattern(text);
          if (stat) {
            return (
              <li className="flex items-start gap-3 text-slate-light" {...props}>
                <CheckCircle2 className="h-4 w-4 text-cyan mt-1.5 flex-shrink-0" />
                <span>
                  <StatHighlight value={stat.value} label="" />
                  <span className="ml-1">{stat.rest}</span>
                </span>
              </li>
            );
          }
        }

        if (inStatsSectionRef.current) {
          return (
            <li className="flex items-start gap-3" {...props}>
              <BarChart3 className="h-4 w-4 text-cyan mt-1.5 flex-shrink-0" />
              <span className="text-slate-light text-sm">{children}</span>
            </li>
          );
        }

        // Check if this is in a references section
        if (inReferencesSectionRef.current && enableAutoVisuals && node) {
          return (
            <li
              data-ref-item="true"
              className="text-slate-light text-sm py-2 pl-2 -ml-2 rounded transition-colors duration-300 reference-item flex items-start justify-between gap-2"
              {...props}
            >
              <span className="flex-1">{children}</span>
              <ReferenceBackLink />
            </li>
          );
        }

        // Process citations in list items
        if (enableAutoVisuals && typeof children === 'string' && hasCitations(children)) {
          return (
            <li className="text-slate-light flex items-start gap-3" {...props}>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan/60 mt-2.5 flex-shrink-0" />
              <span><TextWithCitations text={children} /></span>
            </li>
          );
        }

        // Default list item with styled bullet
        return (
          <li className="text-slate-light flex items-start gap-3" {...props}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan/60 mt-2.5 flex-shrink-0" />
            <span>{children}</span>
          </li>
        );
      },
      a: ({ children, href, ...props }) => (
        <a
          href={href}
          className="text-cyan hover:text-cyan/80 underline underline-offset-2 decoration-cyan/40"
          {...props}
        >
          {children}
        </a>
      ),
      blockquote: ({ children, ...props }) => {
        // Check for callout patterns
        if (enableAutoVisuals && children) {
          const text = String(children);
          const calloutType = detectCalloutType(text);

          if (calloutType) {
            const cleanText = stripCalloutEmoji(text);
            return <CalloutBox type={calloutType}>{cleanText}</CalloutBox>;
          }

          // Check if it's a key takeaway blockquote
          if (isKeyTakeawayHeader(text.slice(0, 50))) {
            return <KeyTakeawayBox>{children}</KeyTakeawayBox>;
          }
        }

        return (
          <blockquote
            className="border-l-4 border-cyan pl-6 italic text-slate-light my-8 text-lg"
            {...props}
          >
            {children}
          </blockquote>
        );
      },
      code: ({ children, className, ...props }) => {
        const isInline = !className;
        if (isInline) {
          return (
            <code className="bg-nex-surface px-1.5 py-0.5 rounded text-sm text-cyan" {...props}>
              {children}
            </code>
          );
        }
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      pre: ({ children, ...props }) => (
        <pre
          className="bg-nex-surface p-4 rounded-lg overflow-x-auto mb-6 text-sm border border-nex-light"
          {...props}
        >
          {children}
        </pre>
      ),
      hr: () => (
        <div className="my-14 flex items-center justify-center gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan/30" />
          <span className="w-2 h-2 rounded-full bg-cyan/50" />
          <span className="w-2 h-2 rounded-full bg-cyan/30" />
        </div>
      ),
      img: ({ src, alt, ...props }) => (
        <figure className="my-10">
          <img
            src={src}
            alt={alt ?? ''}
            className="rounded-xl w-full border border-nex-light"
            {...props}
          />
          {alt && (
            <figcaption className="text-sm text-slate-dim text-center mt-3 italic">
              {alt}
            </figcaption>
          )}
        </figure>
      ),
      strong: ({ children, ...props }) => (
        <strong className="font-semibold text-white" {...props}>
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em className="italic text-slate-light" {...props}>
          {children}
        </em>
      ),
      table: ({ children, ...props }) => {
        // Comparison section gets special cyan-themed styling
        if (inComparisonSectionRef.current && enableAutoVisuals) {
          return (
            <div className="overflow-x-auto my-6 rounded-xl border border-cyan/30 bg-gradient-to-br from-cyan/5 to-transparent">
              <table className="min-w-full divide-y divide-cyan/20" {...props}>
                {children}
              </table>
            </div>
          );
        }
        return (
          <div className="overflow-x-auto my-10 rounded-xl border border-nex-light">
            <table className="min-w-full divide-y divide-nex-light" {...props}>
              {children}
            </table>
          </div>
        );
      },
      th: ({ children, ...props }) => {
        // Comparison tables get cyan styling
        if (inComparisonSectionRef.current && enableAutoVisuals) {
          return (
            <th
              className="px-4 py-3 text-left text-sm font-semibold text-cyan bg-nex-surface/80"
              {...props}
            >
              {children}
            </th>
          );
        }
        return (
          <th
            className="px-4 py-3 text-left text-sm font-semibold text-white bg-nex-surface"
            {...props}
          >
            {children}
          </th>
        );
      },
      td: ({ children, ...props }) => {
        // Comparison tables get subtle cyan accent
        if (inComparisonSectionRef.current && enableAutoVisuals) {
          return (
            <td className="px-4 py-3 text-sm text-slate-light border-t border-cyan/20" {...props}>
              {children}
            </td>
          );
        }
        return (
          <td className="px-4 py-3 text-sm text-slate-light border-t border-nex-light" {...props}>
            {children}
          </td>
        );
      },
    }),
    [enableAutoVisuals]
  );

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}

// Export as default EnhancedMarkdown for use
export { EnhancedMarkdownV2 as EnhancedMarkdown };

// Re-export original for backwards compatibility
export { MarkdownContent } from './markdown-content';
