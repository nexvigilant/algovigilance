'use server';

import { randomBytes } from 'crypto';
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type { Timestamp } from 'firebase/firestore';
import type { Certificate } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('certificates/actions');

/**
 * Generate a unique, cryptographically secure certificate number
 * Uses crypto.randomBytes for unpredictable, non-enumerable IDs
 * Format: NVA-XXXXXXXXXXXX (12 hex chars = 48 bits of entropy)
 */
function generateCertificateNumber(): string {
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `NVA-${random}`;
}

/**
 * Generate verification URL for certificate
 */
function generateVerificationUrl(certificateId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.com';
  return `${baseUrl}/verify/certificate/${certificateId}`;
}

/**
 * Create a certificate for a completed course
 */
export async function generateCertificate(
  userId: string,
  courseId: string
): Promise<Certificate | null> {
  try {
    // Check if certificate already exists
    const existingCerts = await adminDb
      .collection('certificates')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .where('isRevoked', '==', false)
      .get();

    if (!existingCerts.empty) {
      // Return existing certificate
      const doc = existingCerts.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Certificate;
    }

    // Create new certificate
    const certificateNumber = generateCertificateNumber();
    // Cast Admin SDK timestamp to Client SDK type (structurally compatible)
    const certificateData: Omit<Certificate, 'id' | 'verificationUrl'> = {
      userId,
      courseId,
      certificateNumber,
      issuedAt: adminTimestamp.now() as unknown as Timestamp,
      isRevoked: false
    };

    const docRef = await adminDb.collection('certificates').add(certificateData);

    const certificate: Certificate = {
      id: docRef.id,
      ...certificateData,
      verificationUrl: generateVerificationUrl(docRef.id)
    };

    // Update the certificate document with verification URL
    await docRef.update({
      verificationUrl: certificate.verificationUrl
    });

    return certificate;
  } catch (error) {
    log.error('Error generating certificate:', error);
    return null;
  }
}

/**
 * Get a certificate by ID
 */
export async function getCertificateById(certificateId: string): Promise<Certificate | null> {
  try {
    const certDoc = await adminDb.collection('certificates').doc(certificateId).get();

    if (!certDoc.exists) {
      return null;
    }

    return {
      id: certDoc.id,
      ...certDoc.data()
    } as Certificate;
  } catch (error) {
    log.error('Error fetching certificate:', error);
    return null;
  }
}

/**
 * Verify a certificate by certificate number
 */
export async function verifyCertificate(
  certificateNumber: string
): Promise<{ valid: boolean; certificate: Certificate | null }> {
  try {
    const snapshot = await adminDb
      .collection('certificates')
      .where('certificateNumber', '==', certificateNumber)
      .where('isRevoked', '==', false)
      .get();

    if (snapshot.empty) {
      return { valid: false, certificate: null };
    }

    const doc = snapshot.docs[0];
    const certificate: Certificate = {
      id: doc.id,
      ...doc.data()
    } as Certificate;

    // Check if certificate has expired
    if (certificate.expiresAt && certificate.expiresAt.toMillis() < Date.now()) {
      return { valid: false, certificate };
    }

    return { valid: true, certificate };
  } catch (error) {
    log.error('Error verifying certificate:', error);
    return { valid: false, certificate: null };
  }
}

/**
 * Revoke a certificate
 */
export async function revokeCertificate(certificateId: string): Promise<boolean> {
  try {
    await adminDb.collection('certificates').doc(certificateId).update({
      isRevoked: true
    });
    return true;
  } catch (error) {
    log.error('Error revoking certificate:', error);
    return false;
  }
}
