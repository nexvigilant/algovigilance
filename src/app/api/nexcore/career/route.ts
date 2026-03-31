import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roles = searchParams.get('roles');
  const threshold = searchParams.get('threshold');
  const includeSalary = searchParams.get('include_salary') || 'true';

  const params = new URLSearchParams();
  if (roles) params.set('roles', roles);
  if (threshold) params.set('threshold', threshold);
  params.set('include_salary', includeSalary);

  const res = await fetch(
    `${NEXCORE_API_URL}/api/v1/career/transitions?${params.toString()}`,
    { headers: { 'Content-Type': 'application/json' } }
  ).then(async (r) => ({ data: await r.json(), status: r.status }));

  return NextResponse.json(res.data, { status: res.status });
}
