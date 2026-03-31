/**
 * Live Signal Adapter — Maps FAERS API responses to Observatory graph format.
 *
 * Primary: AlgoVigilance Station cloud at mcp.nexvigilant.com (get_drug_counts).
 * Fallback: Local Rust `signal-graph` endpoint via /api/nexcore/faers.
 *
 * Signal strength is encoded via:
 *   - Node size: Stevens' Power Law (report count → perceptual radius)
 *   - Edge weight: disproportionality score (PRR)
 *   - Node color: OKLab signal strength mapping
 *   - dataType: CVD shape encoding (drug vs event vs signal)
 */

import type { GraphNode, GraphEdge } from '@/components/observatory'
import type { DataType } from '@/components/observatory/cvd-geometry'
import type { Dataset, DatasetStem } from './graph-datasets'

// ─── API Response Types ──────────────────────────────────────────────────────

interface FaersEventWithSignal {
  term: string
  count: number
  prr: number | null
  ror: number | null
  signal_detected: boolean
  case_count: number | null
}

interface FaersSignalGraphResponse {
  drug: string
  events: FaersEventWithSignal[]
  total_reports: number
  signal_count: number
}

/** Station REST envelope: body.content[0].text contains JSON */
interface StationToolResponse {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}

/** Shape returned inside Station get_drug_counts text payload */
interface StationCountResult {
  term: string
  count: number
}

// ─── Station Cloud Fetch ─────────────────────────────────────────────────────

const STATION_URL = 'https://mcp.nexvigilant.com'

async function fetchFromStation(
  drug: string,
  abortSignal?: AbortSignal,
): Promise<FaersSignalGraphResponse> {
  const res = await fetch(`${STATION_URL}/tools/api_fda_gov_get_drug_counts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      drug_name: drug,
      count_field: 'patient.reaction.reactionmeddrapt.exact',
    }),
    signal: abortSignal,
  })

  if (!res.ok) {
    throw new Error(`Station returned ${res.status}`)
  }

  const envelope: StationToolResponse = await res.json()

  if (envelope.isError) {
    const msg = envelope.content?.[0]?.text ?? 'Station tool error'
    throw new Error(msg)
  }

  const innerJson = envelope.content?.[0]?.text
  if (!innerJson) {
    throw new Error('Empty Station response')
  }

  const parsed = JSON.parse(innerJson)

  // Station returns { results: [{term, count}, ...] } or [{term, count}, ...]
  const counts: StationCountResult[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.results)
      ? parsed.results
      : []

  // Take top 15 by count
  const top = counts.slice(0, 15)
  const totalReports = top.reduce((sum, e) => sum + e.count, 0)

  // Transform to expected shape — no PRR/ROR from count endpoint alone
  const events: FaersEventWithSignal[] = top.map((item) => ({
    term: item.term,
    count: item.count,
    prr: null,
    ror: null,
    signal_detected: false,
    case_count: null,
  }))

  return {
    drug,
    events,
    total_reports: totalReports,
    signal_count: 0,
  }
}

// ─── Fallback: Local NexCore API ─────────────────────────────────────────────

async function fetchFromNexcore(
  drug: string,
  abortSignal?: AbortSignal,
): Promise<FaersSignalGraphResponse> {
  const res = await fetch(
    `/api/nexcore/faers?action=signal-graph&drug=${encodeURIComponent(drug)}&limit=15&signal_top_n=5`,
    { signal: abortSignal },
  )

  if (!res.ok) {
    throw new Error(`FAERS returned ${res.status}`)
  }

  return res.json()
}

// ─── Signal Colors by Strength ────────────────────────────────────────────────

function signalColor(prr: number | null, isSignal: boolean): string {
  if (!isSignal || prr === null) return '#7B95B5'   // slate — no signal
  if (prr >= 5.0)  return '#ef4444' // red — strong signal
  if (prr >= 3.0)  return '#f97316' // orange — moderate
  if (prr >= 2.0)  return '#eab308' // gold — threshold
  return '#7B95B5'
}

// ─── Build Observatory Dataset from FAERS Data ───────────────────────────────

export async function buildSignalDataset(
  drug: string,
  signal?: AbortSignal,
): Promise<Dataset> {
  // Primary: Station cloud. Fallback: local nexcore-api.
  let data: FaersSignalGraphResponse
  try {
    data = await fetchFromStation(drug, signal)
  } catch {
    // Station unavailable or error — fall back to local Rust endpoint
    data = await fetchFromNexcore(drug, signal)
  }

  if (data.events.length === 0) {
    throw new Error(`No FAERS data found for "${drug}"`)
  }

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Drug node (central hub)
  nodes.push({
    id: 'drug-center',
    label: drug,
    group: 'service',
    value: 2.5,
    color: '#06b6d4',
    dataType: 'drug' as DataType,
  })

  // Max count for size normalization
  const maxCount = Math.max(...data.events.map(e => e.count), 1)

  // Build event nodes
  for (let i = 0; i < data.events.length; i++) {
    const ev = data.events[i]
    const nodeId = `ae-${i}`
    const normalizedValue = 0.5 + (ev.count / maxCount) * 2.0

    nodes.push({
      id: nodeId,
      label: ev.term,
      group: ev.signal_detected ? 'orchestration' : 'domain',
      value: normalizedValue,
      color: signalColor(ev.prr, ev.signal_detected),
      dataType: 'event' as DataType,
    })

    // Edge from drug to event
    edges.push({
      source: 'drug-center',
      target: nodeId,
      weight: ev.signal_detected ? Math.min(ev.prr ?? 1, 5) : 1.0,
      label: `${ev.count.toLocaleString()} reports`,
    })

    // If signal detected with PRR/ROR, add algorithm indicator nodes
    if (ev.signal_detected) {
      const algos: { key: string; value: number | null }[] = [
        { key: 'PRR', value: ev.prr },
        { key: 'ROR', value: ev.ror },
      ]

      for (const algo of algos) {
        if (algo.value === null) continue
        const algoId = `signal-${i}-${algo.key.toLowerCase()}`

        // Reuse existing algorithm node if present
        const existingAlgo = nodes.find(n => n.label === algo.key && n.group === 'foundation')
        const targetId = existingAlgo?.id ?? algoId

        if (!existingAlgo) {
          nodes.push({
            id: algoId,
            label: algo.key,
            group: 'foundation',
            value: 1.0,
            dataType: 'signal' as DataType,
          })
        }

        edges.push({
          source: nodeId,
          target: targetId,
          weight: 1.5,
          label: `${algo.value.toFixed(2)}`,
        })
      }
    }
  }

  const stem: DatasetStem = {
    trait: 'Classify',
    domain: 'Science',
    t1: 'μ Mapping',
    transfer: 'Drug→Event→Signal — FAERS adverse event pairs classified by disproportionality (PRR, ROR)',
    crate: 'stem-core',
    tools: ['faers_signal_graph', 'pv_signal_complete'],
  }

  return {
    label: `FAERS: ${drug}`,
    description: `Live FDA Adverse Event Reporting System data for ${drug}. ${data.events.length} adverse events, ${data.signal_count} signals detected. Node color indicates signal strength.`,
    nodes,
    edges,
    dimension: 3,
    stem,
  }
}
