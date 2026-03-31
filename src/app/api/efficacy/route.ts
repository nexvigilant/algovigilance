import { NextResponse } from "next/server"

// This route requires better-sqlite3 (local brain.db access).
// On Vercel, it returns a stub response since brain.db doesn't exist.

export const dynamic = "force-dynamic"

interface EfficacyRow {
  drug: string
  event: string
  measured_at: string
  prr: number | null
  ror: number | null
  case_count: number | null
  anti_vector_magnitude: number | null
  annihilation_outcome: string | null
  delta_prr: number | null
}

interface LabelDriftRow {
  drug: string
  measured_at: string
  adr_changed: number
  warnings_changed: number
  boxed_changed: number
}

export async function GET() {
  // Check if we're in a local environment with brain.db access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Database: any
  try {
    // eslint-disable-next-line no-eval
    Database = (await eval('import("better-sqlite3")')).default
  } catch {
    return NextResponse.json({
      signals: [],
      timeSeries: {},
      labelDrift: [],
      totalMeasurements: 0,
      generatedAt: new Date().toISOString(),
      note: "Efficacy data only available in local development (requires brain.db)",
    })
  }

  try {
    const path = await import("path")
    const os = await import("os")
    const BRAIN_DB = path.join(os.homedir(), ".claude", "brain", "brain.db")
    const db = new Database(BRAIN_DB, { readonly: true })

    const signals = db
      .prepare(
        `SELECT e1.drug, e1.event, e1.measured_at, e1.prr, e1.ror,
                e1.case_count, e1.anti_vector_magnitude, e1.annihilation_outcome, e1.delta_prr
         FROM antivector_efficacy e1
         INNER JOIN (
           SELECT drug, event, MAX(measured_at) as max_at
           FROM antivector_efficacy
           GROUP BY drug, event
         ) e2 ON e1.drug = e2.drug AND e1.event = e2.event AND e1.measured_at = e2.max_at
         ORDER BY e1.drug, e1.prr DESC`
      )
      .all() as EfficacyRow[]

    const timeSeries = db
      .prepare(
        `SELECT drug, event, measured_at, prr, delta_prr
         FROM antivector_efficacy
         WHERE measured_at > datetime('now', '-30 days')
         ORDER BY drug, event, measured_at`
      )
      .all() as EfficacyRow[]

    const labelDrift = db
      .prepare(
        `SELECT l1.drug, l1.measured_at, l1.adr_changed, l1.warnings_changed, l1.boxed_changed
         FROM label_drift_tracker l1
         INNER JOIN (
           SELECT drug, MAX(measured_at) as max_at
           FROM label_drift_tracker
           GROUP BY drug
         ) l2 ON l1.drug = l2.drug AND l1.measured_at = l2.max_at`
      )
      .all() as LabelDriftRow[]

    const countRow = db
      .prepare("SELECT COUNT(*) as total FROM antivector_efficacy")
      .get() as { total: number }

    db.close()

    const seriesMap: Record<string, { date: string; prr: number }[]> = {}
    for (const row of timeSeries) {
      const key = `${row.drug}:${row.event}`
      if (!seriesMap[key]) seriesMap[key] = []
      seriesMap[key].push({
        date: row.measured_at,
        prr: row.prr ?? 0,
      })
    }

    return NextResponse.json({
      signals,
      timeSeries: seriesMap,
      labelDrift,
      totalMeasurements: countRow.total,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to query efficacy data", detail: message },
      { status: 500 }
    )
  }
}
