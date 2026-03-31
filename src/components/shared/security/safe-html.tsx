'use client';

/**
 * SafeHtml Component - Secure HTML Rendering with DOMPurify
 *
 * SECURITY DOCUMENTATION:
 * This component uses dangerouslySetInnerHTML INTENTIONALLY as part of
 * a defense-in-depth XSS prevention strategy. All content is sanitized
 * through DOMPurify BEFORE being passed to dangerouslySetInnerHTML.
 *
 * This provides render-time sanitization as an additional safety layer
 * on top of input-time sanitization, protecting against:
 * - Legacy data that wasn't sanitized on input
 * - Database corruption or manipulation
 * - Bugs in upstream sanitization
 *
 * @see https://github.com/cure53/DOMPurify
 */

import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';

/**
 * DOMPurify configuration for different content types
 */
const PURIFY_CONFIGS = {
  /**
   * Rich text content (posts, messages, comments)
   * Allows basic formatting but no dangerous elements
   */
  rich: {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br',
      'ul', 'ol', 'li', 'code', 'pre', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload', 'onmouseover'],
  },

  /**
   * Minimal content (usernames, short text)
   * Only allows basic inline formatting
   */
  minimal: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  },

  /**
   * Plain text only - strips all HTML
   */
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  },
} as const;

type ContentType = keyof typeof PURIFY_CONFIGS;

interface SafeHtmlProps {
  /** The potentially dangerous HTML content to sanitize and render */
  html: string;
  /** The type of content (determines sanitization strictness) */
  type?: ContentType;
  /** HTML element to render */
  as?: 'div' | 'span' | 'p' | 'article' | 'section';
  /** Additional CSS classes */
  className?: string;
}

/**
 * SafeHtml - Defense-in-depth HTML sanitization at render time
 *
 * @example
 * <SafeHtml html={post.contentHtml} type="rich" className="prose" />
 */
export function SafeHtml({
  html,
  type = 'rich',
  as: Component = 'div',
  className,
}: SafeHtmlProps) {
  // Memoize sanitization to avoid re-running on every render
  const sanitizedHtml = useMemo(() => {
    if (!html) return '';

    const config = PURIFY_CONFIGS[type];
    let clean = DOMPurify.sanitize(html, config as unknown as Parameters<typeof DOMPurify.sanitize>[1]) as string;

    // For rich content, ensure links have proper security attributes
    if (type === 'rich') {
      clean = clean.replace(
        /<a\s+([^>]*href=[^>]*)>/gi,
        '<a $1 target="_blank" rel="noopener noreferrer">'
      );
    }

    return clean;
  }, [html, type]);

  // SECURITY: Content is sanitized by DOMPurify above before rendering
   
  return (
    <Component
      className={cn(className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

export default SafeHtml;
