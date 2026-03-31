import { NextRequest, NextResponse } from 'next/server'

const NEXCORE_API = process.env.NEXCORE_API_URL ?? 'http://localhost:3030'

interface ComputeVisualRequest {
  dataset: string
  nodes: Array<{ id: string; value?: number; group?: string }>
  edges: Array<{ source: string; target: string; weight?: number }>
}

interface ComputeVisualResponse {
  betweenness: Record<string, number>
  layout3d: Record<string, [number, number, number]>
  entropy: number
  glowCurve: number[]
}

async function mcpCall(tool: string, params: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${NEXCORE_API}/api/v1/mcp/${tool}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MCP ${tool} failed: ${res.status} ${text}`)
  }
  return res.json()
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as ComputeVisualRequest
    const { nodes, edges } = body

    if (!nodes?.length) {
      return NextResponse.json({ error: 'nodes required' }, { status: 400 })
    }

    const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]))
    const edgePairs = edges
      .map(e => {
        const s = nodeIndex.get(e.source)
        const t = nodeIndex.get(e.target)
        return s !== undefined && t !== undefined ? [s, t] : null
      })
      .filter((p): p is [number, number] => p !== null)

    // Batch MCP calls in parallel
    const [betweennessResult, layoutResult, entropyResult, glowCurveResults] =
      await Promise.allSettled([
        // 1. Betweenness centrality
        mcpCall('kellnr_compute_graph_betweenness', {
          edges: edgePairs,
          node_count: nodes.length,
        }),
        // 2. 3D Fruchterman-Reingold layout
        mcpCall('graph_layout_converge', {
          edges: edgePairs,
          node_count: nodes.length,
          dimensions: 3,
          iterations: 300,
        }),
        // 3. Shannon entropy of dataset groups
        mcpCall('kellnr_compute_stats_entropy', {
          probabilities: computeGroupProbabilities(nodes),
        }),
        // 4. Hill response curve (50 sample points)
        Promise.all(
          Array.from({ length: 50 }, (_, i) => i / 49).map(input =>
            mcpCall('chemistry_hill_response', {
              input,
              k_half: 0.5,
              n_hill: 2.5,
            })
          )
        ),
      ])

    const response: ComputeVisualResponse = {
      betweenness: extractBetweenness(betweennessResult, nodes),
      layout3d: extractLayout(layoutResult, nodes),
      entropy: extractEntropy(entropyResult),
      glowCurve: extractGlowCurve(glowCurveResults),
    }

    return NextResponse.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[compute-visual]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function computeGroupProbabilities(
  nodes: Array<{ id: string; group?: string }>,
): number[] {
  const counts = new Map<string, number>()
  for (const n of nodes) {
    const g = n.group ?? 'default'
    counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  return Array.from(counts.values()).map(c => c / nodes.length)
}

function extractBetweenness(
  result: PromiseSettledResult<unknown>,
  nodes: Array<{ id: string }>,
): Record<string, number> {
  if (result.status !== 'fulfilled') return {}
  const data = result.value as { normalized?: number[] } | undefined
  if (!data?.normalized) return {}
  const out: Record<string, number> = {}
  for (let i = 0; i < nodes.length && i < data.normalized.length; i++) {
    out[nodes[i].id] = data.normalized[i]
  }
  return out
}

function extractLayout(
  result: PromiseSettledResult<unknown>,
  nodes: Array<{ id: string }>,
): Record<string, [number, number, number]> {
  if (result.status !== 'fulfilled') return {}
  const data = result.value as { positions?: number[][] } | undefined
  if (!data?.positions) return {}
  const out: Record<string, [number, number, number]> = {}
  for (let i = 0; i < nodes.length && i < data.positions.length; i++) {
    const p = data.positions[i]
    if (p.length >= 3) {
      out[nodes[i].id] = [p[0], p[1], p[2]]
    }
  }
  return out
}

function extractEntropy(result: PromiseSettledResult<unknown>): number {
  if (result.status !== 'fulfilled') return 0
  const data = result.value as { entropy?: number } | undefined
  return data?.entropy ?? 0
}

function extractGlowCurve(result: PromiseSettledResult<unknown>): number[] {
  if (result.status !== 'fulfilled') return []
  const data = result.value as Array<{ output?: number }> | undefined
  if (!Array.isArray(data)) return []
  return data.map(d => d?.output ?? 0)
}
