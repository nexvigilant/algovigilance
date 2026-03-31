'use client';

// ============================================================================
// Markdown Citation Components
// Extracted from enhanced-markdown.tsx for modularity
// ============================================================================

import React, { useState, type ReactNode } from 'react';
import {
  hasCitations,
  parseTextWithCitations,
  lastCitationScrollPosition,
  setLastCitationScrollPosition,
} from './markdown-citation-utils';

// ============================================================================
// Citation Marker Component
// Interactive superscript citation with tooltip preview
// ============================================================================

interface CitationMarkerProps {
  citations: number[];
}

export function CitationMarker({ citations }: CitationMarkerProps) {
  const [hoveredCitation, setHoveredCitation] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipText, setTooltipText] = useState<string | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, num: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
    setHoveredCitation(num);

    // Try to find the reference text
    const mainContent = document.getElementById('main-content') || document.body;
    const refItems = mainContent.querySelectorAll('.reference-item');
    const refElement = refItems[num - 1];
    if (refElement) {
      const text = refElement.textContent || '';
      // Truncate long references
      setTooltipText(text.length > 200 ? text.slice(0, 200) + '...' : text);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCitation(null);
    setTooltipText(null);
  };

  const handleClick = (e: React.MouseEvent, num: number) => {
    e.preventDefault();
    setHoveredCitation(null);
    setTooltipText(null);
    // Store current scroll position before jumping
    setLastCitationScrollPosition(window.scrollY);

    // Scope search to the main content area to avoid React hydration duplicates
    const mainContent = document.getElementById('main-content') || document.body;
    const refItems = mainContent.querySelectorAll('.reference-item');
    const refElement = refItems[num - 1]; // 0-indexed, so ref 1 is at index 0
    if (refElement) {
      refElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight briefly
      refElement.classList.add('bg-cyan/20');
      setTimeout(() => refElement.classList.remove('bg-cyan/20'), 2000);
    }
  };

  return (
    <>
      <sup className="inline text-[0.75em] leading-none">
        {citations.map((num, idx) => (
          <a
            key={num}
            href={`#ref-${num}`}
            onClick={(e) => handleClick(e, num)}
            onMouseEnter={(e) => handleMouseEnter(e, num)}
            onMouseLeave={handleMouseLeave}
            className="text-cyan hover:text-cyan-glow font-semibold no-underline hover:underline cursor-pointer transition-colors relative"
            title={`See reference ${num}`}
          >
            [{num}]
            {idx < citations.length - 1 && <span className="text-slate-dim">,</span>}
          </a>
        ))}
      </sup>
      {/* Tooltip portal */}
      {hoveredCitation && tooltipText && (
        <div
          className="fixed z-[100] max-w-sm p-3 bg-nex-surface border border-cyan/30 rounded-lg shadow-xl text-xs text-slate-light leading-relaxed pointer-events-none"
          style={{
            left: `${Math.min(tooltipPosition.x, window.innerWidth - 320)}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold text-cyan mb-1">Reference {hoveredCitation}</div>
          {tooltipText}
          {/* Arrow */}
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-cyan/30" />
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Reference Back Link Component
// Button to return to citation position
// ============================================================================

export function ReferenceBackLink() {
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (lastCitationScrollPosition !== null) {
      window.scrollTo({ top: lastCitationScrollPosition, behavior: 'smooth' });
      setLastCitationScrollPosition(null); // Clear after use
    }
  };

  return (
    <button
      onClick={handleBackClick}
      className="ml-2 text-cyan/60 hover:text-cyan transition-colors text-sm"
      title="Back to citation"
      aria-label="Back to citation"
    >
      ↩
    </button>
  );
}

// ============================================================================
// Text With Citations Component
// Render text with inline citation markers
// ============================================================================

interface TextWithCitationsProps {
  text: string;
}

export function TextWithCitations({ text }: TextWithCitationsProps) {
  if (!hasCitations(text)) {
    return <>{text}</>;
  }

  const segments = parseTextWithCitations(text);

  return (
    <>
      {segments.map((segment, idx) => {
        if (segment.type === 'citation' && segment.citations) {
          return <CitationMarker key={idx} citations={segment.citations} />;
        }
        return <span key={idx}>{segment.content}</span>;
      })}
    </>
  );
}

// ============================================================================
// Process Citations in Children
// Recursively process React children to find and replace citation patterns
// ============================================================================

export function processCitationsInChildren(children: ReactNode): ReactNode {
  // Handle strings directly
  if (typeof children === 'string') {
    if (hasCitations(children)) {
      return <TextWithCitations text={children} />;
    }
    return children;
  }

  // Handle numbers
  if (typeof children === 'number') {
    return children;
  }

  // Handle null/undefined
  if (children === null || children === undefined) {
    return children;
  }

  // Handle arrays
  if (Array.isArray(children)) {
    return children.map((child, idx) => {
      const processed = processCitationsInChildren(child);
      return <span key={idx}>{processed}</span>;
    });
  }

  // Handle React elements - clone with processed children
  if (typeof children === 'object' && children !== null && 'type' in children && 'props' in children) {
    const element = children as React.ReactElement<Record<string, unknown>>;
    // Don't process citation markers themselves or links (they might be the reference links)
    if (element.type === CitationMarker || element.type === 'a') {
      return element;
    }
    // Recursively process element's children
    const elementProps = element.props as Record<string, unknown>;
    const processedChildren = processCitationsInChildren(elementProps.children as React.ReactNode);
    // Clone element with processed children
    return React.cloneElement(element, {}, processedChildren);
  }

  // Fallback - return as-is
  return children;
}
