import { type NextRequest, NextResponse } from 'next/server';
import { exchangeGCalCode } from '@/lib/actions/gcal-sync';

/**
 * OAuth2 callback handler for Google Calendar connection.
 * Google redirects here after user consents.
 *
 * GET /api/circles-org/gcal/callback?code=...&state=circleId
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const circleId = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/nucleus/community/circles/${circleId ?? 'unknown'}?gcal=error&reason=${error}`, request.url),
    );
  }

  if (!code || !circleId) {
    return NextResponse.redirect(
      new URL('/nucleus/community/circles?gcal=error&reason=missing_params', request.url),
    );
  }

  try {
    await exchangeGCalCode(circleId, code);
    return NextResponse.redirect(
      new URL(`/nucleus/community/circles/${circleId}?tab=settings&gcal=connected`, request.url),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.redirect(
      new URL(`/nucleus/community/circles/${circleId}?tab=settings&gcal=error&reason=${encodeURIComponent(msg)}`, request.url),
    );
  }
}
