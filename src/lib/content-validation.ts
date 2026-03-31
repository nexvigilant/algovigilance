/**
 * Intelligence Content Validation Service
 *
 * Uses Perplexity Sonar for real-time fact-checking and source verification
 * of Intelligence content. Detects:
 * - Factual errors and contradictions
 * - Outdated information
 * - Unavailable sources
 * - Regulatory updates
 * - Enhancement opportunities
 */

import { v4 as uuidv4 } from 'uuid';
import { adminDb, adminTimestamp } from './firebase-admin';
import { getAllContent, getContentBySlug } from './intelligence';
import { getSecret, SecretNames } from './secrets';
import type { ContentItem, ContentType } from '@/types/intelligence';
import type {
  ContentValidation,
  ContentIssue,
  ContentIssueId,
  ValidationRunId,
  ValidationSource,
  ExtractedClaim,
  ClaimVerification,
  IssueCategory,
  IssueSeverity,
  ValidationRun,
} from '@/types/content-validation';

import { logger } from '@/lib/logger';
const log = logger.scope('lib/content-validation');

// Perplexity API configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const DEFAULT_MODEL = 'sonar'; // Perplexity Sonar for web search

/**
 * Call Perplexity API for fact-checking
 * Fetches API key from Google Cloud Secret Manager
 */
async function callPerplexity(
  query: string,
  systemPrompt?: string,
  model: string = DEFAULT_MODEL
): Promise<{ content: string; citations: string[] }> {
  // Fetch API key from Secret Manager (with fallback to env var)
  const apiKey = await getSecret(SecretNames.PERPLEXITY_API_KEY);
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not configured in Secret Manager or environment');
  }

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: query },
      ],
      temperature: 0.1, // Low temperature for factual accuracy
      max_tokens: 4000,
      return_citations: true,
      search_recency_filter: 'month', // Focus on recent sources
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const citations = data.citations || [];

  return { content, citations };
}

/**
 * Extract verifiable claims from article content
 */
function extractClaims(content: string, _meta: ContentItem['meta']): ExtractedClaim[] {
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
 * Verify claims using Perplexity
 */
async function verifyClaims(
  claims: ExtractedClaim[],
  articleTitle: string,
  _articleContent: string
): Promise<ClaimVerification[]> {
  if (claims.length === 0) {
    return [];
  }

  const systemPrompt = `You are a fact-checking assistant for pharmaceutical and pharmacovigilance content. Your role is to:
1. Verify factual claims against authoritative sources
2. Identify outdated information
3. Flag contradictions with current regulatory guidance
4. Note when sources are unavailable or broken

For each claim, respond with:
- VERIFIED: If the claim is accurate and current
- OUTDATED: If the information has changed
- CONTRADICTION: If authoritative sources disagree
- UNVERIFIABLE: If no reliable sources confirm the claim
- ERROR: If the claim is factually incorrect

Always cite your sources.`;

  const claimsText = claims.map((c, i) => `${i + 1}. [${c.type}] ${c.claim}`).join('\n');

  const query = `Article: "${articleTitle}"

Verify these claims from the article:
${claimsText}

For each claim:
1. State whether it is VERIFIED, OUTDATED, CONTRADICTION, UNVERIFIABLE, or ERROR
2. Explain your reasoning
3. Provide the current/correct information if different
4. Cite authoritative sources

Focus on pharmaceutical, pharmacovigilance, and regulatory accuracy.`;

  try {
    const { content, citations } = await callPerplexity(query, systemPrompt);
    return parseVerificationResponse(claims, content, citations);
  } catch (error) {
    log.error('Error verifying claims:', error);
    return [];
  }
}

/**
 * Parse Perplexity's verification response into structured results
 */
function parseVerificationResponse(
  claims: ExtractedClaim[],
  response: string,
  citations: string[]
): ClaimVerification[] {
  const verifications: ClaimVerification[] = [];
  const lines = response.split('\n');

  let currentClaimIndex = -1;
  let currentVerification: {
    claim: ExtractedClaim;
    verified: boolean;
    confidence: number;
    explanation: string;
    sources: ValidationSource[];
    issue?: ContentIssue;
  } | null = null;

  for (const line of lines) {
    // Check for claim number references
    const claimMatch = line.match(/^(\d+)\./);
    if (claimMatch) {
      // Save previous verification
      if (currentVerification && currentClaimIndex >= 0) {
        verifications.push(currentVerification as ClaimVerification);
      }

      currentClaimIndex = parseInt(claimMatch[1]) - 1;
      if (currentClaimIndex >= 0 && currentClaimIndex < claims.length) {
        currentVerification = {
          claim: claims[currentClaimIndex],
          verified: false,
          confidence: 0.5,
          explanation: '',
          sources: citations.map((url) => ({ title: new URL(url).hostname, url })),
        };
      }
    }

    // Check for verification status
    if (currentVerification) {
      const upper = line.toUpperCase();
      if (upper.includes('VERIFIED')) {
        currentVerification.verified = true;
        currentVerification.confidence = 0.9;
      } else if (upper.includes('OUTDATED')) {
        currentVerification.verified = false;
        currentVerification.confidence = 0.8;
        currentVerification.issue = createIssue(
          'outdated_information',
          'medium',
          claims[currentClaimIndex],
          line
        );
      } else if (upper.includes('CONTRADICTION')) {
        currentVerification.verified = false;
        currentVerification.confidence = 0.85;
        currentVerification.issue = createIssue(
          'contradiction',
          'high',
          claims[currentClaimIndex],
          line
        );
      } else if (upper.includes('UNVERIFIABLE')) {
        currentVerification.verified = false;
        currentVerification.confidence = 0.6;
        currentVerification.issue = createIssue(
          'claim_unsubstantiated',
          'low',
          claims[currentClaimIndex],
          line
        );
      } else if (upper.includes('ERROR')) {
        currentVerification.verified = false;
        currentVerification.confidence = 0.9;
        currentVerification.issue = createIssue(
          'factual_error',
          'critical',
          claims[currentClaimIndex],
          line
        );
      }

      // Append to explanation
      if (line.trim() && !claimMatch) {
        currentVerification.explanation += line + ' ';
      }
    }
  }

  // Save last verification
  if (currentVerification && currentClaimIndex >= 0) {
    verifications.push(currentVerification as ClaimVerification);
  }

  return verifications;
}

/**
 * Create an issue from verification failure
 */
function createIssue(
  category: IssueCategory,
  severity: IssueSeverity,
  claim: ExtractedClaim,
  explanation: string
): ContentIssue {
  return {
    id: uuidv4() as ContentIssueId,
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

/**
 * Check if sources in article are still accessible
 */
async function checkSourceAvailability(content: string): Promise<ContentIssue[]> {
  // Extract URLs from content
  const urlPattern = /https?:\/\/[^\s)]+/gi;
  const urls = content.match(urlPattern) || [];
  const uniqueUrls = [...new Set(urls)].slice(0, 10); // Max 10 URLs

  // Check all URLs in parallel to avoid N+1 sequential requests
  const results = await Promise.allSettled(
    uniqueUrls.map(async (url): Promise<ContentIssue | null> => {
      try {
        // Head request to check accessibility
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        if (!response.ok && response.status !== 403) { // 403 often just means bot protection
          return {
            id: uuidv4() as ContentIssueId,
            category: 'source_unavailable',
            severity: 'medium',
            title: `Source unavailable: ${new URL(url).hostname}`,
            description: `The referenced source returned status ${response.status}`,
            problematicText: url,
            sources: [],
            status: 'open',
            detectedAt: new Date().toISOString(),
          };
        }
        return null;
      } catch (error) {
        // Network error - source may be down
        return {
          id: uuidv4() as ContentIssueId,
          category: 'source_unavailable',
          severity: 'medium',
          title: `Source unreachable: ${new URL(url).hostname}`,
          description: `Failed to access source: ${error instanceof Error ? error.message : 'Unknown error'}`,
          problematicText: url,
          sources: [],
          status: 'open',
          detectedAt: new Date().toISOString(),
        };
      }
    })
  );

  // Filter fulfilled results with issues
  const issues: ContentIssue[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== null) {
      issues.push(result.value);
    }
  }
  return issues;
}

/**
 * Check for regulatory updates since publication
 */
async function checkRegulatoryUpdates(
  content: string,
  publishedAt: string
): Promise<ContentIssue[]> {
  const systemPrompt = `You are a pharmaceutical regulatory expert. Identify if any regulations, guidelines, or requirements mentioned in the content have been updated since the publication date.

Focus on:
- FDA guidance documents
- ICH guidelines (E2A, E2B, E2C, E2D, E2E, Q series)
- EMA guidelines
- EU GVP modules
- 21 CFR regulations

Only report significant changes that would affect the accuracy of the content.`;

  const query = `Publication Date: ${publishedAt}

Content to review:
${content.slice(0, 6000)}

List any regulatory updates since the publication date that would affect the accuracy of this content. Format as:
- REGULATION: [name/number]
- UPDATE: [what changed]
- DATE: [when it changed]
- IMPACT: [how it affects this content]

If no significant updates, respond with "NO UPDATES FOUND".`;

  try {
    const { content: response, citations } = await callPerplexity(query, systemPrompt);

    if (response.includes('NO UPDATES FOUND')) {
      return [];
    }

    // Parse regulatory updates
    const issues: ContentIssue[] = [];
    const updateBlocks = response.split('- REGULATION:');

    for (const block of updateBlocks.slice(1)) {
      const lines = block.split('\n');
      const regulation = lines[0]?.trim() || 'Unknown regulation';
      const updateMatch = block.match(/UPDATE:\s*([^\n]+)/i);
      const impactMatch = block.match(/IMPACT:\s*([^\n]+)/i);

      issues.push({
        id: uuidv4() as ContentIssueId,
        category: 'regulatory_update',
        severity: 'high',
        title: `Regulatory Update: ${regulation}`,
        description: `${updateMatch?.[1] || 'Regulation has been updated'}. Impact: ${impactMatch?.[1] || 'Review needed'}`,
        suggestedCorrection: updateMatch?.[1],
        sources: citations.map((url) => ({
          title: new URL(url).hostname,
          url,
          accessedAt: new Date().toISOString(),
        })),
        status: 'open',
        detectedAt: new Date().toISOString(),
      });
    }

    return issues;
  } catch (error) {
    log.error('Error checking regulatory updates:', error);
    return [];
  }
}

/**
 * Calculate health score based on issues
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
 * Validate a single content item
 */
export async function validateContent(
  item: ContentItem,
  model: string = DEFAULT_MODEL
): Promise<ContentValidation> {
  const startTime = Date.now();
  const { meta, content } = item;

  log.debug(`[Validation] Starting validation for: ${meta.slug}`);

  const startedAt = new Date().toISOString();
  const issues: ContentIssue[] = [];

  try {
    // Step 1: Extract claims from content
    log.debug(`[Validation] Extracting claims...`);
    const claims = extractClaims(content, meta);
    log.debug(`[Validation] Found ${claims.length} claims to verify`);

    // Step 2: Verify claims with Perplexity
    if (claims.length > 0) {
      log.debug(`[Validation] Verifying claims with Perplexity...`);
      const verifications = await verifyClaims(claims, meta.title, content);

      for (const v of verifications) {
        if (v.issue) {
          issues.push(v.issue);
        }
      }
    }

    // Step 3: Check source availability
    log.debug(`[Validation] Checking source availability...`);
    const sourceIssues = await checkSourceAvailability(content);
    issues.push(...sourceIssues);

    // Step 4: Check for regulatory updates
    log.debug(`[Validation] Checking for regulatory updates...`);
    const regulatoryIssues = await checkRegulatoryUpdates(content, meta.publishedAt);
    issues.push(...regulatoryIssues);

    // Calculate summary
    const summary = {
      totalIssues: issues.length,
      criticalCount: issues.filter((i) => i.severity === 'critical').length,
      highCount: issues.filter((i) => i.severity === 'high').length,
      mediumCount: issues.filter((i) => i.severity === 'medium').length,
      lowCount: issues.filter((i) => i.severity === 'low').length,
      openIssuesCount: issues.filter((i) => i.status === 'open').length,
    };

    const healthScore = calculateHealthScore(issues);
    const needsAttention = summary.criticalCount > 0 || summary.highCount > 0;

    return {
      slug: meta.slug,
      contentType: meta.type,
      title: meta.title,
      publishedAt: meta.publishedAt,
      status: 'completed',
      startedAt,
      completedAt: new Date().toISOString(),
      issues,
      summary,
      healthScore,
      needsAttention,
      model,
      processingTimeSeconds: (Date.now() - startTime) / 1000,
    };
  } catch (error) {
    log.error(`[Validation] Error validating ${meta.slug}:`, error);
    return {
      slug: meta.slug,
      contentType: meta.type,
      title: meta.title,
      publishedAt: meta.publishedAt,
      status: 'failed',
      startedAt,
      completedAt: new Date().toISOString(),
      issues: [],
      summary: {
        totalIssues: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        openIssuesCount: 0,
      },
      healthScore: 0,
      needsAttention: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      model,
    };
  }
}

/**
 * Run validation on all eligible content
 */
export async function runValidation(
  options: {
    slugs?: string[];
    force?: boolean;
    model?: string;
    contentTypes?: ContentType[];
  } = {}
): Promise<ValidationRun> {
  const _startTime = Date.now();
  const model = options.model || DEFAULT_MODEL;

  log.debug('[Validation] Starting validation run...');

  const startedAt = new Date().toISOString();
  let totalArticles = 0;
  let articlesWithIssues = 0;
  let totalIssues = 0;
  let criticalIssues = 0;
  const articlesNeedingAttention: string[] = [];

  try {
    // Get content to validate
    let contentItems: ContentItem[];

    if (options.slugs && options.slugs.length > 0) {
      // Validate specific slugs
      contentItems = options.slugs
        .map((slug) => getContentBySlug(slug))
        .filter((item): item is ContentItem => item !== null);
    } else {
      // Validate all published content
      contentItems = getAllContent();
    }

    // Filter by content type if specified
    if (options.contentTypes && options.contentTypes.length > 0) {
      contentItems = contentItems.filter((item) =>
        (options.contentTypes ?? []).includes(item.meta.type)
      );
    }

    // Skip podcasts by default (less fact-checkable)s
    contentItems = contentItems.filter((item) => item.meta.type !== 'podcast');

    totalArticles = contentItems.length;
    log.debug(`[Validation] Validating ${totalArticles} articles...`);

    // Validate each content item
    for (const item of contentItems) {
      log.debug(`[Validation] Processing: ${item.meta.slug}`);

      const validation = await validateContent(item, model);

      // Store validation result in Firestore
      await adminDb.collection('content_validations').doc(item.meta.slug).set({
        ...validation,
        startedAt: adminTimestamp.fromDate(new Date(validation.startedAt as string)),
        completedAt: validation.completedAt
          ? adminTimestamp.fromDate(new Date(validation.completedAt as string))
          : null,
        updatedAt: adminTimestamp.now(),
      });

      // Update run stats
      if (validation.issues.length > 0) {
        articlesWithIssues++;
        totalIssues += validation.issues.length;
        criticalIssues += validation.summary.criticalCount;
      }

      if (validation.needsAttention) {
        articlesNeedingAttention.push(item.meta.slug);
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const run: ValidationRun = {
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'completed',
      totalArticles,
      articlesWithIssues,
      totalIssues,
      criticalIssues,
      articlesNeedingAttention,
      notificationsSent: false,
    };

    log.debug(`[Validation] Run completed. ${articlesWithIssues}/${totalArticles} articles have issues.`);

    // Store run record in Firestore
    const runRef = await adminDb.collection('validation_runs').add({
      ...run,
      startedAt: adminTimestamp.fromDate(new Date(run.startedAt as string)),
      completedAt: adminTimestamp.now(),
    });

    return { ...run, id: runRef.id as ValidationRunId };

  } catch (error) {
    log.error('[Validation] Run failed:', error);
    const run: ValidationRun = {
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'failed',
      totalArticles,
      articlesWithIssues,
      totalIssues,
      criticalIssues,
      articlesNeedingAttention,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      notificationsSent: false,
    };

    // Store failed run record
    const runRef = await adminDb.collection('validation_runs').add({
      ...run,
      startedAt: adminTimestamp.fromDate(new Date(run.startedAt as string)),
      completedAt: adminTimestamp.now(),
    });

    return { ...run, id: runRef.id as ValidationRunId };
  }
}

/**
 * Get latest validation for a content item
 */
export async function getLatestValidation(slug: string): Promise<ContentValidation | null> {
  try {
    const doc = await adminDb.collection('content_validations').doc(slug).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ContentValidation;
  } catch (error) {
    log.error(`Error getting validation for ${slug}:`, error);
    return null;
  }
}

/**
 * Get all validations with issues
 */
export async function getValidationsWithIssues(): Promise<ContentValidation[]> {
  try {
    const snapshot = await adminDb
      .collection('content_validations')
      .where('summary.totalIssues', '>', 0)
      .orderBy('summary.totalIssues', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ContentValidation));
  } catch (error) {
    log.error('Error getting validations with issues:', error);
    return [];
  }
}

/**
 * Update issue status
 */
export async function updateIssueStatus(
  slug: string,
  issueId: string,
  status: ContentIssue['status'],
  userId: string,
  notes?: string
): Promise<void> {
  const validationRef = adminDb.collection('content_validations').doc(slug);
  const doc = await validationRef.get();

  if (!doc.exists) {
    throw new Error(`Validation not found for ${slug}`);
  }

  const validation = doc.data() as ContentValidation;
  const issueIndex = validation.issues.findIndex((i) => i.id === issueId);

  if (issueIndex === -1) {
    throw new Error(`Issue ${issueId} not found`);
  }

  // Create updated issues array
  const updatedIssues = [...validation.issues];
  updatedIssues[issueIndex] = {
    ...updatedIssues[issueIndex],
    status,
    statusUpdatedAt: new Date().toISOString(),
    statusUpdatedBy: userId,
    resolutionNotes: notes || updatedIssues[issueIndex].resolutionNotes,
  };

  // Recalculate summary
  const openIssuesCount = updatedIssues.filter((i) => i.status === 'open').length;
  const needsAttention = updatedIssues.some(
    (i) => i.status === 'open' && (i.severity === 'critical' || i.severity === 'high')
  );

  const updatedSummary = {
    ...validation.summary,
    openIssuesCount,
  };

  await validationRef.update({
    issues: updatedIssues,
    summary: updatedSummary,
    needsAttention,
    updatedAt: adminTimestamp.now(),
  });
}
