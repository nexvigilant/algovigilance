/**
 * Intelligence Document Extraction API
 *
 * Handles document upload/paste and AI-powered content extraction
 * for the Intelligence admin form.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  parseDocument,
  isGoogleDocsUrl,
  MAX_FILE_SIZE,
  SUPPORTED_MIME_TYPES,
} from '@/lib/document-parser';
import { runContentExtraction } from '@/lib/ai/flows/extract-intelligence-content';
import { logger } from '@/lib/logger';

const log = logger.scope('api/intelligence/extract');

interface ExtractRequestBody {
  text?: string;
  url?: string;
  filename?: string;
}

/**
 * POST /api/intelligence/extract
 *
 * Accepts either:
 * - Multipart form data with a file upload
 * - JSON body with text content or Google Docs URL
 *
 * Returns extracted intelligence content.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const contentType = request.headers.get('content-type') || '';

    let documentText: string;
    let documentType: 'pdf' | 'docx' | 'markdown' | 'text' | 'gdocs';
    let filename: string | undefined;

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // Validate file type
      if (!SUPPORTED_MIME_TYPES.includes(file.type) && file.type !== '') {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}. Supported: PDF, DOCX, MD, TXT` },
          { status: 400 }
        );
      }

      filename = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      log.info('Processing uploaded file:', { filename, size: file.size, type: file.type });

      // Parse document
      const parsed = await parseDocument({
        buffer,
        filename,
        mimeType: file.type,
      });

      documentText = parsed.text;
      documentType = parsed.type;

      log.info('Document parsed:', {
        type: documentType,
        wordCount: parsed.metadata?.wordCount,
        truncated: parsed.metadata?.truncated,
      });
    }
    // Handle JSON body (text paste or URL)
    else if (contentType.includes('application/json')) {
      const body = (await request.json()) as ExtractRequestBody;

      // Handle Google Docs URL
      if (body.url && isGoogleDocsUrl(body.url)) {
        log.info('Processing Google Docs URL:', { url: body.url });

        const parsed = await parseDocument({ url: body.url });
        documentText = parsed.text;
        documentType = 'gdocs';
        filename = body.filename;
      }
      // Handle raw text input
      else if (body.text) {
        if (body.text.length < 10) {
          return NextResponse.json(
            { error: 'Text content is too short (minimum 10 characters)' },
            { status: 400 }
          );
        }

        log.info('Processing text input:', { length: body.text.length });

        const parsed = await parseDocument({
          text: body.text,
          filename: body.filename,
        });

        documentText = parsed.text;
        documentType = parsed.type;
        filename = body.filename;
      } else {
        return NextResponse.json(
          { error: 'No text or Google Docs URL provided' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Use multipart/form-data for file uploads or application/json for text/URL' },
        { status: 400 }
      );
    }

    // Extract content using AI
    log.info('Starting AI extraction...');
    const extractionResult = await runContentExtraction(
      documentText,
      documentType,
      filename
    );

    log.info('Extraction complete:', {
      title: extractionResult.title,
      type: extractionResult.type,
      confidence: extractionResult.confidence.overall,
    });

    return NextResponse.json({
      success: true,
      data: extractionResult,
    });
  } catch (error) {
    // Handle auth errors with 401 status
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    log.error('Document extraction failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Document extraction failed',
      },
      { status: 500 }
    );
  }
}
