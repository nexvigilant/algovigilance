import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb, adminStorage, adminTimestamp } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { checkPublicRateLimit } from '@/lib/rate-limit';
import { daysToMs } from '@/lib/constants/timing';
import {
  generateWizardReportPDF,
  type WizardReportData,
} from '@/lib/wizard-report-pdf-generator';
import { generateDocumentNumber } from '@/lib/documents/base';
import type { WizardRecommendations, ServiceCategory } from '@/types/service-wizard';
import { serviceInfo } from '@/data/service-outcomes';

const log = logger.scope('api/wizard-report');

/**
 * Validation schema for wizard report request
 */
const wizardReportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  company: z.string().min(1, 'Company is required').max(200),
  email: z.string().email('Invalid email address'),
  branch: z.enum(['challenge', 'opportunity', 'exploration']).nullable(),
  scores: z.record(z.string(), z.number()),
  primaryCategory: z.string(),
  secondaryCategories: z.array(z.string()),
  tags: z.array(z.string()),
  situationSummary: z.string().max(1000),
  personalizedMessage: z.string().max(500),
});

export type WizardReportInput = z.infer<typeof wizardReportSchema>;

/**
 * Build WizardReportData from API input for PDF generation
 */
function buildReportData(input: WizardReportInput): WizardReportData {
  const primaryCategory = input.primaryCategory as ServiceCategory;
  const primaryInfo = serviceInfo[primaryCategory];
  const primaryScore = input.scores[primaryCategory] || 0;
  const maxScore = Math.max(...Object.values(input.scores));
  const normalizedPrimaryScore = maxScore > 0 ? Math.round((primaryScore / maxScore) * 100) : 0;

  // Build primary recommendation
  const primary = {
    category: primaryCategory,
    score: normalizedPrimaryScore,
    isPrimary: true,
    headline: primaryInfo?.tagline || '',
    outcomes: primaryInfo?.outcomes || [],
  };

  // Build secondary recommendations
  const secondary = input.secondaryCategories.map((cat) => {
    const category = cat as ServiceCategory;
    const info = serviceInfo[category];
    const score = input.scores[category] || 0;
    const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      category,
      score: normalizedScore,
      isPrimary: false,
      headline: info?.tagline || '',
      outcomes: info?.outcomes || [],
    };
  });

  const recommendations: WizardRecommendations = {
    primary,
    secondary,
    personalizedMessage: input.personalizedMessage,
    situationSummary: input.situationSummary,
  };

  // Calculate Maturity Profile for visualization
  // Normalizing scores to 0-100 scale for radar charts
  const maturityProfile = {
    strategic: Math.min(100, (input.scores.strategic || 0) * 20),
    innovation: Math.min(100, (input.scores.innovation || 0) * 20),
    tactical: Math.min(100, (input.scores.tactical || 0) * 20),
    talent: Math.min(100, (input.scores.talent || 0) * 20),
    technology: Math.min(100, (input.scores.technology || 0) * 20),
  };

  return {
    name: input.name,
    company: input.company,
    email: input.email,
    recommendations,
    branch: input.branch,
    maturityProfile, // Added for radar chart visualization in PDF
    generatedAt: new Date(),
  };
}

/**
 * Generate PDF and upload to Firebase Storage
 */
async function generateAndStorePDF(
  reportId: string,
  reportData: WizardReportData
): Promise<{ storagePath: string; downloadUrl: string }> {
  const bucket = adminStorage.bucket();

  // Generate PDF
  const doc = generateWizardReportPDF(reportData);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  // Create storage path: wizard-reports/{year}/{month}/{reportId}.pdf
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const safeName = reportData.company.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
  const storagePath = `wizard-reports/${year}/${month}/${reportId}-${safeName}.pdf`;

  // Upload to Firebase Storage
  const file = bucket.file(storagePath);
  await file.save(pdfBuffer, {
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        reportId,
        company: reportData.company,
        email: reportData.email,
        generatedAt: now.toISOString(),
      },
    },
  });

  // Generate signed URL (valid for 7 days)
  const [downloadUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + daysToMs(7), // 7 days
  });

  log.info('PDF uploaded to Storage:', { storagePath, reportId });

  return { storagePath, downloadUrl };
}

/**
 * POST /api/wizard-report
 * Save wizard report data to Firestore and generate PDF for storage
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkPublicRateLimit('wizard_report');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = wizardReportSchema.safeParse(body);

    if (!validationResult.success) {
      log.warn('[wizard-report] Validation failed:', validationResult.error.errors);
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Generate document number and create report ID
    const documentNumber = generateDocumentNumber('NV-SDA');
    const reportRef = adminDb.collection('wizard_reports').doc();
    const reportId = reportRef.id;

    // Build report data for PDF generation
    const reportData = buildReportData(data);

    // Generate PDF and upload to Storage
    let pdfInfo: { storagePath: string; downloadUrl: string } | null = null;
    try {
      pdfInfo = await generateAndStorePDF(reportId, reportData);
    } catch (pdfError) {
      log.error('[wizard-report] PDF generation failed:', pdfError);
      // Continue without PDF - we still want to save the lead data
    }

    // Store report in Firestore
    await reportRef.set({
      documentNumber,
      name: data.name,
      company: data.company,
      email: data.email,
      branch: data.branch,
      scores: data.scores,
      primaryCategory: data.primaryCategory,
      secondaryCategories: data.secondaryCategories,
      tags: data.tags,
      situationSummary: data.situationSummary,
      personalizedMessage: data.personalizedMessage,
      source: 'service-wizard-pdf',
      // PDF storage info
      pdfStoragePath: pdfInfo?.storagePath || null,
      pdfDownloadUrl: pdfInfo?.downloadUrl || null,
      pdfGeneratedAt: pdfInfo ? adminTimestamp.now() : null,
      // Timestamps
      downloadedAt: adminTimestamp.now(),
      createdAt: adminTimestamp.now(),
    });

    log.info('[wizard-report] Report saved:', {
      reportId,
      documentNumber,
      email: data.email,
      company: data.company,
      primaryCategory: data.primaryCategory,
      hasPdf: !!pdfInfo,
    });

    return NextResponse.json({
      success: true,
      reportId,
      documentNumber,
      downloadUrl: pdfInfo?.downloadUrl || null,
    });
  } catch (error) {
    log.error('[wizard-report] Unexpected error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/wizard-report/:id
 * Get a fresh download URL for an existing report
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    // Get report from Firestore
    const reportDoc = await adminDb.collection('wizard_reports').doc(reportId).get();

    if (!reportDoc.exists) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = reportDoc.data();
    const storagePath = reportData?.pdfStoragePath;

    if (!storagePath) {
      return NextResponse.json({ error: 'PDF not available for this report' }, { status: 404 });
    }

    // Generate fresh signed URL
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);
    const [downloadUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + daysToMs(7), // 7 days
    });

    return NextResponse.json({
      success: true,
      reportId,
      downloadUrl,
    });
  } catch (error) {
    log.error('[wizard-report] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
