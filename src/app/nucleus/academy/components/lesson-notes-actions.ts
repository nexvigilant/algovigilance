'use server';


import { logger } from '@/lib/logger';
const log = logger.scope('components/lesson-notes-actions');
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import type { LessonNote } from '@/types/academy';

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
 * Fetch all notes for a specific lesson by the current user.
 */
export async function getLessonNotes(
  courseId: string,
  lessonId: string
): Promise<LessonNote[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[getLessonNotes] No authenticated user');
      return [];
    }

    const notesRef = adminDb.collection('lesson_notes');
    const q = notesRef
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .where('lessonId', '==', lessonId)
      .orderBy('createdAt', 'desc');

    const snapshot = await q.get();
    const notes: LessonNote[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as LessonNote[];

    return notes;
  } catch (error) {
    log.error('[getLessonNotes] Error fetching notes:', error);
    return [];
  }
}

/**
 * Create a new note for a lesson.
 */
export async function createLessonNote(params: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  content: string;
  videoTimestamp?: number;
}): Promise<LessonNote | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[createLessonNote] No authenticated user');
      return null;
    }

    const { courseId, lessonId, lessonTitle, courseTitle, content, videoTimestamp } = params;

    const noteData = {
      userId,
      courseId,
      lessonId,
      lessonTitle,
      courseTitle,
      content: content.trim(),
      videoTimestamp: videoTimestamp ?? null,
      createdAt: now(),
      updatedAt: now(),
    };

    const notesRef = adminDb.collection('lesson_notes');
    const docRef = await notesRef.add(noteData);

    log.debug('[createLessonNote] Note created:', docRef.id);

    return {
      id: docRef.id,
      ...noteData,
    } as LessonNote;
  } catch (error) {
    log.error('[createLessonNote] Error creating note:', error);
    return null;
  }
}

/**
 * Update an existing note.
 */
export async function updateLessonNote(
  noteId: string,
  content: string
): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[updateLessonNote] No authenticated user');
      return false;
    }

    const noteRef = adminDb.collection('lesson_notes').doc(noteId);

    await noteRef.update({
      content: content.trim(),
      updatedAt: now(),
    });

    log.debug('[updateLessonNote] Note updated:', noteId);
    return true;
  } catch (error) {
    log.error('[updateLessonNote] Error updating note:', error);
    return false;
  }
}

/**
 * Delete a note.
 */
export async function deleteLessonNote(noteId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[deleteLessonNote] No authenticated user');
      return false;
    }

    const noteRef = adminDb.collection('lesson_notes').doc(noteId);
    await noteRef.delete();

    log.debug('[deleteLessonNote] Note deleted:', noteId);
    return true;
  } catch (error) {
    log.error('[deleteLessonNote] Error deleting note:', error);
    return false;
  }
}

/**
 * Get all notes for a user across all courses (for portfolio/export).
 */
export async function getAllUserNotes(): Promise<LessonNote[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[getAllUserNotes] No authenticated user');
      return [];
    }

    const notesRef = adminDb.collection('lesson_notes');
    const q = notesRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    const snapshot = await q.get();
    const notes: LessonNote[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as LessonNote[];

    return notes;
  } catch (error) {
    log.error('[getAllUserNotes] Error fetching notes:', error);
    return [];
  }
}
