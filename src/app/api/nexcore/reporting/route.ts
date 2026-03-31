import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

export async function GET() {
  try {
    const res = await fetch(`${NEXCORE_API_URL}/api/v1/reporting/list`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json({ reports: [] }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ reports: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${NEXCORE_API_URL}/api/v1/reporting/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `NexCore reporting error: ${res.status}` },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'NexCore API unavailable' },
      { status: 503 }
    );
  }
}
