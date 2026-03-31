import { NextResponse } from 'next/server';
import { getPDCHierarchy } from '@/lib/actions/pdc';
import { requireAdmin } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('route');

/**
 * GET /api/admin/pdc/hierarchy
 *
 * Returns the complete PDC hierarchy for tree display
 */
export async function GET() {
  try {
    await requireAdmin();
    const hierarchy = await getPDCHierarchy();
    return NextResponse.json(hierarchy);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    log.error('Error fetching PDC hierarchy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hierarchy' },
      { status: 500 }
    );
  }
}
