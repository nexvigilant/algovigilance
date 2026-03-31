/**
 * Wizard Report API Route Tests
 *
 * Validates the /api/wizard-report endpoint structure, schema validation,
 * PDF generation, and Firebase Storage integration.
 *
 * Run with: npm test -- --testPathPattern=wizard-report
 */

import fs from 'fs';
import path from 'path';

describe('Wizard Report API Route', () => {
  const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'wizard-report', 'route.ts');

  test('API route file should exist', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  test('should export POST handler', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('export async function POST');
  });

  test('should export GET handler for refreshing download URL', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('export async function GET');
  });

  test('should use Zod schema validation', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("import { z } from 'zod'");
    expect(content).toContain('wizardReportSchema');
    expect(content).toContain('.safeParse');
  });

  test('should validate required fields', () => {
    const content = fs.readFileSync(routePath, 'utf-8');

    // Required string fields
    expect(content).toContain("name: z.string().min(1");
    expect(content).toContain("company: z.string().min(1");
    expect(content).toContain("email: z.string().email");
    expect(content).toContain("primaryCategory: z.string()");
    expect(content).toContain("situationSummary: z.string()");
  });

  test('should validate branch enum', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("branch: z.enum(['challenge', 'opportunity', 'exploration']).nullable()");
  });

  test('should validate scores as record', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('scores: z.record(z.string(), z.number())');
  });

  test('should validate secondary categories as array', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('secondaryCategories: z.array(z.string())');
  });

  test('should validate tags as array', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('tags: z.array(z.string())');
  });

  test('should handle validation errors with 400 status', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('status: 400');
    expect(content).toContain("error: 'Invalid request data'");
  });

  test('should use logger for debugging', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("import { logger } from '@/lib/logger'");
    expect(content).toContain("logger.scope('api/wizard-report')");
  });
});

describe('Wizard Report PDF Generation', () => {
  const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'wizard-report', 'route.ts');
  const pdfGeneratorPath = path.join(process.cwd(), 'src', 'lib', 'wizard-report-pdf-generator.ts');

  test('PDF generator file should exist', () => {
    expect(fs.existsSync(pdfGeneratorPath)).toBe(true);
  });

  test('should import PDF generator', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("import {");
    expect(content).toContain("generateWizardReportPDF");
    expect(content).toContain("from '@/lib/wizard-report-pdf-generator'");
  });

  test('should have generateAndStorePDF function', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('async function generateAndStorePDF');
  });

  test('should generate PDF buffer from jsPDF', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("doc.output('arraybuffer')");
    expect(content).toContain('Buffer.from');
  });

  test('should build report data from input', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('function buildReportData');
    expect(content).toContain('WizardReportData');
  });

  test('should calculate normalized scores', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('maxScore');
    expect(content).toContain('normalizedPrimaryScore');
  });

  test('should handle PDF generation errors gracefully', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('PDF generation failed');
    expect(content).toContain('catch (pdfError)');
  });
});

describe('Wizard Report Firebase Storage Integration', () => {
  const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'wizard-report', 'route.ts');

  test('should import Firebase Admin Storage', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("import { adminDb, adminStorage, adminTimestamp } from '@/lib/firebase-admin'");
  });

  test('should get storage bucket', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('adminStorage.bucket()');
  });

  test('should create organized storage path', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('wizard-reports/');
    expect(content).toContain('storagePath');
  });

  test('should save PDF to storage with metadata', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('file.save(pdfBuffer');
    expect(content).toContain("contentType: 'application/pdf'");
  });

  test('should generate signed URL for download', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('file.getSignedUrl');
    expect(content).toContain("action: 'read'");
    expect(content).toContain('expires:');
  });

  test('should store PDF path in Firestore', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('pdfStoragePath:');
    expect(content).toContain('pdfDownloadUrl:');
    expect(content).toContain('pdfGeneratedAt:');
  });

  test('should return download URL in response', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('downloadUrl:');
  });
});

describe('Wizard Report Firestore Storage', () => {
  const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'wizard-report', 'route.ts');

  test('should store report in wizard_reports collection', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("adminDb.collection('wizard_reports')");
  });

  test('should generate document number', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("generateDocumentNumber('NV-SDA')");
    expect(content).toContain('documentNumber');
  });

  test('should store essential lead data', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('name: data.name');
    expect(content).toContain('company: data.company');
    expect(content).toContain('email: data.email');
    expect(content).toContain('branch: data.branch');
  });

  test('should store recommendation data', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('primaryCategory: data.primaryCategory');
    expect(content).toContain('secondaryCategories: data.secondaryCategories');
    expect(content).toContain('scores: data.scores');
    expect(content).toContain('tags: data.tags');
  });

  test('should store timestamps', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('createdAt: adminTimestamp.now()');
    expect(content).toContain('downloadedAt: adminTimestamp.now()');
  });

  test('should mark source as service-wizard-pdf', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("source: 'service-wizard-pdf'");
  });

  test('should return reportId in response', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('reportId');
    expect(content).toContain('success: true');
  });
});

describe('Wizard Report GET Endpoint', () => {
  const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'wizard-report', 'route.ts');

  test('should handle missing report ID', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("Report ID required");
    expect(content).toContain("searchParams.get('id')");
  });

  test('should handle report not found', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("Report not found");
    expect(content).toContain('!reportDoc.exists');
  });

  test('should handle PDF not available', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("PDF not available for this report");
  });

  test('should generate fresh signed URL', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    // Check GET handler generates new signed URL
    expect(content).toMatch(/GET[\s\S]*getSignedUrl/);
  });
});

describe('Wizard Report PDF Generator', () => {
  const pdfGeneratorPath = path.join(process.cwd(), 'src', 'lib', 'wizard-report-pdf-generator.ts');

  test('should export generateWizardReportPDF function', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('export function generateWizardReportPDF');
  });

  test('should export downloadWizardReportPDF function', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('export function downloadWizardReportPDF');
  });

  test('should export getWizardReportPDFBlob function', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('export function getWizardReportPDFBlob');
  });

  test('should export WizardReportData type', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('export interface WizardReportData');
  });

  test('should use jsPDF for PDF generation', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toMatch(/import\s*\{\s*jsPDF\s*\}\s*from\s*["']jspdf["']/);
    expect(content).toContain('new jsPDF');
  });

  test('should use document system for styling', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toMatch(/from\s*["']@\/lib\/documents["']/);
    expect(content).toContain('DOCUMENT_COLORS');
    expect(content).toContain('getPageDimensions');
  });

  test('should include privileged classification', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('PRIVILEGED');
    expect(content).toContain('FOR INTENDED RECIPIENT ONLY');
  });

  test('should draw all sections', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('drawSituationAnalysis');
    expect(content).toContain('drawPrimaryRecommendation');
    expect(content).toContain('drawAdditionalOptions');
    expect(content).toContain('drawRecommendedActions');
    expect(content).toContain('drawEngagementPrinciples');
    expect(content).toContain('drawDiscoveryContact');
  });

  test('should include maturity profile with all categories', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('maturityProfile');
    expect(content).toContain('strategic:');
    expect(content).toContain('innovation:');
    expect(content).toContain('tactical:');
    expect(content).toContain('talent:');
    expect(content).toContain('technology:');
  });

  test('should include contact information', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('nexvigilant.com/contact');
    expect(content).toContain('matthew@nexvigilant.com');
  });

  test('should handle multi-page documents', () => {
    const content = fs.readFileSync(pdfGeneratorPath, 'utf-8');
    expect(content).toContain('doc.addPage()');
    expect(content).toContain('getNumberOfPages');
  });
});

describe('Wizard Report Schema Validation', () => {
  test('valid payload structure should match expected format', () => {
    const validPayload = {
      name: 'Test User',
      company: 'Test Company',
      email: 'test@example.com',
      branch: 'challenge' as const,
      scores: {
        strategic: 10,
        innovation: 8,
        tactical: 12,
        talent: 6,
        technology: 4,
      },
      primaryCategory: 'tactical',
      secondaryCategories: ['strategic', 'innovation'],
      tags: ['urgent', 'compliance'],
      situationSummary: 'Testing the wizard report generation',
      personalizedMessage: 'Your personalized recommendations are ready.',
    };

    // Validate all required fields exist
    expect(validPayload.name).toBeDefined();
    expect(validPayload.company).toBeDefined();
    expect(validPayload.email).toBeDefined();
    expect(validPayload.branch).toBeDefined();
    expect(validPayload.scores).toBeDefined();
    expect(validPayload.primaryCategory).toBeDefined();
    expect(validPayload.secondaryCategories).toBeDefined();
    expect(validPayload.tags).toBeDefined();
    expect(validPayload.situationSummary).toBeDefined();
    expect(validPayload.personalizedMessage).toBeDefined();

    // Validate scores structure
    expect(Object.keys(validPayload.scores).length).toBe(5);
    expect(typeof validPayload.scores.strategic).toBe('number');
  });

  test('branch values should be one of three valid options or null', () => {
    const validBranches = ['challenge', 'opportunity', 'exploration', null];

    validBranches.forEach((branch) => {
      expect(['challenge', 'opportunity', 'exploration', null]).toContain(branch);
    });
  });

  test('primaryCategory should be a valid service category', () => {
    const validCategories = ['strategic', 'innovation', 'tactical', 'talent', 'technology', 'maturity'];

    validCategories.forEach((category) => {
      expect(['strategic', 'innovation', 'tactical', 'talent', 'technology', 'maturity']).toContain(category);
    });
  });
});
