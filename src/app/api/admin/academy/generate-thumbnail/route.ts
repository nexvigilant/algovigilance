import { type NextRequest, NextResponse } from 'next/server';
import { generateArticleImage } from '@/lib/ai/flows/generate-article-image';
import { adminDb, adminStorage, adminTimestamp } from '@/lib/firebase-admin';
import { getStyleForContentType, type ImageStyle } from '@/lib/config/image-style-presets';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('generate-thumbnail/route');

interface GenerateThumbnailRequest {
  courseId: string;
  style?: ImageStyle;
}

/**
 * POST /api/admin/academy/generate-thumbnail
 * Generate a thumbnail image for an Academy course
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const body: GenerateThumbnailRequest = await request.json();
    const { courseId, style: requestedStyle } = body;
    // Use course-specific default style if no style requested
    const style = requestedStyle || getStyleForContentType('course');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Get course from Firestore
    const courseDoc = await adminDb.collection('courses').doc(courseId).get();

    if (!courseDoc.exists) {
      return NextResponse.json(
        { error: `Course not found: ${courseId}` },
        { status: 404 }
      );
    }

    const course = courseDoc.data();
    if (!course) {
      return NextResponse.json(
        { error: 'Course data is empty' },
        { status: 404 }
      );
    }

    // Generate the thumbnail image using course-appropriate style
    const result = await generateArticleImage({
      title: course.title,
      description: course.description,
      contentType: 'publication', // Maps to educational/professional visual style
      tags: [course.topic, course.domain, course.targetAudience].filter(Boolean),
      style, // Uses course preset default from image-style-presets.ts
    });

    // Upload to Firebase Storage
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error('Firebase Storage bucket not configured');
    }

    const bucket = adminStorage.bucket(bucketName);
    const filename = `academy/thumbnails/${courseId}-${uuidv4().slice(0, 8)}.png`;
    const file = bucket.file(filename);

    const imageBuffer = Buffer.from(result.imageBase64, 'base64');

    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          courseId,
          generatedAt: new Date().toISOString(),
          style,
        },
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

    // Update course metadata with the new thumbnail URL
    await adminDb.collection('courses').doc(courseId).update({
      'metadata.thumbnailUrl': publicUrl,
      'metadata.thumbnailAlt': result.alt,
      updatedAt: adminTimestamp.now(),
    });

    return NextResponse.json({
      success: true,
      courseId,
      title: course.title,
      thumbnailUrl: publicUrl,
      alt: result.alt,
      prompt: result.prompt,
    });
  } catch (error) {
    // Handle auth errors with 401 status
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    log.error('Error generating course thumbnail:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate thumbnail',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
