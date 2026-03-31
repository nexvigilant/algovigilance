import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type { SeriesProgress, SeriesProgressSerialized } from '@/types/series';

import { logger } from '@/lib/logger';
const log = logger.scope('series-progress/route');

/**
 * Helper to serialize Firestore timestamps for JSON response.
 */
function serializeProgress(progress: SeriesProgress): SeriesProgressSerialized {
  return {
    ...progress,
    startedAt: {
      seconds: progress.startedAt.seconds,
      nanoseconds: progress.startedAt.nanoseconds,
    },
    lastReadAt: {
      seconds: progress.lastReadAt.seconds,
      nanoseconds: progress.lastReadAt.nanoseconds,
    },
    completedAt: progress.completedAt
      ? {
          seconds: progress.completedAt.seconds,
          nanoseconds: progress.completedAt.nanoseconds,
        }
      : undefined,
  };
}

/**
 * Get user ID from the nucleus_id_token cookie.
 */
async function getUserIdFromToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('nucleus_id_token');

    if (!tokenCookie?.value) {
      return null;
    }

    const decodedToken = await adminAuth.verifyIdToken(tokenCookie.value);
    return decodedToken.uid;
  } catch (error) {
    log.error('Error verifying token:', error);
    return null;
  }
}

/**
 * GET /api/series-progress?seriesSlug=xxx
 * Fetch user's progress for a specific series.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const seriesSlug = searchParams.get('seriesSlug');

    if (!seriesSlug) {
      return NextResponse.json(
        { error: 'Missing seriesSlug parameter' },
        { status: 400 }
      );
    }

    // Get user ID from Firebase token
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch progress from Firestore
    const progressRef = adminDb.collection('users').doc(userId).collection('series_progress').doc(seriesSlug);
    const progressSnap = await progressRef.get();

    if (!progressSnap.exists) {
      return NextResponse.json(
        { error: 'No progress found' },
        { status: 404 }
      );
    }

    const progress = progressSnap.data() as SeriesProgress;
    return NextResponse.json({ progress: serializeProgress(progress) });
  } catch (error) {
    log.error('Error fetching series progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/series-progress
 * Mark an article as read and update series progress.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seriesSlug, articleSlug, totalArticles } = body;

    if (!seriesSlug || !articleSlug || typeof totalArticles !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: seriesSlug, articleSlug, totalArticles' },
        { status: 400 }
      );
    }

    // Get user ID from Firebase token
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch existing progress or create new
    const progressRef = adminDb.collection('users').doc(userId).collection('series_progress').doc(seriesSlug);
    const progressSnap = await progressRef.get();

    let currentProgress: Partial<SeriesProgress>;

    if (progressSnap.exists) {
      currentProgress = progressSnap.data() as SeriesProgress;
    } else {
      // Initialize new progress
      currentProgress = {
        seriesSlug,
        userId,
        readSlugs: [],
        totalArticles,
        progress: 0,
        isCompleted: false,
        startedAt: adminTimestamp.now(),
      };
    }

    // Add article to read list if not already read
    const readSlugs = currentProgress.readSlugs || [];
    if (!readSlugs.includes(articleSlug)) {
      readSlugs.push(articleSlug);
    }

    // Calculate new progress
    const progressPercent = Math.round((readSlugs.length / totalArticles) * 100);
    const isCompleted = readSlugs.length >= totalArticles;

    // Update progress document
    const updatedProgress: SeriesProgress = {
      seriesSlug,
      userId,
      readSlugs,
      totalArticles,
      progress: progressPercent,
      isCompleted,
      startedAt: currentProgress.startedAt ?? adminTimestamp.now(),
      lastReadAt: adminTimestamp.now(),
      lastReadSlug: articleSlug,
      ...(isCompleted && !currentProgress.isCompleted
        ? { completedAt: adminTimestamp.now() }
        : { completedAt: currentProgress.completedAt }),
    };

    await progressRef.set(updatedProgress);

    return NextResponse.json({ progress: serializeProgress(updatedProgress) });
  } catch (error) {
    log.error('Error updating series progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
