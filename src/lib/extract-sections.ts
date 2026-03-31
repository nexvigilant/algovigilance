/**
 * Utilities for extracting sections from markdown content.
 * Can be used on both server and client.
 */

export interface ArticleSection {
  id: string;
  title: string;
  level: 2 | 3; // h2 or h3
}

/**
 * Generate URL-friendly ID from heading text
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .trim();
}

/**
 * Extract h2 and h3 headings from markdown content to create navigation sections.
 * Creates URL-friendly IDs from the heading text.
 */
export function extractSectionsFromMarkdown(content: string): ArticleSection[] {
  const sections: ArticleSection[] = [];

  // Match ## and ### headings
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const title = match[2].trim();

    // Create URL-friendly ID
    const id = generateHeadingId(title);

    sections.push({ id, title, level });
  }

  return sections;
}
