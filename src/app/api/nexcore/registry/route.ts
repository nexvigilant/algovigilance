import { NextResponse } from 'next/server';

const KELLNR_URL = process.env.KELLNR_URL || 'https://crates.nexvigilant.com';

export async function GET() {
  try {
    // Kellnr API: list all crates
    const res = await fetch(`${KELLNR_URL}/api/v1/crates`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ crates: [], total: 0, error: `Kellnr returned ${res.status}` });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ crates: [], total: 0, error: 'Kellnr registry unavailable' });
  }
}
