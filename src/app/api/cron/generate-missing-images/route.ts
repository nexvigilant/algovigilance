import { type NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { generateArticleImage } from '@/lib/ai/flows/generate-article-image';
import { adminDb, adminStorage, adminTimestamp } from '@/lib/firebase-admin';
import { getStyleForContentType } from '@/lib/config/image-style-presets';
import { verifyCronSecret } from '@/lib/cron-auth';
import { v4 as uuidv4 } from 'uuid';
import type { ContentType } from '@/types/intelligence';

import { logger } from '@/lib/logger';
const log = logger.scope('generate-missing-images/route');

const CONTENT_DIR = path.join(process.cwd(), 'content', 'intelligence');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'intelligence', 'generated');

const TYPE_DIRS: Record<ContentType, string> = {
  podcast: 'podcast',
  publication: 'publications',
  perspective: 'perspectives',
  'field-note': 'field-notes',
  signal: 'signals',
};

interface GenerationResult {
  id: string;
  title: string;
  type: 'intelligence' | 'academy';
  success: boolean;
  error?: string;
}

/**
 * GET /api/cron/generate-missing-images
 *
 * Vercel Cron Job endpoint that runs overnight to generate missing images
 * for Intelligence content and Academy courses.
 *
 * Schedule: Daily at 3 AM UTC (configured in vercel.json)
 *
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security (fail-closed)
  const authError = await verifyCronSecret(request, 'generate-missing-images');
  if (authError) return authError;

  log.debug('[Cron] Starting overnight image generation job...');
  const startTime = Date.now();
  const results: GenerationResult[] = [];

  try {
    // Generate Intelligence content images
    const intelligenceResults = await generateMissingIntelligenceImages();
    results.push(...intelligenceResults);

    // Generate Academy course thumbnails
    const academyResults = await generateMissingCourseThumbnails();
    results.push(...academyResults);

    const duration = Date.now() - startTime;
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    log.debug(
      `[Cron] Completed in ${duration}ms. Generated ${succeeded} images, ${failed} failed.`
    );

    // Log the job execution
    await adminDb.collection('cron_jobs').add({
      job: 'generate-missing-images',
      timestamp: adminTimestamp.now(),
      duration,
      results: {
        total: results.length,
        succeeded,
        failed,
      },
      details: results,
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${succeeded} images, ${failed} failed`,
      duration: `${duration}ms`,
      results,
    });
  } catch (error) {
    log.error('[Cron] Error in image generation job:', error);
    return NextResponse.json(
      {
        error: 'Image generation job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate images for Intelligence content missing them
 */
async function generateMissingIntelligenceImages(): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const [contentType, dir] of Object.entries(TYPE_DIRS)) {
    const dirPath = path.join(CONTENT_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.mdx'));

    for (const file of files) {
      const slug = file.replace('.mdx', '');
      const filePath = path.join(dirPath, file);

      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(fileContent);

        // Skip if already has an image
        if (frontmatter.image) continue;

        log.debug(`[Cron] Generating image for Intelligence: ${slug}`);

        // Use content-type-specific style
        const style = getStyleForContentType(contentType);

        const result = await generateArticleImage({
          title: frontmatter.title,
          description: frontmatter.description,
          contentType: contentType as ContentType,
          tags: frontmatter.tags || [],
          style,
        });

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

        results.push({
          id: slug,
          title: frontmatter.title,
          type: 'intelligence',
          success: true,
        });

        log.debug(`[Cron] Successfully generated image for: ${slug}`);
      } catch (error) {
        log.error(`[Cron] Error generating image for ${slug}:`, error);
        results.push({
          id: slug,
          title: slug,
          type: 'intelligence',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return results;
}

/**
 * Generate thumbnails for Academy courses missing them
 */
async function generateMissingCourseThumbnails(): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];

  try {
    // Get all courses without thumbnails
    const snapshot = await adminDb.collection('courses').get();
    const coursesNeedingThumbnails: {
      id: string;
      title: string;
      description: string;
      topic: string;
      domain?: string;
      targetAudience?: string;
    }[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data && !data.metadata?.thumbnailUrl) {
        coursesNeedingThumbnails.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          topic: data.topic,
          domain: data.domain,
          targetAudience: data.targetAudience,
        });
      }
    });

    if (coursesNeedingThumbnails.length === 0) {
      log.debug('[Cron] All courses have thumbnails');
      return results;
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      log.error('[Cron] Firebase Storage bucket not configured');
      return results;
    }

    const bucket = adminStorage.bucket(bucketName);
    const style = getStyleForContentType('course');

    for (const course of coursesNeedingThumbnails) {
      try {
        log.debug(`[Cron] Generating thumbnail for course: ${course.id}`);

        const result = await generateArticleImage({
          title: course.title,
          description: course.description,
          contentType: 'publication',
          tags: [course.topic, course.domain, course.targetAudience].filter(Boolean) as string[],
          style,
        });

        // Upload to Firebase Storage
        const filename = `academy/thumbnails/${course.id}-${uuidv4().slice(0, 8)}.png`;
        const file = bucket.file(filename);
        const imageBuffer = Buffer.from(result.imageBase64, 'base64');

        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/png',
            metadata: {
              courseId: course.id,
              generatedAt: new Date().toISOString(),
              generatedBy: 'cron',
            },
          },
        });

        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

        // Update course metadata
        await adminDb.collection('courses').doc(course.id).update({
          'metadata.thumbnailUrl': publicUrl,
          'metadata.thumbnailAlt': result.alt,
          updatedAt: adminTimestamp.now(),
        });

        results.push({
          id: course.id,
          title: course.title,
          type: 'academy',
          success: true,
        });

        log.debug(`[Cron] Successfully generated thumbnail for course: ${course.id}`);
      } catch (error) {
        log.error(`[Cron] Error generating thumbnail for course ${course.id}:`, error);
        results.push({
          id: course.id,
          title: course.title,
          type: 'academy',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  } catch (error) {
    log.error('[Cron] Error fetching courses:', error);
  }

  return results;
}

/**
 * POST handler for manual triggering
 */
export async function POST(request: NextRequest) {
  // Same logic as GET but can be triggered manually from admin
  return GET(request);
}
