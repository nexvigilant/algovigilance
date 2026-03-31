import { type NextRequest, NextResponse } from 'next/server';
import { generateArticleImage } from '@/lib/ai/flows/generate-article-image';
import { adminDb, adminStorage, adminTimestamp } from '@/lib/firebase-admin';
import { getStyleForContentType, type ImageStyle } from '@/lib/config/image-style-presets';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '@/lib/admin-auth';
import { batchProcess } from '@/lib/parallel-utils';

import { logger } from '@/lib/logger';
const log = logger.scope('generate-thumbnails-bulk/route');

interface BulkGenerateRequest {
  courseIds?: string[]; // If not provided, generates for all courses without thumbnails
  style?: ImageStyle;
}

interface GenerationResult {
  courseId: string;
  title: string;
  success: boolean;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * POST /api/admin/academy/generate-thumbnails-bulk
 * Bulk generate thumbnails for Academy courses
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const body: BulkGenerateRequest = await request.json();
    const { courseIds, style: requestedStyle } = body;
    // Use course-specific default style if no style requested
    const style = requestedStyle || getStyleForContentType('course');

    // Get courses to process
    let coursesToProcess: { id: string; title: string; description: string; topic: string; domain?: string; targetAudience?: string }[] = [];

    if (courseIds && courseIds.length > 0) {
      // Get specific courses
      for (const courseId of courseIds) {
        const doc = await adminDb.collection('courses').doc(courseId).get();
        if (doc.exists) {
          const data = doc.data();
          if (data) {
            coursesToProcess.push({
              id: doc.id,
              title: data.title,
              description: data.description,
              topic: data.topic,
              domain: data.domain,
              targetAudience: data.targetAudience,
            });
          }
        }
      }
    } else {
      // Get all courses without thumbnails
      const snapshot = await adminDb.collection('courses').get();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data && !data.metadata?.thumbnailUrl) {
          coursesToProcess.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            topic: data.topic,
            domain: data.domain,
            targetAudience: data.targetAudience,
          });
        }
      });
    }

    if (coursesToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No courses need thumbnail generation',
        results: [],
        summary: { total: 0, succeeded: 0, failed: 0 },
      });
    }

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error('Firebase Storage bucket not configured');
    }

    const bucket = adminStorage.bucket(bucketName);

    // ⚡ PERFORMANCE: Process courses in parallel with concurrency limit
    // AI image generation is slow (~2-5s each), so we limit to 3 concurrent
    // to avoid API rate limits while still achieving significant speedup
    const batchResults = await batchProcess(
      coursesToProcess,
      async (course): Promise<GenerationResult> => {
        // Generate the thumbnail image
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
              style,
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

        return {
          courseId: course.id,
          title: course.title,
          success: true,
          thumbnailUrl: publicUrl,
        };
      },
      {
        concurrency: 3, // Limit concurrent AI generations
        continueOnError: true, // Process all courses even if some fail
        label: 'bulk-thumbnail-generation',
      }
    );

    // Transform batch results into GenerationResult array
    const results = batchResults.map((result, index): GenerationResult => {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
      // Handle rejected results
      const course = coursesToProcess[index];
      log.error(`Error generating thumbnail for course ${course.id}:`, result.reason);
      return {
        courseId: course.id,
        title: course.title,
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    });

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Generated ${succeeded} thumbnails, ${failed} failed`,
      results,
      summary: {
        total: results.length,
        succeeded,
        failed,
      },
    });
  } catch (error) {
    // Handle auth errors with 401 status
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    log.error('Error in bulk thumbnail generation:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate thumbnails',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/academy/generate-thumbnails-bulk
 * Get count of courses needing thumbnails
 * Requires admin authentication
 */
export async function GET() {
  try {
    // Verify admin authentication
    await requireAdmin();

    const snapshot = await adminDb.collection('courses').get();

    let totalCourses = 0;
    let withThumbnails = 0;
    let withoutThumbnails = 0;
    const coursesNeedingThumbnails: { id: string; title: string }[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data) {
        totalCourses++;
        if (data.metadata?.thumbnailUrl) {
          withThumbnails++;
        } else {
          withoutThumbnails++;
          coursesNeedingThumbnails.push({
            id: doc.id,
            title: data.title,
          });
        }
      }
    });

    return NextResponse.json({
      totalCourses,
      withThumbnails,
      withoutThumbnails,
      coursesNeedingThumbnails,
    });
  } catch (error) {
    // Handle auth errors with 401 status
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    log.error('Error getting thumbnail stats:', error);
    return NextResponse.json(
      { error: 'Failed to get thumbnail stats' },
      { status: 500 }
    );
  }
}
