/**
 * Document Parser Utility
 *
 * Parses various document formats (PDF, Word, Markdown, Text, Google Docs)
 * and extracts raw text content for AI processing.
 */

// Polyfill DOMMatrix for pdf-parse in Node.js environment
// pdf.js internally uses canvas APIs which aren't available server-side
if (typeof globalThis.DOMMatrix === 'undefined') {
  // Minimal DOMMatrix polyfill that pdf-parse needs
  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(init?: string | number[]) {
      if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        this.m11 = this.a;
        this.m12 = this.b;
        this.m21 = this.c;
        this.m22 = this.d;
        this.m41 = this.e;
        this.m42 = this.f;
      }
    }

    multiply() { return new DOMMatrixPolyfill(); }
    inverse() { return new DOMMatrixPolyfill(); }
    translate() { return new DOMMatrixPolyfill(); }
    scale() { return new DOMMatrixPolyfill(); }
    rotate() { return new DOMMatrixPolyfill(); }
    transformPoint(point: { x: number; y: number }) { return point; }
    toFloat32Array() { return new Float32Array(16); }
    toFloat64Array() { return new Float64Array(16); }
  }

  // @ts-expect-error - Polyfilling global
  globalThis.DOMMatrix = DOMMatrixPolyfill;
}

import { logger } from '@/lib/logger';

const log = logger.scope('document-parser');

export type DocumentType = 'pdf' | 'docx' | 'markdown' | 'text' | 'gdocs';

export interface ParsedDocument {
  text: string;
  type: DocumentType;
  filename?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    truncated?: boolean;
  };
}

export interface ParseOptions {
  maxLength?: number; // Max characters to extract (default: 50000)
}

const DEFAULT_MAX_LENGTH = 50000;

/**
 * Detect document type from file extension or MIME type
 */
export function detectDocumentType(
  filename?: string,
  mimeType?: string
): DocumentType | null {
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'docx':
      case 'doc':
        return 'docx';
      case 'md':
      case 'mdx':
        return 'markdown';
      case 'txt':
        return 'text';
    }
  }

  if (mimeType) {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'docx';
    if (mimeType === 'text/markdown') return 'markdown';
    if (mimeType.startsWith('text/')) return 'text';
  }

  return null;
}

/**
 * Parse PDF document and extract text
 */
async function parsePdf(
  buffer: Buffer,
  options: ParseOptions = {}
): Promise<ParsedDocument> {
  // pdf-parse has inconsistent exports between CJS and ESM
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = await import('pdf-parse') as any;
  const pdfParse = pdfParseModule.default ?? pdfParseModule;

  try {
    const data = await pdfParse(buffer);
    const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
    const truncated = data.text.length > maxLength;

    return {
      text: truncated ? data.text.slice(0, maxLength) : data.text,
      type: 'pdf',
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        truncated,
      },
    };
  } catch (error) {
    log.error('PDF parsing failed:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse Word document (.docx) and extract text
 */
async function parseDocx(
  buffer: Buffer,
  options: ParseOptions = {}
): Promise<ParsedDocument> {
  const mammoth = await import('mammoth');

  try {
    const result = await mammoth.extractRawText({ buffer });
    const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
    const truncated = result.value.length > maxLength;

    // Log any warnings
    if (result.messages.length > 0) {
      log.warn('DOCX parsing warnings:', result.messages);
    }

    return {
      text: truncated ? result.value.slice(0, maxLength) : result.value,
      type: 'docx',
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        truncated,
      },
    };
  } catch (error) {
    log.error('DOCX parsing failed:', error);
    throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse plain text or markdown
 */
function parseText(
  content: string,
  type: 'markdown' | 'text',
  options: ParseOptions = {}
): ParsedDocument {
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
  const truncated = content.length > maxLength;

  return {
    text: truncated ? content.slice(0, maxLength) : content,
    type,
    metadata: {
      wordCount: content.split(/\s+/).length,
      truncated,
    },
  };
}

/**
 * Fetch and parse Google Docs from public URL
 * Supports URLs like:
 * - https://docs.google.com/document/d/{docId}/edit
 * - https://docs.google.com/document/d/{docId}/pub
 */
async function parseGoogleDocs(
  url: string,
  options: ParseOptions = {}
): Promise<ParsedDocument> {
  try {
    // Extract document ID from URL
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Google Docs URL format');
    }

    const docId = match[1];

    // Fetch as plain text export
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(exportUrl);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Document not found. Ensure the document is publicly accessible.');
      }
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    const text = await response.text();
    const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
    const truncated = text.length > maxLength;

    return {
      text: truncated ? text.slice(0, maxLength) : text,
      type: 'gdocs',
      metadata: {
        wordCount: text.split(/\s+/).length,
        truncated,
      },
    };
  } catch (error) {
    log.error('Google Docs parsing failed:', error);
    throw new Error(
      `Failed to fetch Google Doc: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      'Ensure the document is shared as "Anyone with the link can view".'
    );
  }
}

/**
 * Check if URL is a Google Docs URL
 */
export function isGoogleDocsUrl(url: string): boolean {
  return url.includes('docs.google.com/document');
}

/**
 * Main parser function - parses any supported document type
 */
export async function parseDocument(
  input: {
    buffer?: Buffer;
    text?: string;
    url?: string;
    filename?: string;
    mimeType?: string;
  },
  options: ParseOptions = {}
): Promise<ParsedDocument> {
  // Handle Google Docs URL
  if (input.url && isGoogleDocsUrl(input.url)) {
    return parseGoogleDocs(input.url, options);
  }

  // Handle raw text input
  if (input.text && !input.buffer) {
    const type = detectDocumentType(input.filename) ?? 'text';
    if (type === 'markdown' || type === 'text') {
      return parseText(input.text, type, options);
    }
  }

  // Handle file buffer
  if (input.buffer) {
    const type = detectDocumentType(input.filename, input.mimeType);

    if (!type) {
      throw new Error('Unable to detect document type. Supported formats: PDF, DOCX, MD, TXT');
    }

    switch (type) {
      case 'pdf':
        return parsePdf(input.buffer, options);
      case 'docx':
        return parseDocx(input.buffer, options);
      case 'markdown':
      case 'text':
        return parseText(input.buffer.toString('utf-8'), type, options);
      default:
        throw new Error(`Unsupported document type: ${type}`);
    }
  }

  throw new Error('No valid input provided. Provide a buffer, text, or Google Docs URL.');
}

/**
 * Supported file extensions for upload validation
 */
export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.md', '.mdx', '.txt'];
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/markdown',
  'text/plain',
];

/**
 * Max file size (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
