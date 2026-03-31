'use client';

// ============================================================================
// Enhanced Markdown Component
// Main component that renders markdown with auto-visual detection
// ============================================================================

import { useRef, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, BarChart3 } from 'lucide-react';

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
// Enhanced Markdown Component
// ============================================================================

export function EnhancedMarkdown({ content, enableAutoVisuals = true }: EnhancedMarkdownProps) {
  // Track context for enhanced rendering using refs to persist across renders
  const inKeyTakeawaySectionRef = useRef(false);
  const inStatsSectionRef = useRef(false);
  const inReferencesSectionRef = useRef(false);
  // Use ref for counter to avoid StrictMode double-increment
  const referenceCounterRef = useRef(0);

  // Reset section tracking refs on each render
  inKeyTakeawaySectionRef.current = false;
  inStatsSectionRef.current = false;
  inReferencesSectionRef.current = false;

  // Custom components with auto-visual detection
  const components: Components = useMemo(() => ({
    h1: ({ children, ...props }) => (
      <h1 className="text-3xl font-headline text-white mt-12 mb-4" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => {
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
          referenceCounterRef.current = 0; // Reset counter for new references section
          inKeyTakeawaySectionRef.current = false;
          inStatsSectionRef.current = false;
        } else {
          inKeyTakeawaySectionRef.current = false;
          inStatsSectionRef.current = false;
          inReferencesSectionRef.current = false;
        }
      }

      // Special styling for References section
      if (isReferencesHeader(text)) {
        return (
          <h2 id={id} className="text-2xl font-headline text-white mt-12 mb-6 scroll-mt-24 flex items-center gap-3" {...props}>
            <span className="inline-block w-8 h-0.5 bg-cyan rounded"></span>
            {children}
          </h2>
        );
      }

      return (
        <h2 id={id} className="text-2xl font-headline text-white mt-10 mb-4 scroll-mt-24" {...props}>
          {children}
        </h2>
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
        <h3 id={id} className="text-xl font-semibold text-white mt-8 mb-3 scroll-mt-24" {...props}>
          {children}
        </h3>
      );
    },
    p: ({ children, ...props }) => {
      const text = String(children);

      // Detect and render pull quotes
      if (enableAutoVisuals && isPullQuote(text)) {
        // Remove surrounding quotes
        const cleanText = text.replace(/^[""]|[""]$/g, '').trim();
        return <PullQuoteBox>{cleanText}</PullQuoteBox>;
      }

      return (
        <p className="text-slate-light leading-relaxed mb-6" {...props}>
          {enableAutoVisuals ? processCitationsInChildren(children) : children}
        </p>
      );
    },
    ul: ({ children, ...props }) => {
      // Render stats section lists differently
      if (inStatsSectionRef.current && enableAutoVisuals) {
        return (
          <QuickFactsBox>
            <ul className="space-y-2" {...props}>
              {children}
            </ul>
          </QuickFactsBox>
        );
      }

      return (
        <ul className="list-disc list-inside text-slate-light mb-6 space-y-2" {...props}>
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
        <ol className="list-decimal list-inside text-slate-light mb-6 space-y-2" {...props}>
          {children}
        </ol>
      );
    },
    li: ({ children, node, ...props }) => {
      const text = String(children);

      // Detect stat patterns in list items
      if (enableAutoVisuals) {
        const stat = detectStatPattern(text);
        if (stat) {
          return (
            <li className="flex items-start gap-3 text-slate-light" {...props}>
              <CheckCircle2 className="h-4 w-4 text-cyan mt-1 flex-shrink-0" />
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
            <BarChart3 className="h-4 w-4 text-cyan mt-1 flex-shrink-0" />
            <span className="text-slate-light text-sm">{children}</span>
          </li>
        );
      }

      // Check if this is in a references section (ordered list after "References" heading)
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
          <li className="text-slate-light" {...props}>
            <TextWithCitations text={children} />
          </li>
        );
      }

      return (
        <li className="text-slate-light" {...props}>
          {children}
        </li>
      );
    },
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-cyan hover:text-cyan/80 underline underline-offset-2"
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
          className="border-l-4 border-cyan pl-6 italic text-slate-light my-8"
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
        className="bg-nex-surface p-4 rounded-lg overflow-x-auto mb-6 text-sm"
        {...props}
      >
        {children}
      </pre>
    ),
    hr: () => (
      <div className="my-12 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
    ),
    img: ({ src, alt, ...props }) => (
      <img
        src={src}
        alt={alt ?? ''}
        className="rounded-lg my-8 w-full"
        {...props}
      />
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-white" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-8 rounded-lg border border-nex-light">
        <table className="min-w-full divide-y divide-nex-light" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-white bg-nex-surface" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-3 text-sm text-slate-light border-t border-nex-light" {...props}>
        {children}
      </td>
    ),
  }), [enableAutoVisuals]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}

// Re-export original for backwards compatibility
export { MarkdownContent } from './markdown-content';
