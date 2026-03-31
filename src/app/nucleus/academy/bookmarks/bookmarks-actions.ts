'use server';


import { logger } from '@/lib/logger';
const log = logger.scope('bookmarks/bookmarks-actions');
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import type { LessonBookmark } from '@/types/academy';

// Helper to cast admin Timestamp to client Timestamp for type compatibility
const now = () => adminTimestamp.now() as unknown as ClientTimestamp;

/**
 * Get the current user's ID from session cookie.
 * Returns null if not authenticated.
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return null;
    }

    // The session cookie contains the Firebase ID token
    // For server actions, we decode the JWT to get the user ID
    // The token is base64 encoded with 3 parts: header.payload.signature
    const parts = sessionCookie.value.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.user_id || payload.sub || null;
  } catch (error) {
    log.error('[getCurrentUserId] Error parsing session:', error);
    return null;
  }
}

/**
 * Fetch all bookmarks for the current user.
 */
export async function getUserBookmarks(): Promise<LessonBookmark[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[getUserBookmarks] No authenticated user');
      return [];
    }

    const bookmarksRef = adminDb.collection('lesson_bookmarks');
    const q = bookmarksRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    const snapshot = await q.get();
    const bookmarks: LessonBookmark[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as LessonBookmark[];

    return bookmarks;
  } catch (error) {
    log.error('[getUserBookmarks] Error fetching bookmarks:', error);
    return [];
  }
}

/**
 * Check if a lesson is bookmarked by the current user.
 */
export async function isLessonBookmarked(
  courseId: string,
  lessonId: string
): Promise<{ bookmarked: boolean; bookmarkId?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { bookmarked: false };
    }

    const bookmarksRef = adminDb.collection('lesson_bookmarks');
    const q = bookmarksRef
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .where('lessonId', '==', lessonId);

    const snapshot = await q.get();
    if (snapshot.empty) {
      return { bookmarked: false };
    }

    return { bookmarked: true, bookmarkId: snapshot.docs[0].id };
  } catch (error) {
    log.error('[isLessonBookmarked] Error checking bookmark:', error);
    return { bookmarked: false };
  }
}

/**
 * Create a new bookmark.
 */
export async function createBookmark(params: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  note?: string;
}): Promise<LessonBookmark | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[createBookmark] No authenticated user');
      return null;
    }

    const { courseId, lessonId, lessonTitle, courseTitle, note } = params;

    // Check if already bookmarked
    const existing = await isLessonBookmarked(courseId, lessonId);
    if (existing.bookmarked) {
      log.debug('[createBookmark] Lesson already bookmarked');
      // Return existing bookmark
      if (!existing.bookmarkId) return null;
      const bookmarkRef = adminDb.collection('lesson_bookmarks').doc(existing.bookmarkId);
      const bookmarkDoc = await bookmarkRef.get();
      return {
        id: bookmarkDoc.id,
        ...bookmarkDoc.data(),
      } as LessonBookmark;
    }

    const bookmarkData = {
      userId,
      courseId,
      lessonId,
      lessonTitle,
      courseTitle,
      note: note?.trim() || null,
      createdAt: now(),
    };

    const bookmarksRef = adminDb.collection('lesson_bookmarks');
    const docRef = await bookmarksRef.add(bookmarkData);

    log.debug('[createBookmark] Bookmark created:', docRef.id);

    return {
      id: docRef.id,
      ...bookmarkData,
    } as LessonBookmark;
  } catch (error) {
    log.error('[createBookmark] Error creating bookmark:', error);
    return null;
  }
}

/**
 * Update a bookmark's note.
 */
export async function updateBookmarkNote(
  bookmarkId: string,
  note: string
): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[updateBookmarkNote] No authenticated user');
      return false;
    }

    const bookmarkRef = adminDb.collection('lesson_bookmarks').doc(bookmarkId);

    await bookmarkRef.update({
      note: note.trim() || null,
    });

    log.debug('[updateBookmarkNote] Bookmark updated:', bookmarkId);
    return true;
  } catch (error) {
    log.error('[updateBookmarkNote] Error updating bookmark:', error);
    return false;
  }
}

/**
 * Delete a bookmark.
 */
export async function deleteBookmark(bookmarkId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[deleteBookmark] No authenticated user');
      return false;
    }

    const bookmarkRef = adminDb.collection('lesson_bookmarks').doc(bookmarkId);
    await bookmarkRef.delete();

    log.debug('[deleteBookmark] Bookmark deleted:', bookmarkId);
    return true;
  } catch (error) {
    log.error('[deleteBookmark] Error deleting bookmark:', error);
    return false;
  }
}

/**
 * Toggle bookmark for a lesson (create if not exists, delete if exists).
 */
export async function toggleBookmark(params: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
}): Promise<{ bookmarked: boolean; bookmark?: LessonBookmark }> {
  try {
    const existing = await isLessonBookmarked(params.courseId, params.lessonId);

    if (existing.bookmarked && existing.bookmarkId) {
      // Remove bookmark
      const success = await deleteBookmark(existing.bookmarkId);
      return { bookmarked: !success };
    } else {
      // Create bookmark
      const bookmark = await createBookmark(params);
      return { bookmarked: !!bookmark, bookmark: bookmark || undefined };
    }
  } catch (error) {
    log.error('[toggleBookmark] Error toggling bookmark:', error);
    return { bookmarked: false };
  }
}
