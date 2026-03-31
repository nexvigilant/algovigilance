/**
 * Unit Tests for Document QA Tasks
 *
 * Tests individual functions with mocked dependencies.
 * Run with: npm test -- --testPathPattern=document-qa
 */

import * as path from 'path';

// Mock pdf-to-img before importing the module
jest.mock('pdf-to-img', () => ({
  pdf: jest.fn(),
}));

// Mock @google/generative-ai
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}));

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  statSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

import { pdf } from 'pdf-to-img';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import {
  quickValidatePdf,
  generateHtmlReport,
  reviewDocumentWithGemini,
  type DocumentQAReport,
  type DocumentQAOptions,
  escapeHtml,
  validatePdfPath,
  validateFileSize,
  SECURITY_CONSTANTS,
} from '../../../../cypress/support/document-qa-tasks';

describe('Document QA Tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // quickValidatePdf Tests
  // ============================================================================
  describe('quickValidatePdf', () => {
    it('should return invalid when file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await quickValidatePdf('/path/to/nonexistent.pdf');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File not found');
      expect(result.pageCount).toBe(0);
      expect(result.fileSize).toBe(0);
    });

    it('should return valid with correct page count and file size', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 102400 }); // 100KB

      // Mock pdf-to-img to yield 5 pages
      const mockPages = [
        Buffer.from('page1'),
        Buffer.from('page2'),
        Buffer.from('page3'),
        Buffer.from('page4'),
        Buffer.from('page5'),
      ];
      (pdf as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const page of mockPages) {
            yield page;
          }
        },
      });

      const result = await quickValidatePdf('/path/to/document.pdf');

      expect(result.valid).toBe(true);
      expect(result.pageCount).toBe(5);
      expect(result.fileSize).toBe(102400);
      expect(result.error).toBeUndefined();
    });

    it('should handle pdf-to-img errors gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
      (pdf as jest.Mock).mockRejectedValue(new Error('Corrupted PDF'));

      const result = await quickValidatePdf('/path/to/corrupted.pdf');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Corrupted PDF');
    });

    it('should resolve relative paths correctly', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 5000 });
      (pdf as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('page1');
        },
      });

      await quickValidatePdf('./relative/path.pdf');

      // Check that existsSync was called with an absolute path
      const calledPath = (fs.existsSync as jest.Mock).mock.calls[0][0];
      expect(path.isAbsolute(calledPath)).toBe(true);
    });
  });

  // ============================================================================
  // generateHtmlReport Tests
  // ============================================================================
  describe('generateHtmlReport', () => {
    const mockReport: DocumentQAReport = {
      passed: true,
      score: 85,
      documentName: 'test-document.pdf',
      pageCount: 10,
      timestamp: '2025-12-04T12:00:00.000Z',
      issues: [
        {
          page: 2,
          severity: 'minor',
          category: 'typography',
          description: 'Header spacing inconsistent',
          suggestion: 'Increase margin by 5pt',
        },
        {
          page: 5,
          severity: 'major',
          category: 'brand',
          description: 'Wrong cyan color used',
        },
      ],
      summary: 'Document meets most brand guidelines with minor issues.',
      brandCompliance: {
        colorAccuracy: 80,
        typographyScore: 85,
        layoutScore: 90,
        terminologyScore: 95,
      },
    };

    it('should generate valid HTML structure', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
    });

    it('should include document name in title and body', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('<title>Document QA Report - test-document.pdf</title>');
      expect(html).toContain('test-document.pdf');
    });

    it('should display correct score', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('>85<'); // Score in score div
    });

    it('should show PASSED status when passed is true', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('PASSED');
    });

    it('should show NEEDS REVISION status when passed is false', () => {
      const failedReport = { ...mockReport, passed: false };
      const html = generateHtmlReport(failedReport);

      expect(html).toContain('NEEDS REVISION');
    });

    it('should include all brand compliance metrics', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('80%'); // colorAccuracy
      expect(html).toContain('85%'); // typographyScore
      expect(html).toContain('90%'); // layoutScore
      expect(html).toContain('95%'); // terminologyScore
    });

    it('should render issues table with all issues', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('Issues Found (2)');
      expect(html).toContain('Header spacing inconsistent');
      expect(html).toContain('Wrong cyan color used');
      expect(html).toContain('Page 2');
      expect(html).toContain('Page 5');
      expect(html).toContain('MINOR');
      expect(html).toContain('MAJOR');
    });

    it('should show "No issues found" when issues array is empty', () => {
      const cleanReport = { ...mockReport, issues: [] };
      const html = generateHtmlReport(cleanReport);

      expect(html).toContain('No issues found!');
      expect(html).not.toContain('<tbody>');
    });

    it('should include suggestion when provided', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('Increase margin by 5pt');
    });

    it('should show dash when suggestion is not provided', () => {
      const html = generateHtmlReport(mockReport);

      // The second issue has no suggestion
      expect(html).toContain('<td>-</td>');
    });

    it('should apply correct severity colors', () => {
      const reportWithCritical: DocumentQAReport = {
        ...mockReport,
        issues: [
          { page: 1, severity: 'critical', category: 'brand', description: 'Critical issue' },
          { page: 2, severity: 'major', category: 'layout', description: 'Major issue' },
          { page: 3, severity: 'minor', category: 'content', description: 'Minor issue' },
        ],
      };
      const html = generateHtmlReport(reportWithCritical);

      expect(html).toContain('#FF4444'); // critical color
      expect(html).toContain('#FFB347'); // major color
      expect(html).toContain('#87CEEB'); // minor color
    });

    it('should include Gemini 3 Pro attribution', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('Powered by Google Gemini 3 Pro');
    });

    it('should use AlgoVigilance brand colors in styling', () => {
      const html = generateHtmlReport(mockReport);

      expect(html).toContain('#0B1421'); // Command Black
      expect(html).toContain('#0A192F'); // Intelligence Navy
      expect(html).toContain('#00AEEF'); // Neural Cyan
      expect(html).toContain('#E6F1FF'); // Signal White
      expect(html).toContain('#FFD700'); // Gold
    });

    it('should format timestamp correctly', () => {
      const html = generateHtmlReport(mockReport);

      // The timestamp should be formatted via toLocaleString()
      expect(html).toContain('Reviewed:');
    });

    it('should apply correct score color based on value', () => {
      // Score >= 80 should be cyan
      const highScoreReport = { ...mockReport, score: 90 };
      let html = generateHtmlReport(highScoreReport);
      expect(html).toContain('color: #00AEEF'); // cyan for high score

      // Score 60-79 should be orange
      const mediumScoreReport = { ...mockReport, score: 70 };
      html = generateHtmlReport(mediumScoreReport);
      expect(html).toContain('color: #FFB347'); // orange for medium score

      // Score < 60 should be red
      const lowScoreReport = { ...mockReport, score: 50 };
      html = generateHtmlReport(lowScoreReport);
      expect(html).toContain('color: #FF4444'); // red for low score
    });
  });

  // ============================================================================
  // reviewDocumentWithGemini Tests
  // ============================================================================
  describe('reviewDocumentWithGemini', () => {
    const validGeminiResponse = {
      passed: true,
      score: 88,
      pageCount: 3,
      issues: [],
      summary: 'Document meets all brand guidelines.',
      brandCompliance: {
        colorAccuracy: 90,
        typographyScore: 85,
        layoutScore: 88,
        terminologyScore: 92,
      },
    };

    beforeEach(() => {
      // Set up environment variable
      process.env.GOOGLE_GENAI_API_KEY = 'test-api-key';

      // Mock fs for PDF existence check
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock pdf-to-img
      (pdf as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('fake-image-data-page-1');
          yield Buffer.from('fake-image-data-page-2');
          yield Buffer.from('fake-image-data-page-3');
        },
      });
    });

    afterEach(() => {
      delete process.env.GOOGLE_GENAI_API_KEY;
    });

    it('should throw error when GOOGLE_GENAI_API_KEY is not set', async () => {
      delete process.env.GOOGLE_GENAI_API_KEY;

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
      };

      await expect(reviewDocumentWithGemini(options)).rejects.toThrow(
        'GOOGLE_GENAI_API_KEY environment variable is required'
      );
    });

    it('should throw error when PDF does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/nonexistent.pdf',
        _skipPathValidation: true,
      };

      await expect(reviewDocumentWithGemini(options)).rejects.toThrow('PDF not found');
    });

    it('should call Gemini API with correct model', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(validGeminiResponse),
        },
      });

      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
      }));

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
        _skipPathValidation: true,
      };

      await reviewDocumentWithGemini(options);

      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
      });
    });

    it('should parse valid JSON response from Gemini', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(validGeminiResponse),
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
        _skipPathValidation: true,
      };

      const result = await reviewDocumentWithGemini(options);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(88);
      expect(result.summary).toBe('Document meets all brand guidelines.');
    });

    it('should handle JSON response wrapped in markdown code blocks', async () => {
      const wrappedResponse = '```json\n' + JSON.stringify(validGeminiResponse) + '\n```';

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => wrappedResponse,
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
        _skipPathValidation: true,
      };

      const result = await reviewDocumentWithGemini(options);

      expect(result.score).toBe(88);
    });

    it('should throw error for invalid JSON response', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'This is not valid JSON',
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
        _skipPathValidation: true,
      };

      await expect(reviewDocumentWithGemini(options)).rejects.toThrow('Failed to parse QA response');
    });

    it('should add documentName and timestamp to response', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(validGeminiResponse),
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/my-document.pdf',
        _skipPathValidation: true,
      };

      const result = await reviewDocumentWithGemini(options);

      expect(result.documentName).toBe('my-document.pdf');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it('should respect maxPages option', async () => {
      let capturedImageCount = 0;

      const mockGenerateContent = jest.fn().mockImplementation((content) => {
        // Count image parts (content is array: [prompt, ...images])
        capturedImageCount = content.length - 1; // Subtract 1 for the prompt
        return {
          response: {
            text: () => JSON.stringify(validGeminiResponse),
          },
        };
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      // Mock PDF with 10 pages
      (pdf as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (let i = 0; i < 10; i++) {
            yield Buffer.from(`page-${i}`);
          }
        },
      });

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
        maxPages: 5,
        _skipPathValidation: true,
      };

      await reviewDocumentWithGemini(options);

      expect(capturedImageCount).toBe(5); // Should only send 5 pages
    });

    it('should include strictMode instructions when enabled', async () => {
      let capturedPrompt = '';

      const mockGenerateContent = jest.fn().mockImplementation((content) => {
        capturedPrompt = content[0]; // First element is the prompt
        return {
          response: {
            text: () => JSON.stringify(validGeminiResponse),
          },
        };
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
        strictMode: true,
        _skipPathValidation: true,
      };

      await reviewDocumentWithGemini(options);

      expect(capturedPrompt).toContain('STRICT MODE ENABLED');
    });

    it('should include template-specific instructions', async () => {
      let capturedPrompt = '';

      const mockGenerateContent = jest.fn().mockImplementation((content) => {
        capturedPrompt = content[0];
        return {
          response: {
            text: () => JSON.stringify(validGeminiResponse),
          },
        };
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
        templateType: 'persona',
        _skipPathValidation: true,
      };

      await reviewDocumentWithGemini(options);

      expect(capturedPrompt).toContain('Knowledge Transfer Persona');
    });

    it('should throw error when Gemini returns empty response', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => '',
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: '/path/to/document.pdf',
        _skipPathValidation: true,
      };

      await expect(reviewDocumentWithGemini(options)).rejects.toThrow('No text response from Gemini');
    });
  });

  // ============================================================================
  // Security Tests
  // ============================================================================
  describe('Security - escapeHtml', () => {
    it('should escape < and > characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should escape ampersand', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("it's working")).toBe('it&#039;s working');
    });

    it('should handle all special characters together', () => {
      expect(escapeHtml('<div class="test" data-val=\'foo&bar\'>')).toBe(
        '&lt;div class=&quot;test&quot; data-val=&#039;foo&amp;bar&#039;&gt;'
      );
    });

    it('should return empty string for non-string input', () => {
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
      expect(escapeHtml(123 as unknown as string)).toBe('');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle string with no special characters', () => {
      expect(escapeHtml('Normal text')).toBe('Normal text');
    });
  });

  describe('Security - validatePdfPath', () => {
    it('should accept paths within allowed directories', () => {
      // Mock current directory for consistency
      const testPath = path.join(process.cwd(), 'nexvigilant-document-system', 'test.pdf');
      expect(() => validatePdfPath(testPath)).not.toThrow();
    });

    it('should accept paths in output directory', () => {
      const testPath = path.join(process.cwd(), 'output', 'report.pdf');
      expect(() => validatePdfPath(testPath)).not.toThrow();
    });

    it('should accept paths in docs directory', () => {
      const testPath = path.join(process.cwd(), 'docs', 'guide.pdf');
      expect(() => validatePdfPath(testPath)).not.toThrow();
    });

    it('should reject paths outside allowed directories', () => {
      expect(() => validatePdfPath('/etc/passwd.pdf')).toThrow(
        'must be within allowed directories'
      );
    });

    it('should reject path traversal attempts with ..', () => {
      const maliciousPath = path.join(
        process.cwd(),
        'nexvigilant-document-system',
        '..',
        '..',
        'etc',
        'passwd.pdf'
      );
      expect(() => validatePdfPath(maliciousPath)).toThrow();
    });

    it('should reject relative path traversal', () => {
      expect(() => validatePdfPath('../../../etc/passwd.pdf')).toThrow();
    });

    it('should reject non-PDF files', () => {
      const testPath = path.join(process.cwd(), 'nexvigilant-document-system', 'test.txt');
      expect(() => validatePdfPath(testPath)).toThrow('must have .pdf extension');
    });

    it('should reject files with uppercase PDF extension not matching .pdf', () => {
      // The function lowercases, so .PDF should be accepted
      const testPath = path.join(process.cwd(), 'nexvigilant-document-system', 'test.PDF');
      expect(() => validatePdfPath(testPath)).not.toThrow();
    });

    it('should return absolute path for valid file', () => {
      const relativePath = 'nexvigilant-document-system/test.pdf';
      const result = validatePdfPath(relativePath);
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('Security - validateFileSize', () => {
    it('should accept files under the size limit', () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 * 1024 }); // 1MB
      expect(() => validateFileSize('/path/to/small.pdf')).not.toThrow();
    });

    it('should return file size for valid files', () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 5000000 }); // 5MB
      const size = validateFileSize('/path/to/valid.pdf');
      expect(size).toBe(5000000);
    });

    it('should reject files over 50MB', () => {
      const overLimit = 51 * 1024 * 1024; // 51MB
      (fs.statSync as jest.Mock).mockReturnValue({ size: overLimit });
      expect(() => validateFileSize('/path/to/large.pdf')).toThrow(
        'exceeds maximum allowed'
      );
    });

    it('should accept files exactly at 50MB limit', () => {
      const exactLimit = 50 * 1024 * 1024; // 50MB exactly
      (fs.statSync as jest.Mock).mockReturnValue({ size: exactLimit });
      expect(() => validateFileSize('/path/to/exact.pdf')).not.toThrow();
    });
  });

  describe('Security - SECURITY_CONSTANTS', () => {
    it('should have MAX_FILE_SIZE set to 50MB', () => {
      expect(SECURITY_CONSTANTS.MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
    });

    it('should have MAX_PAGES_LIMIT set to 50', () => {
      expect(SECURITY_CONSTANTS.MAX_PAGES_LIMIT).toBe(50);
    });

    it('should have DEFAULT_MAX_PAGES set to 20', () => {
      expect(SECURITY_CONSTANTS.DEFAULT_MAX_PAGES).toBe(20);
    });

    it('should have allowed directories defined', () => {
      expect(SECURITY_CONSTANTS.ALLOWED_PDF_DIRECTORIES).toContain('nexvigilant-document-system');
      expect(SECURITY_CONSTANTS.ALLOWED_PDF_DIRECTORIES).toContain('output');
      expect(SECURITY_CONSTANTS.ALLOWED_PDF_DIRECTORIES).toContain('docs');
      expect(SECURITY_CONSTANTS.ALLOWED_PDF_DIRECTORIES).toContain('tmp');
    });
  });

  describe('Security - XSS Prevention in HTML Report', () => {
    const xssReport: DocumentQAReport = {
      passed: true,
      score: 85,
      documentName: '<script>alert("xss")</script>.pdf',
      pageCount: 5,
      timestamp: '2025-12-04T12:00:00.000Z',
      issues: [
        {
          page: 1,
          severity: 'minor',
          category: 'content',
          description: '<img src=x onerror=alert("xss")>',
          suggestion: '"><script>document.cookie</script>',
        },
      ],
      summary: '<script>eval(atob("base64payload"))</script>',
      brandCompliance: {
        colorAccuracy: 80,
        typographyScore: 85,
        layoutScore: 90,
        terminologyScore: 95,
      },
    };

    it('should escape malicious document name', () => {
      const html = generateHtmlReport(xssReport);
      expect(html).not.toContain('<script>alert("xss")</script>.pdf');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape malicious issue description', () => {
      const html = generateHtmlReport(xssReport);
      expect(html).not.toContain('<img src=x onerror=alert("xss")>');
      expect(html).toContain('&lt;img');
    });

    it('should escape malicious suggestion', () => {
      const html = generateHtmlReport(xssReport);
      expect(html).not.toContain('"><script>document.cookie</script>');
      expect(html).toContain('&lt;script&gt;document.cookie&lt;/script&gt;');
    });

    it('should escape malicious summary', () => {
      const html = generateHtmlReport(xssReport);
      expect(html).not.toContain('<script>eval(');
      expect(html).toContain('&lt;script&gt;eval');
    });
  });

  describe('Security - Resource Limits', () => {
    const validGeminiResponse = {
      passed: true,
      score: 88,
      pageCount: 3,
      issues: [],
      summary: 'Document meets all brand guidelines.',
      brandCompliance: {
        colorAccuracy: 90,
        typographyScore: 85,
        layoutScore: 88,
        terminologyScore: 92,
      },
    };

    beforeEach(() => {
      process.env.GOOGLE_GENAI_API_KEY = 'test-api-key';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 * 1024 }); // 1MB

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(validGeminiResponse),
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));
    });

    afterEach(() => {
      delete process.env.GOOGLE_GENAI_API_KEY;
    });

    it('should enforce MAX_PAGES_LIMIT even if higher maxPages requested', async () => {
      let capturedImageCount = 0;

      // Create a PDF with 100 pages
      (pdf as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (let i = 0; i < 100; i++) {
            yield Buffer.from(`page-${i}`);
          }
        },
      });

      const mockGenerateContent = jest.fn().mockImplementation((content) => {
        capturedImageCount = content.length - 1;
        return {
          response: {
            text: () => JSON.stringify(validGeminiResponse),
          },
        };
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: path.join(process.cwd(), 'nexvigilant-document-system', 'test.pdf'),
        maxPages: 100, // Request more than limit
        _skipPathValidation: true,
      };

      await reviewDocumentWithGemini(options);

      // Should be capped at MAX_PAGES_LIMIT (50)
      expect(capturedImageCount).toBeLessThanOrEqual(SECURITY_CONSTANTS.MAX_PAGES_LIMIT);
    });

    it('should reject oversized PDF files', async () => {
      (fs.statSync as jest.Mock).mockReturnValue({ size: 60 * 1024 * 1024 }); // 60MB

      const options: DocumentQAOptions = {
        pdfPath: path.join(process.cwd(), 'nexvigilant-document-system', 'large.pdf'),
        _skipPathValidation: true,
      };

      await expect(reviewDocumentWithGemini(options)).rejects.toThrow('exceeds maximum allowed');
    });
  });

  describe('Security - Zod Schema Validation', () => {
    beforeEach(() => {
      process.env.GOOGLE_GENAI_API_KEY = 'test-api-key';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 * 1024 });

      (pdf as jest.Mock).mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('page-1');
        },
      });
    });

    afterEach(() => {
      delete process.env.GOOGLE_GENAI_API_KEY;
    });

    it('should reject response with invalid score (over 100)', async () => {
      const invalidResponse = {
        passed: true,
        score: 150, // Invalid: over 100
        pageCount: 1,
        issues: [],
        summary: 'Test',
        brandCompliance: {
          colorAccuracy: 80,
          typographyScore: 80,
          layoutScore: 80,
          terminologyScore: 80,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(invalidResponse),
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: path.join(process.cwd(), 'nexvigilant-document-system', 'test.pdf'),
        _skipPathValidation: true,
      };

      await expect(reviewDocumentWithGemini(options)).rejects.toThrow('Invalid QA response');
    });

    it('should reject response with invalid severity', async () => {
      const invalidResponse = {
        passed: true,
        score: 80,
        pageCount: 1,
        issues: [
          {
            page: 1,
            severity: 'super-critical', // Invalid enum value
            category: 'brand',
            description: 'Test issue',
          },
        ],
        summary: 'Test',
        brandCompliance: {
          colorAccuracy: 80,
          typographyScore: 80,
          layoutScore: 80,
          terminologyScore: 80,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(invalidResponse),
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: path.join(process.cwd(), 'nexvigilant-document-system', 'test.pdf'),
        _skipPathValidation: true,
      };

      await expect(reviewDocumentWithGemini(options)).rejects.toThrow('Invalid QA response');
    });

    it('should reject response missing required fields', async () => {
      const invalidResponse = {
        passed: true,
        // Missing score, pageCount, issues, summary, brandCompliance
      };

      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(invalidResponse),
        },
      });

      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent,
        }),
      }));

      const options: DocumentQAOptions = {
        pdfPath: path.join(process.cwd(), 'nexvigilant-document-system', 'test.pdf'),
        _skipPathValidation: true,
      };

      await expect(reviewDocumentWithGemini(options)).rejects.toThrow('Invalid QA response');
    });
  });

  describe('Security - quickValidatePdf file size check', () => {
    it('should reject files exceeding size limit', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 60 * 1024 * 1024 }); // 60MB

      const result = await quickValidatePdf('/path/to/huge.pdf');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });
  });
});
