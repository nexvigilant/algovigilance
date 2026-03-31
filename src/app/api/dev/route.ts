import { NextResponse } from 'next/server';

/**
 * GET /api/dev
 *
 * Dev tools index. Lists available dev-only endpoints.
 * Returns 404 in production.
 */
export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    endpoints: [
      {
        path: '/api/dev/signals',
        method: 'GET',
        description: 'Dev signal aggregation digest — poor CWV, runtime errors, auth gaps, slow renders',
        params: {
          clear: 'Reset signals after reading (true/false)',
          window: 'Override sliding window in minutes (default: 5)',
        },
      },
    ],
  });
}
