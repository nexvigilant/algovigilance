import { type NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { getSecret } from '@/lib/secrets';
import { getContentBySlug } from '@/lib/intelligence';
import { applyIntelligentCorrection } from '@/lib/ai/flows/merge-content-correction';
import { requireAdmin } from '@/lib/admin-auth';
import type { ContentType } from '@/types/intelligence';

import { logger } from '@/lib/logger';
const log = logger.scope('content-correction/route');

// GitHub configuration
const GITHUB_OWNER = 'MatthewCampCorp';
const GITHUB_REPO = 'studio';
const BASE_BRANCH = 'main';

// Map content types to directories
const TYPE_DIRS: Record<ContentType, string> = {
  podcast: 'content/intelligence/podcast',
  publication: 'content/intelligence/publications',
  perspective: 'content/intelligence/perspectives',
  'field-note': 'content/intelligence/field-notes',
  signal: 'content/intelligence/signals',
};

/**
 * POST /api/admin/content-correction
 *
 * Creates a GitHub draft PR with content corrections.
 * Allows admins to quickly fix issues found during validation.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { slug, issueId, correction, issueTitle, userId, mode = 'ai' } = body;

    if (!slug || !correction) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, correction' },
        { status: 400 }
      );
    }

    // Get the content item
    const content = getContentBySlug(slug);
    if (!content) {
      return NextResponse.json(
        { error: `Content not found: ${slug}` },
        { status: 404 }
      );
    }

    // Get GitHub token from Secret Manager
    const githubToken = await getSecret('GITHUB_TOKEN');
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    const octokit = new Octokit({ auth: githubToken });

    // Generate branch name
    const timestamp = Date.now();
    const branchName = `fix/content-${slug}-${timestamp}`;
    const filePath = `${TYPE_DIRS[content.meta.type]}/${slug}.mdx`;

    log.debug(`[ContentCorrection] Creating branch: ${branchName}`);
    log.debug(`[ContentCorrection] File path: ${filePath}`);

    // Get the default branch SHA
    const { data: refData } = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `heads/${BASE_BRANCH}`,
    });
    const baseSha = refData.object.sha;

    // Create new branch
    await octokit.git.createRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    log.debug(`[ContentCorrection] Branch created: ${branchName}`);

    // Get current file content
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      ref: BASE_BRANCH,
    });

    if (!('content' in fileData)) {
      throw new Error('File not found or is a directory');
    }

    // Apply the correction using selected mode
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    
    let correctionResult: {
      content: string;
      method: 'ai_merge' | 'append';
      summary: string;
      changes?: Array<{ location: string; original: string; updated: string }>;
    };

    if (mode === 'ai') {
      // Use AI-powered intelligent merging
      log.debug("[ContentCorrection] Using AI merge mode");
      correctionResult = await applyIntelligentCorrection(
        currentContent,
        correction,
        issueTitle
      );
      log.debug("[ContentCorrection] AI merge result: " + correctionResult.method + ", " + correctionResult.summary);
    } else {
      // Use simple append mode
      log.debug("[ContentCorrection] Using append mode");
      correctionResult = {
        content: applyCorrection(currentContent, correction, issueTitle),
        method: 'append',
        summary: 'Correction appended as update section',
      };
    }
    const updatedContent = correctionResult.content;

    // Update file in the new branch
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: filePath,
      message: `fix(content): Update ${slug} based on validation feedback\n\nIssue: ${issueTitle || 'Content correction'}\n\nCorrected via Content Validation System`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: fileData.sha,
      branch: branchName,
    });

    log.debug(`[ContentCorrection] File updated in branch`);

    // Create draft PR
    const { data: pr } = await octokit.pulls.create({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      title: `fix(content): Update ${slug} - ${issueTitle || 'Validation correction'}`,
      body: `## Content Correction

**Article:** ${content.meta.title}
**Slug:** \`${slug}\`
**Issue:** ${issueTitle || 'Manual correction'}

### Correction Applied

${correction}

---

*This PR was automatically created by the Content Validation System.*
*Please review the changes before merging.*

### Checklist

- [ ] Content is factually accurate
- [ ] Sources are properly cited
- [ ] No formatting issues
- [ ] Ready for publication
`,
      head: branchName,
      base: BASE_BRANCH,
      draft: true,
    });

    log.debug(`[ContentCorrection] Draft PR created: ${pr.html_url}`);

    // Update the issue status in Firestore
    if (issueId) {
      const validationRef = adminDb.collection('content_validations').doc(slug);
      const validationDoc = await validationRef.get();

      if (validationDoc.exists) {
        const validation = validationDoc.data();
        const updatedIssues = validation?.issues?.map((issue: { id: string }) => {
          if (issue.id === issueId) {
            return {
              ...issue,
              status: 'acknowledged',
              statusUpdatedAt: new Date().toISOString(),
              statusUpdatedBy: userId,
              resolutionNotes: `Draft PR created: ${pr.html_url}`,
            };
          }
          return issue;
        });

        await validationRef.update({
          issues: updatedIssues,
          updatedAt: adminTimestamp.now(),
        });
      }
    }

    // Log the correction action
    await adminDb.collection('content_corrections').add({
      slug,
      ...(issueId && { issueId }),
      ...(issueTitle && { issueTitle }),
      correction,
      prUrl: pr.html_url,
      prNumber: pr.number,
      branchName,
      ...(userId && { createdBy: userId }),
      createdAt: adminTimestamp.now(),
      status: 'pending_review',
    });

    return NextResponse.json({
      success: true,
      message: 'Draft PR created successfully',
      prUrl: pr.html_url,
      prNumber: pr.number,
      branchName,
      correctionMethod: correctionResult.method,
      correctionSummary: correctionResult.summary,
    });
  } catch (error) {
    log.error('[ContentCorrection] Error:', error);
    return NextResponse.json(
      { error: 'Content correction failed' },
      { status: 500 }
    );
  }
}

/**
 * Apply a correction to the MDX content
 * This is a simple implementation - could be enhanced with AI-assisted merging
 */
function applyCorrection(content: string, correction: string, issueTitle?: string): string {
  // For now, we add the correction as a clearly marked update at the end of the content
  // A more sophisticated approach would use AI to intelligently merge

  // Check if there's already a corrections section
  if (content.includes('<!-- CONTENT CORRECTIONS -->')) {
    // Append to existing corrections section
    return content.replace(
      '<!-- CONTENT CORRECTIONS -->',
      `<!-- CONTENT CORRECTIONS -->

### Update (${new Date().toISOString().split('T')[0]})

${issueTitle ? `**Issue:** ${issueTitle}\n\n` : ''}${correction}
`
    );
  }

  // Add new corrections section at the end
  return `${content}

---

<!-- CONTENT CORRECTIONS -->

### Update (${new Date().toISOString().split('T')[0]})

${issueTitle ? `**Issue:** ${issueTitle}\n\n` : ''}${correction}
`;
}

/**
 * GET /api/admin/content-correction
 *
 * Get all pending content corrections
 */
export async function GET() {
  try {
    // Verify admin access
    await requireAdmin();

    const snapshot = await adminDb
      .collection('content_corrections')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const corrections = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ corrections });
  } catch (error) {
    log.error('[ContentCorrection] Error fetching corrections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch corrections' },
      { status: 500 }
    );
  }
}
