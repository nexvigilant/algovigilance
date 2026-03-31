import { type NextRequest, NextResponse } from 'next/server';
import { proxyCatchAll } from '@/lib/nexcore-proxy';

/**
 * DELETE /api/nexcore/guardian/keys/{key_id}
 * Proxies to nexcore-api DELETE /api/v1/guardian/keys/{key_id}
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ key_id: string }> },
) {
    const { key_id } = await context.params;
    if (!key_id) {
        return NextResponse.json({ error: 'key_id is required' }, { status: 400 });
    }
    return proxyCatchAll(`/api/v1/guardian/keys/${key_id}`, request);
}
