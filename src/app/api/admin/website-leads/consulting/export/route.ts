import { type NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('route');
import {
  companyTypeLabels,
  companySizeLabels,
  categoryLabels,
  budgetLabels,
  timelineLabels,
  statusLabels,
  type ConsultingInquiry,
} from '@/app/nucleus/admin/website-leads/consulting/constants';
import { toDateFromSerialized } from '@/types/academy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ConsultingInquiryStatus = ConsultingInquiry['status'];

interface ConsultingInquiryDoc {
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string | null;
  companyName?: string;
  companyType?: string;
  companySize?: string;
  consultingCategory?: string;
  budgetRange?: string | null;
  timeline?: string;
  challengeDescription?: string;
  submittedAt?: FirebaseFirestore.Timestamp | null;
  status?: ConsultingInquiryStatus;
  leadScore?: number;
  notes?: string;
  source?: string;
}

/**
 * API Route: Stream Consulting Inquiries as CSV
 * SECURITY: Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authorization
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') || 'all';
    const categoryFilter = searchParams.get('category') || 'all';

    // 2. Fetch Data
    let query: FirebaseFirestore.Query<ConsultingInquiryDoc> = (adminDb.collection('consulting_inquiries') as FirebaseFirestore.Query<ConsultingInquiryDoc>)
      .orderBy('leadScore', 'desc')
      .orderBy('submittedAt', 'desc');

    if (statusFilter !== 'all') {
      query = query.where('status', '==', statusFilter);
    }
    if (categoryFilter !== 'all') {
      query = query.where('consultingCategory', '==', categoryFilter);
    }

    const snapshot = await query.get();

    // 3. Build CSV
    const headers = [
      'ID',
      'Status',
      'Lead Score',
      'First Name',
      'Last Name',
      'Email',
      'Job Title',
      'Company Name',
      'Company Type',
      'Company Size',
      'Consulting Category',
      'Budget Range',
      'Timeline',
      'Challenge Description',
      'Source',
      'Submitted At',
      'Notes',
    ];

    const escapeCSV = (value: unknown): string => {
      const str = String(value || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = snapshot.docs.map((docSnap) => {
      const inq = docSnap.data();
      const status = inq.status ?? '';
      const companyType = inq.companyType ?? '';
      const companySize = inq.companySize ?? '';
      const category = inq.consultingCategory ?? '';
      const budgetRange = inq.budgetRange ?? '';
      const timeline = inq.timeline ?? '';
      return [
        docSnap.id,
        statusLabels[status] || status,
        inq.leadScore?.toString() || '0',
        escapeCSV(inq.firstName),
        escapeCSV(inq.lastName),
        inq.email,
        escapeCSV(inq.jobTitle || ''),
        escapeCSV(inq.companyName),
        companyTypeLabels[companyType] || companyType,
        companySizeLabels[companySize] || companySize,
        categoryLabels[category] || category,
        budgetLabels[budgetRange] || budgetRange,
        timelineLabels[timeline] || timeline,
        escapeCSV(inq.challengeDescription),
        inq.source || '',
        toDateFromSerialized(inq.submittedAt)?.toISOString() || '',
        escapeCSV(inq.notes || ''),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // 4. Return Response
    const date = new Date().toISOString().split('T')[0];
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=consulting-leads-${date}.csv`,
      },
    });
  } catch (error) {
    log.error('[Export API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export leads' },
      { status: 500 }
    );
  }
}
