/**
 * Deep Research Report Saver
 *
 * Automatically saves research outputs to docs/research/ with:
 * - Standardized naming (YYYY-MM-DD-topic-slug.md)
 * - Metadata headers (date, duration, interaction ID)
 * - Auto-updated README index
 *
 * @example
 * ```ts
 * import { saveResearchReport } from '@/lib/deep-research/report-saver';
 *
 * const result = await client.research('PRISMA framework analysis');
 * await saveResearchReport({
 *   result,
 *   topic: 'PRISMA Framework',
 *   category: 'frameworks',
 * });
 * ```
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { ResearchResult } from './types';

import { logger } from '@/lib/logger';
const log = logger.scope('deep-research/report-saver');

// =============================================================================
// Types
// =============================================================================

export interface SaveReportOptions {
  /** The research result from Deep Research client */
  result: ResearchResult;
  /** Human-readable topic name (e.g., "PRISMA Framework") */
  topic: string;
  /** Category for organization */
  category?: 'frameworks' | 'drug-safety' | 'regulatory' | 'competitive' | 'general';
  /** Optional custom filename slug (auto-generated from topic if not provided) */
  slug?: string;
  /** Optional query that was used */
  query?: string;
}

export interface SaveReportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

// =============================================================================
// Constants
// =============================================================================

const RESEARCH_DIR = path.join(process.cwd(), 'docs', 'research');
const README_PATH = path.join(RESEARCH_DIR, 'README.md');

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert topic to URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate duration in minutes
 */
function calculateDuration(start: Date, end: Date): string {
  const durationMs = end.getTime() - start.getTime();
  const minutes = durationMs / 1000 / 60;
  return minutes.toFixed(1);
}

/**
 * Generate the report markdown with metadata header
 */
function generateReportMarkdown(options: SaveReportOptions): string {
  const { result, topic, category = 'general', query } = options;
  const duration = calculateDuration(result.startedAt, result.completedAt);

  const metadata = [
    `# ${topic}`,
    '',
    `> **Research Report** | Generated: ${formatDate(result.completedAt)} | Duration: ${duration} minutes`,
    `> **Agent**: Gemini Deep Research (deep-research-pro-preview-12-2025)`,
    `> **Category**: ${category}`,
    `> **Interaction ID**: \`${result.interactionId}\``,
  ];

  if (query) {
    metadata.push(`> **Query**: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
  }

  metadata.push('', '---', '');

  return metadata.join('\n') + result.report;
}

/**
 * Parse the existing README to extract the report index
 */
async function parseReadmeIndex(): Promise<Array<{ date: string; file: string; topic: string; duration: string }>> {
  try {
    const content = await fs.readFile(README_PATH, 'utf-8');
    const tableMatch = content.match(/\| Date \| Report \| Topic \| Duration \|\n\|.*\|\n([\s\S]*?)(?=\n\n|\n##|$)/);

    if (!tableMatch) return [];

    const rows = tableMatch[1].trim().split('\n');
    return rows
      .filter((row) => row.startsWith('|'))
      .map((row) => {
        const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
        const linkMatch = cells[1]?.match(/\[([^\]]+)\]\(\.\/([^)]+)\)/);
        return {
          date: cells[0] || '',
          file: linkMatch?.[2] || '',
          topic: linkMatch?.[1] || cells[1] || '',
          duration: cells[2] || '',
        };
      })
      .filter((entry) => entry.date && entry.file);
  } catch {
    return [];
  }
}

/**
 * Update the README with the new report entry
 */
async function updateReadmeIndex(
  fileName: string,
  topic: string,
  duration: string,
  date: string
): Promise<void> {
  const existingEntries = await parseReadmeIndex();

  // Add new entry at the top
  const newEntry = { date, file: fileName, topic, duration: `${duration} min` };
  const allEntries = [newEntry, ...existingEntries.filter((e) => e.file !== fileName)];

  // Sort by date descending
  allEntries.sort((a, b) => b.date.localeCompare(a.date));

  // Generate table rows
  const tableRows = allEntries
    .map((e) => `| ${e.date} | [${e.topic}](./${e.file}) | ${e.topic} | ${e.duration} |`)
    .join('\n');

  // Read current README
  let readmeContent: string;
  try {
    readmeContent = await fs.readFile(README_PATH, 'utf-8');
  } catch {
    // Create default README if it doesn't exist
    readmeContent = `# Research Reports

Intelligence briefs and research reports generated by the **Gemini Deep Research Agent**.

## Report Index

| Date | Report | Topic | Duration |
|------|--------|-------|----------|

## Usage

See \`src/lib/deep-research/\` for implementation details.
`;
  }

  // Replace the table content
  const tableHeader = '| Date | Report | Topic | Duration |\n|------|--------|-------|----------|';
  const tablePattern = /\| Date \| Report \| Topic \| Duration \|\n\|.*\|\n[\s\S]*?(?=\n\n|\n##|$)/;

  if (tablePattern.test(readmeContent)) {
    readmeContent = readmeContent.replace(tablePattern, `${tableHeader}\n${tableRows}`);
  } else {
    // Insert after ## Report Index
    const indexHeader = '## Report Index';
    const insertPos = readmeContent.indexOf(indexHeader);
    if (insertPos !== -1) {
      const afterHeader = insertPos + indexHeader.length;
      readmeContent =
        readmeContent.substring(0, afterHeader) +
        `\n\n${tableHeader}\n${tableRows}\n` +
        readmeContent.substring(afterHeader).replace(/^\n+/, '\n');
    }
  }

  await fs.writeFile(README_PATH, readmeContent, 'utf-8');
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Save a Deep Research report to docs/research/
 *
 * @param options - Report options including result, topic, and category
 * @returns Save result with file path
 *
 * @example
 * ```ts
 * const result = await client.research('Analyze PRISMA framework');
 * const saved = await saveResearchReport({
 *   result,
 *   topic: 'PRISMA Framework',
 *   category: 'frameworks',
 * });
 * log.info(`Saved to: ${saved.filePath}`);
 * ```
 */
export async function saveResearchReport(options: SaveReportOptions): Promise<SaveReportResult> {
  const { result, topic, category = 'general' } = options;

  if (result.status !== 'completed' || !result.report) {
    return {
      success: false,
      error: 'Cannot save failed or empty research result',
    };
  }

  try {
    // Ensure directory exists
    await fs.mkdir(RESEARCH_DIR, { recursive: true });

    // Generate filename
    const date = formatDate(result.completedAt);
    const slug = options.slug || slugify(topic);
    const fileName = `${date}-${slug}.md`;
    const filePath = path.join(RESEARCH_DIR, fileName);

    // Generate and save report
    const markdown = generateReportMarkdown(options);
    await fs.writeFile(filePath, markdown, 'utf-8');

    // Update README index
    const duration = calculateDuration(result.startedAt, result.completedAt);
    await updateReadmeIndex(fileName, topic, duration, date);

    log.info(`✅ Research report saved: ${fileName}`);
    log.info(`   Category: ${category}`);
    log.info(`   Path: ${filePath}`);

    return {
      success: true,
      filePath,
      fileName,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log.error(`❌ Failed to save research report: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * List all saved research reports
 */
export async function listResearchReports(): Promise<string[]> {
  try {
    const files = await fs.readdir(RESEARCH_DIR);
    return files
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .sort()
      .reverse();
  } catch {
    return [];
  }
}
