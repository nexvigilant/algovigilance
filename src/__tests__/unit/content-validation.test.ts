/**
 * Content Validation Unit Tests
 *
 * Tests pure functions used in content validation including:
 * - Claim extraction patterns (statistics, dates, regulations, quotes)
 * - Health score calculation
 * - Issue creation helpers
 *
 * These are extracted from content-validation.ts for testability.
 */

import { describe, it, expect } from '@jest/globals';
import { randomUUID } from 'crypto';

// ============================================================================
// Pure Functions (extracted from content-validation.ts for testing)
// ============================================================================

/**
 * Extracted claim interface
 */
interface ExtractedClaim {
  claim: string;
  type: 'statistic' | 'date' | 'regulation' | 'quote';
}

/**
 * Content issue interface
 */
interface ContentIssue {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  problematicText?: string;
  sources: { title: string; url: string }[];
  status: 'open' | 'resolved' | 'acknowledged';
  detectedAt: string;
}

/**
 * Extract verifiable claims from article content
 * (Pure function - no external dependencies)
 */
function extractClaims(content: string): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];

  // Pattern for statistics (numbers, percentages)
  const statPatterns = [
    /(\d+(?:\.\d+)?%\s+[^.]+)/gi,
    /(\$\d+(?:\.\d+)?(?:\s*(?:billion|million|trillion))?[^.]+)/gi,
    /(approximately|about|nearly|over|under)\s+\d+[^.]+/gi,
  ];

  // Pattern for dates and timeframes
  const datePatterns = [
    /(in\s+\d{4}[^.]+)/gi,
    /(since\s+\d{4}[^.]+)/gi,
    /(as of\s+[A-Z][a-z]+\s+\d{4}[^.]+)/gi,
  ];

  // Pattern for regulatory/guideline references
  const regulatoryPatterns = [
    /(FDA\s+[^.]+guidance[^.]+)/gi,
    /(ICH\s+[EQS]\d+[^.]+)/gi,
    /(21\s*CFR\s*Part\s*\d+[^.]+)/gi,
    /(EMA\s+[^.]+guideline[^.]+)/gi,
  ];

  // Pattern for quotes and attributed statements
  const quotePatterns = [
    /("[^"]+"\s*[,-]\s*[A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
    /(according to\s+[^.]+)/gi,
  ];

  // Extract statistics
  statPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      claims.push({
        claim: match[1].trim(),
        type: 'statistic',
      });
    }
  });

  // Extract dates
  datePatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      claims.push({
        claim: match[1].trim(),
        type: 'date',
      });
    }
  });

  // Extract regulatory references
  regulatoryPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      claims.push({
        claim: match[1].trim(),
        type: 'regulation',
      });
    }
  });

  // Extract quotes
  quotePatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      claims.push({
        claim: match[1].trim(),
        type: 'quote',
      });
    }
  });

  // Deduplicate and limit
  const uniqueClaims = claims
    .filter((c, i, arr) => arr.findIndex((x) => x.claim === c.claim) === i)
    .slice(0, 20); // Max 20 claims per article

  return uniqueClaims;
}

/**
 * Calculate health score based on issues
 * (Pure function - no external dependencies)
 */
function calculateHealthScore(issues: ContentIssue[]): number {
  if (issues.length === 0) return 100;

  let deductions = 0;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        deductions += 25;
        break;
      case 'high':
        deductions += 15;
        break;
      case 'medium':
        deductions += 10;
        break;
      case 'low':
        deductions += 5;
        break;
      case 'info':
        deductions += 2;
        break;
    }
  }

  return Math.max(0, 100 - deductions);
}

/**
 * Create an issue from verification failure
 * (Pure function - no external dependencies)
 */
function createIssue(
  category: string,
  severity: ContentIssue['severity'],
  claim: ExtractedClaim,
  explanation: string
): ContentIssue {
  return {
    id: randomUUID(),
    category,
    severity,
    title: `${category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}: ${claim.claim.slice(0, 50)}...`,
    description: explanation.trim(),
    problematicText: claim.claim,
    sources: [],
    status: 'open',
    detectedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Content Validation - Claim Extraction', () => {
  describe('Statistics extraction', () => {
    it('should extract percentage statistics', () => {
      const content = 'The study showed 45.5% of patients responded to treatment.';
      const claims = extractClaims(content);

      expect(claims.length).toBeGreaterThan(0);
      expect(claims.some(c => c.type === 'statistic' && c.claim.includes('45.5%'))).toBe(true);
    });

    it('should extract dollar amounts', () => {
      const content = 'The market is worth $2.5 billion globally.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'statistic' && c.claim.includes('$2.5 billion'))).toBe(true);
    });

    it('should extract million/trillion amounts', () => {
      const content = 'Sales reached $450 million in Q4 and could reach $1 trillion by 2030.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.claim.includes('million'))).toBe(true);
    });

    it('should extract approximate numbers', () => {
      const content = 'Approximately 500 patients were enrolled in the trial.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'statistic' && c.claim.includes('Approximately'))).toBe(true);
    });

    it('should extract "about", "nearly", "over", "under" quantities', () => {
      const content = 'About 1000 cases were reported. Nearly 50 patients withdrew. Over 200 adverse events were recorded.';
      const claims = extractClaims(content);

      expect(claims.filter(c => c.type === 'statistic').length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Date extraction', () => {
    it('should extract "in YYYY" references', () => {
      const content = 'In 2023, the FDA approved the new guidance document.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'date' && c.claim.includes('2023'))).toBe(true);
    });

    it('should extract "since YYYY" references', () => {
      // Regex requires text after the year before the period
      const content = 'The requirement has been in place since 2018 when new rules took effect.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'date' && c.claim.includes('since 2018'))).toBe(true);
    });

    it('should extract "as of Month YYYY" references', () => {
      const content = 'As of January 2024, the new requirements are in effect.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'date' && c.claim.includes('January 2024'))).toBe(true);
    });
  });

  describe('Regulatory reference extraction', () => {
    it('should extract FDA guidance references', () => {
      // Pattern: FDA + text + "guidance" + more text before period
      const content = 'The FDA final guidance on postmarketing safety reporting was released.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'regulation' && c.claim.includes('FDA'))).toBe(true);
    });

    it('should extract ICH guideline references', () => {
      const content = 'According to ICH E2B requirements, all serious adverse events must be reported.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'regulation' && c.claim.includes('ICH E2B'))).toBe(true);
    });

    it('should extract 21 CFR Part references', () => {
      const content = '21 CFR Part 312 establishes requirements for IND applications.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'regulation' && c.claim.includes('21 CFR Part 312'))).toBe(true);
    });

    it('should extract EMA guideline references', () => {
      // Pattern: EMA + text + "guideline" + more text before period
      const content = 'The EMA updated guideline on good pharmacovigilance practices is now effective.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'regulation' && c.claim.includes('EMA'))).toBe(true);
    });
  });

  describe('Quote extraction', () => {
    it('should extract attributed quotes', () => {
      const content = '"Safety must always come first" - John Smith said during the presentation.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'quote')).toBe(true);
    });

    it('should extract "according to" statements', () => {
      const content = 'According to WHO guidelines, adverse events should be reported within 24 hours.';
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'quote' && c.claim.includes('According to'))).toBe(true);
    });
  });

  describe('Deduplication and limits', () => {
    it('should deduplicate identical claims', () => {
      const content = '50% of patients responded. Another study showed 50% of patients responded.';
      const claims = extractClaims(content);

      // Should only have one unique claim for "50% of patients"
      const percentClaims = claims.filter(c => c.claim.includes('50%'));
      expect(percentClaims.length).toBe(1);
    });

    it('should limit to maximum 20 claims', () => {
      // Generate content with many claims
      const manyStats = Array.from({ length: 30 }, (_, i) => `${i + 1}% of cases`).join('. ');
      const claims = extractClaims(manyStats);

      expect(claims.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content', () => {
      const claims = extractClaims('');
      expect(claims).toEqual([]);
    });

    it('should handle content with no extractable claims', () => {
      const content = 'This is a simple paragraph with no statistics, dates, or regulatory references.';
      const claims = extractClaims(content);
      expect(claims.length).toBe(0);
    });

    it('should handle mixed content types', () => {
      const content = `
        In 2023, the FDA guidance on safety reporting was updated.
        According to ICH E2B, 95% of reports must be submitted electronically.
        The market is worth $5 billion globally.
      `;
      const claims = extractClaims(content);

      expect(claims.some(c => c.type === 'date')).toBe(true);
      expect(claims.some(c => c.type === 'regulation')).toBe(true);
      expect(claims.some(c => c.type === 'statistic')).toBe(true);
      expect(claims.some(c => c.type === 'quote')).toBe(true);
    });
  });
});

describe('Content Validation - Health Score Calculation', () => {
  const createMockIssue = (severity: ContentIssue['severity']): ContentIssue => ({
    id: randomUUID(),
    category: 'test',
    severity,
    title: 'Test Issue',
    description: 'Test description',
    sources: [],
    status: 'open',
    detectedAt: new Date().toISOString(),
  });

  it('should return 100 for no issues', () => {
    const score = calculateHealthScore([]);
    expect(score).toBe(100);
  });

  it('should deduct 25 points for critical issues', () => {
    const issues = [createMockIssue('critical')];
    const score = calculateHealthScore(issues);
    expect(score).toBe(75);
  });

  it('should deduct 15 points for high severity issues', () => {
    const issues = [createMockIssue('high')];
    const score = calculateHealthScore(issues);
    expect(score).toBe(85);
  });

  it('should deduct 10 points for medium severity issues', () => {
    const issues = [createMockIssue('medium')];
    const score = calculateHealthScore(issues);
    expect(score).toBe(90);
  });

  it('should deduct 5 points for low severity issues', () => {
    const issues = [createMockIssue('low')];
    const score = calculateHealthScore(issues);
    expect(score).toBe(95);
  });

  it('should deduct 2 points for info severity issues', () => {
    const issues = [createMockIssue('info')];
    const score = calculateHealthScore(issues);
    expect(score).toBe(98);
  });

  it('should accumulate deductions for multiple issues', () => {
    const issues = [
      createMockIssue('critical'), // -25
      createMockIssue('high'),     // -15
      createMockIssue('medium'),   // -10
    ];
    const score = calculateHealthScore(issues);
    expect(score).toBe(50); // 100 - 25 - 15 - 10 = 50
  });

  it('should not go below 0', () => {
    const issues = [
      createMockIssue('critical'),
      createMockIssue('critical'),
      createMockIssue('critical'),
      createMockIssue('critical'),
      createMockIssue('critical'), // 5 criticals = -125
    ];
    const score = calculateHealthScore(issues);
    expect(score).toBe(0);
  });

  it('should handle mixed severity issues', () => {
    const issues = [
      createMockIssue('high'),    // -15
      createMockIssue('low'),     // -5
      createMockIssue('info'),    // -2
    ];
    const score = calculateHealthScore(issues);
    expect(score).toBe(78); // 100 - 15 - 5 - 2 = 78
  });
});

describe('Content Validation - Issue Creation', () => {
  const mockClaim: ExtractedClaim = {
    claim: 'The FDA requires reporting within 15 calendar days for all serious unexpected adverse drug reactions.',
    type: 'regulation',
  };

  it('should create issue with correct structure', () => {
    const issue = createIssue('outdated_information', 'medium', mockClaim, 'This information may be outdated.');

    expect(issue).toHaveProperty('id');
    expect(issue.category).toBe('outdated_information');
    expect(issue.severity).toBe('medium');
    expect(issue.status).toBe('open');
    expect(issue.sources).toEqual([]);
    expect(issue.detectedAt).toBeDefined();
  });

  it('should generate unique IDs', () => {
    const issue1 = createIssue('factual_error', 'critical', mockClaim, 'Error 1');
    const issue2 = createIssue('factual_error', 'critical', mockClaim, 'Error 2');

    expect(issue1.id).not.toBe(issue2.id);
  });

  it('should format title with capitalized category', () => {
    const issue = createIssue('outdated_information', 'medium', mockClaim, 'Test');

    expect(issue.title).toContain('Outdated Information');
  });

  it('should truncate long claims in title', () => {
    const longClaim: ExtractedClaim = {
      claim: 'This is a very long claim that should be truncated in the title because it exceeds fifty characters significantly.',
      type: 'statistic',
    };
    const issue = createIssue('factual_error', 'high', longClaim, 'Error');

    expect(issue.title.length).toBeLessThan(100);
    expect(issue.title).toContain('...');
  });

  it('should trim description whitespace', () => {
    const issue = createIssue('source_unavailable', 'low', mockClaim, '  Extra whitespace  ');

    expect(issue.description).toBe('Extra whitespace');
  });

  it('should preserve full claim in problematicText', () => {
    const issue = createIssue('contradiction', 'high', mockClaim, 'Test');

    expect(issue.problematicText).toBe(mockClaim.claim);
  });

  it('should handle different severity levels', () => {
    const severities: ContentIssue['severity'][] = ['critical', 'high', 'medium', 'low', 'info'];

    severities.forEach((severity) => {
      const issue = createIssue('test_category', severity, mockClaim, 'Test');
      expect(issue.severity).toBe(severity);
    });
  });
});
