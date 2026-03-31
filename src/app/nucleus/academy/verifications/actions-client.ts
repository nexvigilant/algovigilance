'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { Certificate, Course } from '@/types/academy';

import { logger } from '@/lib/logger';
import { toMillisFromSerialized } from '@/types/academy';
const log = logger.scope('certificates/actions-client');

/**
 * Get all non-revoked certificates for a user
 */
export async function getCertificatesByUser(userId: string): Promise<Certificate[]> {
  try {
    // Use Admin SDK to bypass security rules (server-side operation)
    const snapshot = await adminDb
      .collection('certificates')
      .where('userId', '==', userId)
      .where('isRevoked', '==', false)
      .get();

    const certificates = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        let courseTitle: string | undefined;
        let courseThumbnail: string | undefined;

        // Fetch course details for each certificate
        try {
          const courseDoc = await adminDb.collection('courses').doc(data.courseId).get();
          if (courseDoc.exists) {
            const courseData = courseDoc.data() as Course;
            // Get course title for display
            courseTitle = courseData.title;
            courseThumbnail = courseData.metadata?.thumbnailUrl;
          }
        } catch (err) {
          log.error('[getCertificatesByUser] Error fetching course:', err);
        }

        // Build certificate with course details
        const cert: Certificate = {
          id: docSnapshot.id,
          ...data,
          courseTitle,
          courseThumbnail,
        } as Certificate;

        return cert;
      })
    );

    // Sort by issued date, newest first
    return certificates.sort((a, b) => {
      const aTime = toMillisFromSerialized(a.issuedAt) ?? 0;
      const bTime = toMillisFromSerialized(b.issuedAt) ?? 0;
      return bTime - aTime;
    });
  } catch (error) {
    log.error('[getCertificatesByUser] Error fetching certificates:', error);
    return [];
  }
}

/**
 * Get certificate details with course info
 */
export async function getCertificateDetails(
  certificateId: string
): Promise<(Certificate & { courseTitle?: string; courseThumbnail?: string }) | null> {
  try {
    const certDoc = await adminDb.collection('certificates').doc(certificateId).get();

    if (!certDoc.exists) {
      return null;
    }

    const cert = {
      id: certDoc.id,
      ...certDoc.data()
    } as Certificate;

    // Fetch course details
    try {
      const courseDoc = await adminDb.collection('courses').doc(cert.courseId).get();
      if (courseDoc.exists) {
        const courseData = courseDoc.data() as Course;
        return {
          ...cert,
          courseTitle: courseData.title,
          courseThumbnail: courseData.metadata?.thumbnailUrl
        };
      }
    } catch (err) {
      log.error('[getCertificateDetails] Error fetching course:', err);
    }

    return cert;
  } catch (error) {
    log.error('[getCertificateDetails] Error fetching certificate:', error);
    return null;
  }
}
