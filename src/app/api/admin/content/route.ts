import { NextResponse } from 'next/server';
import { getAllContent, toCardProps } from '@/lib/intelligence';
import { requireAdmin } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('content/route');

/**
 * GET /api/admin/content
 * List all Intelligence hub content with image status
 * Requires admin authentication
 */
export async function GET() {
  try {
    // Verify admin authentication
    await requireAdmin();

    const allContent = getAllContent();

    const contentList = allContent.map((item) => {
      const props = toCardProps(item);
      return {
        slug: props.slug,
        title: props.title,
        type: props.type,
        image: props.image || null,
        imageAlt: props.imageAlt || null,
        publishedAt: props.publishedAt,
      };
    });

    return NextResponse.json(contentList);
  } catch (error) {
    // Handle auth errors with 401 status
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    log.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
