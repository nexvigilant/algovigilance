import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { generateArticleImage } from '@/lib/ai/flows/generate-article-image';
import { getStyleForContentType, type ImageStyle } from '@/lib/config/image-style-presets';
import type { ContentType } from '@/types/intelligence';
import { requireAdmin } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('regenerate-image/route');

const CONTENT_DIR = path.join(process.cwd(), 'content', 'intelligence');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'intelligence', 'generated');

const TYPE_DIRS: Record<ContentType, string> = {
  podcast: 'podcast',
  publication: 'publications',
  perspective: 'perspectives',
  'field-note': 'field-notes',
  signal: 'signals',
};

interface RegenerateRequest {
  slug: string;
  style?: ImageStyle;
}

/**
 * POST /api/admin/content/regenerate-image
 * Regenerate an image for a specific content item
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const body: RegenerateRequest = await request.json();
    const { slug, style: requestedStyle } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Find the content file
    let filePath: string | null = null;
    let contentType: ContentType | null = null;

    for (const [type, dir] of Object.entries(TYPE_DIRS)) {
      const possiblePath = path.join(CONTENT_DIR, dir, `${slug}.mdx`);
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        contentType = type as ContentType;
        break;
      }
    }

    if (!filePath || !contentType) {
      return NextResponse.json(
        { error: `Content not found: ${slug}` },
        { status: 404 }
      );
    }

    // Use content-type-specific default style if no style requested
    const style = requestedStyle || getStyleForContentType(contentType);

    // Read and parse the MDX file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    // Generate new image with content-type-appropriate style
    const result = await generateArticleImage({
      title: frontmatter.title,
      description: frontmatter.description,
      contentType,
      tags: frontmatter.tags || [],
      style,
    });

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save the image
    const imageBuffer = Buffer.from(result.imageBase64, 'base64');
    const imagePath = path.join(OUTPUT_DIR, `${slug}.png`);
    fs.writeFileSync(imagePath, imageBuffer);

    // Update frontmatter
    frontmatter.image = `/images/intelligence/generated/${slug}.png`;
    frontmatter.imageAlt = result.alt;

    // Write updated MDX file
    const updatedContent = matter.stringify(content, frontmatter);
    fs.writeFileSync(filePath, updatedContent);

    return NextResponse.json({
      success: true,
      title: frontmatter.title,
      imagePath: frontmatter.image,
      alt: result.alt,
      prompt: result.prompt,
    });
  } catch (error) {
    // Handle auth errors with 401 status
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    log.error('Error regenerating image:', error);
    return NextResponse.json(
      {
        error: 'Failed to regenerate image',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
