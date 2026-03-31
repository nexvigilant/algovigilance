'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import type { Certificate } from '@/types/academy';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('certificates/actions');

export interface CertificateWithDetails extends Certificate {
  userName?: string;
  userEmail?: string;
  courseName?: string;
}

/**
 * Get all certificates (admin only)
 * SECURITY: Requires admin role
 */
export async function getAllCertificates(options?: {
  status?: 'all' | 'active' | 'revoked';
  limit?: number;
  searchTerm?: string;
}): Promise<{
  success: boolean;
  certificates?: CertificateWithDetails[];
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getAllCertificates] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    // Build query using Admin SDK syntax
    let queryRef = db.collection('certificates').orderBy('issuedAt', 'desc');

    // Filter by status
    if (options?.status === 'active') {
      queryRef = queryRef.where('isRevoked', '==', false);
    } else if (options?.status === 'revoked') {
      queryRef = queryRef.where('isRevoked', '==', true);
    }

    // Apply limit
    if (options?.limit) {
      queryRef = queryRef.limit(options.limit);
    }

    const snapshot = await queryRef.get();

    // Fetch user and course details for each certificate
    const certificatesWithDetails: CertificateWithDetails[] = await Promise.all(
      snapshot.docs.map(async (certDoc) => {
        const certData = certDoc.data();
        const certificate: CertificateWithDetails = {
          id: certDoc.id,
          userId: certData.userId,
          courseId: certData.courseId,
          certificateNumber: certData.certificateNumber,
          issuedAt: certData.issuedAt,
          expiresAt: certData.expiresAt,
          verificationUrl: certData.verificationUrl,
          isRevoked: certData.isRevoked,
        };

        // Fetch user details
        try {
          const userDoc = await db.collection('users').doc(certData.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            certificate.userName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Unknown User';
            certificate.userEmail = userData?.email;
          }
        } catch (err) {
          log.error('Error fetching user:', err);
          certificate.userName = 'Unknown User';
        }

        // Fetch course details
        try {
          const courseDoc = await db.collection('courses').doc(certData.courseId).get();
          if (courseDoc.exists) {
            const courseData = courseDoc.data();
            certificate.courseName = courseData?.title;
          }
        } catch (err) {
          log.error('Error fetching course:', err);
          certificate.courseName = 'Unknown Course';
        }

        return certificate;
      })
    );

    // Apply search filter (client-side for simplicity)
    let filteredCertificates = certificatesWithDetails;
    if (options?.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      filteredCertificates = certificatesWithDetails.filter(cert =>
        cert.certificateNumber.toLowerCase().includes(searchLower) ||
        cert.userName?.toLowerCase().includes(searchLower) ||
        cert.userEmail?.toLowerCase().includes(searchLower) ||
        cert.courseName?.toLowerCase().includes(searchLower)
      );
    }

    return {
      success: true,
      certificates: filteredCertificates,
    };
  } catch (error) {
    log.error('Error fetching certificates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch certificates',
    };
  }
}

/**
 * Toggle certificate revocation status (admin only)
 * SECURITY: Requires admin role
 */
export async function toggleCertificateRevocation(
  certificateId: string,
  revoke: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[toggleCertificateRevocation] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    await db.collection('certificates').doc(certificateId).update({
      isRevoked: revoke,
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating certificate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update certificate',
    };
  }
}

/**
 * Get certificate statistics (admin only)
 * SECURITY: Requires admin role
 */
export async function getCertificateStats(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    active: number;
    revoked: number;
    issuedThisMonth: number;
  };
  error?: string;
}> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[getCertificateStats] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const allCerts = await db.collection('certificates').get();

    const total = allCerts.size;
    const revoked = allCerts.docs.filter(doc => doc.data().isRevoked === true).length;
    const active = total - revoked;

    // Count certificates issued this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const issuedThisMonth = allCerts.docs.filter(doc => {
      const issuedAt = doc.data().issuedAt;
      if (!issuedAt) return false;
      // Handle both Firestore Timestamp and Date objects
      const issuedDate = issuedAt.toDate ? toDateFromSerialized(issuedAt) : new Date(issuedAt);
      return issuedDate >= monthStart;
    }).length;

    return {
      success: true,
      stats: {
        total,
        active,
        revoked,
        issuedThisMonth,
      },
    };
  } catch (error) {
    log.error('Error fetching certificate stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}
