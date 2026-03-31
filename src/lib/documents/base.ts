/**
 * AlgoVigilance Base Document Generator
 *
 * Abstract base class for all document generators.
 * Provides common functionality and enforces consistent structure.
 */

import { jsPDF } from 'jspdf';
import {
  getPageDimensions,
  drawStandardHeader,
  drawStandardFooter,
  drawTitleBlock,
  drawRecipientBlock,
  type DocumentMetadata,
  type PageDimensions,
  type HeaderOptions,
  type FooterOptions,
} from './layouts';

// =============================================================================
// Document Types
// =============================================================================

export type DocumentType =
  | 'assessment'
  | 'certificate'
  | 'proposal'
  | 'sow'
  | 'intelligence-brief'
  | 'report'
  | 'training-completion';

// =============================================================================
// Base Document Generator
// =============================================================================

export interface BaseDocumentOptions {
  metadata: DocumentMetadata;
  headerOptions?: HeaderOptions;
  footerOptions?: FooterOptions;
}

export abstract class BaseDocumentGenerator<TData> {
  protected doc: jsPDF;
  protected dims: PageDimensions;
  protected metadata: DocumentMetadata;
  protected headerOptions: HeaderOptions;
  protected footerOptions: FooterOptions;
  protected currentY: number = 0;

  constructor(options: BaseDocumentOptions) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    this.dims = getPageDimensions(this.doc);
    this.metadata = options.metadata;
    this.headerOptions = options.headerOptions || {};
    this.footerOptions = options.footerOptions || {};
  }

  /**
   * Generate the complete document
   */
  public generate(data: TData): jsPDF {
    // Draw first page header
    this.currentY = drawStandardHeader(this.doc, this.metadata, this.dims, this.headerOptions);

    // Draw title block
    this.currentY = drawTitleBlock(
      this.doc,
      this.metadata.title,
      this.getSubtitle(),
      this.currentY,
      this.dims
    );

    // Draw recipient if present
    if (this.metadata.recipient) {
      this.currentY = drawRecipientBlock(this.doc, this.metadata.recipient, this.currentY, this.dims);
    }

    // Generate document-specific content
    this.generateContent(data);

    // Add footers to all pages
    this.addFooters();

    return this.doc;
  }

  /**
   * Override in subclasses to provide document subtitle
   */
  protected getSubtitle(): string | undefined {
    return undefined;
  }

  /**
   * Override in subclasses to generate document-specific content
   */
  protected abstract generateContent(data: TData): void;

  /**
   * Add footers to all pages
   */
  protected addFooters(): void {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      drawStandardFooter(this.doc, this.dims, i, totalPages, this.footerOptions);
    }
  }

  /**
   * Check if we need a new page
   */
  protected needsNewPage(requiredSpace: number): boolean {
    const maxY = this.dims.pageHeight - this.dims.margin.bottom - 15;
    return this.currentY + requiredSpace > maxY;
  }

  /**
   * Add a new page and reset Y position
   */
  protected addPage(): void {
    this.doc.addPage();
    this.currentY = this.dims.margin.top;
  }

  /**
   * Get the generated PDF as various formats
   */
  public getBlob(): Blob {
    return this.doc.output('blob');
  }

  public getDataUri(): string {
    return this.doc.output('datauristring');
  }

  public getArrayBuffer(): ArrayBuffer {
    return this.doc.output('arraybuffer');
  }

  /**
   * Download the document
   */
  public download(filename: string): void {
    this.doc.save(filename);
  }
}

// =============================================================================
// Document Generation Utilities
// =============================================================================

/**
 * Generate a unique document number
 */
export function generateDocumentNumber(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * Format date for documents
 */
export function formatDocumentDate(date: Date, format: 'full' | 'short' | 'iso' = 'full'): string {
  switch (format) {
    case 'full':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'short':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'iso':
      return date.toISOString().split('T')[0];
  }
}

/**
 * Safe filename generator
 */
export function generateSafeFilename(base: string, extension: string = 'pdf'): string {
  const safe = base.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
  const date = new Date().toISOString().split('T')[0];
  return `AlgoVigilance-${safe}-${date}.${extension}`;
}
