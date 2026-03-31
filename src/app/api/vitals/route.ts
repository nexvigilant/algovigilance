import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const BIOMETRICS_PATH = join(
  process.env.HOME ?? '/home/matthew',
  '.claude',
  'biometrics',
  'heartrate.json'
);

const DISCONNECTED = {
  status: 'disconnected',
  device: null,
  current_bpm: 0,
  accuracy: -1,
  updated_at: null,
  zone: 'unknown',
  stress_estimate: 'unknown',
  hrv_rmssd_ms: null,
  rr_count: 0,
  steps_today: 0,
  skin_temp_c: null,
  thermistor_c: null,
  pressure_hpa: null,
  activity_level: 0,
  on_wrist: false,
  founder_health: { recommendation: 'watch_disconnected' },
};

export async function GET() {
  try {
    const raw = await readFile(BIOMETRICS_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(DISCONNECTED, { status: 200 });
  }
}

/**
 * POST /api/vitals — Write biometric data (from watch bridge or external source).
 * Accepts the same BiometricData shape and writes to the local file.
 * The NexWatch Wear OS app can POST here, or the local bridge script can.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (typeof body.current_bpm !== 'number') {
      return NextResponse.json({ error: 'missing current_bpm' }, { status: 400 });
    }

    // Write to local file (the canonical store)
    const { writeFile, mkdir } = await import('fs/promises');
    const { dirname } = await import('path');
    await mkdir(dirname(BIOMETRICS_PATH), { recursive: true });
    await writeFile(BIOMETRICS_PATH, JSON.stringify(body, null, 2));

    return NextResponse.json({ ok: true, updated_at: body.updated_at });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'write failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
