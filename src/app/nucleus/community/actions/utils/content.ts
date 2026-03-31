'use server';

import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

/**
 * AlgoVigilance Content Processing Utilities
 * 
 * Performance-optimized HTML sanitization and Markdown conversion.
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export async function sanitizeHtml(html: string): Promise<string> {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize URL to prevent XSS attacks
 */
export async function sanitizeUrl(url: string): Promise<string> {
  const trimmed = url.trim().toLowerCase();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  
  if (dangerousProtocols.some(proto => trimmed.startsWith(proto))) {
    return '#';
  }

  try {
    const parsed = new URL(url, 'https://example.com');
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '#';
    }
    return url;
  } catch {
    return (url.startsWith('#') || url.startsWith('/')) ? url : '#';
  }
}

/**
 * Convert markdown to HTML with sanitization
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  marked.setOptions({ breaks: true, gfm: true });
  const rawHtml = marked.parse(markdown) as string;
  return await sanitizeHtml(rawHtml);
}
