/**
 * Crate Registry Data Access
 *
 * Static manifest access (always available) + optional Kellnr enrichment.
 * Import the manifest at build time for zero-latency access.
 */

import manifestData from '@/data/crate-manifest.json';
import toolMappingData from '@/data/crate-tool-mapping.json';
import type { CrateRecord, CrateManifest, CrateLayer } from '@/types/crate-registry';

const manifest = manifestData as CrateManifest;
const toolMapping = toolMappingData as Record<string, string[]>;

/** Get a single crate by name. Returns undefined if not found. */
export function getCrateByName(name: string): CrateRecord | undefined {
  return manifest.crates[name];
}

/** Get all crates in the manifest. */
export function getAllCrates(): CrateRecord[] {
  return Object.values(manifest.crates);
}

/** Get crates filtered by layer. */
export function getCratesByLayer(layer: CrateLayer): CrateRecord[] {
  return getAllCrates().filter(c => c.layer === layer);
}

/** Get crates filtered by family prefix. */
export function getCratesByFamily(family: string): CrateRecord[] {
  return getAllCrates().filter(c => c.family === family);
}

/** Search crates by name or description. */
export function searchCrates(query: string): CrateRecord[] {
  const lower = query.toLowerCase();
  return getAllCrates().filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.description.toLowerCase().includes(lower) ||
    c.tags.some(t => t.toLowerCase().includes(lower))
  );
}

/** Get related crates (same family, shared dependencies). */
export function getRelatedCrates(name: string, limit = 10): CrateRecord[] {
  const crate = getCrateByName(name);
  if (!crate) return [];

  const all = getAllCrates().filter(c => c.name !== name);

  // Score by: same family (3), shared dep (1 each), shared dependent (1 each)
  const scored = all.map(c => {
    let score = 0;
    if (c.family === crate.family) score += 3;
    score += c.dependencies.filter(d => crate.dependencies.includes(d)).length;
    score += c.dependents.filter(d => crate.dependents.includes(d)).length;
    return { crate: c, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.crate);
}

/** Get MCP tools exposed by a crate. */
export function getToolsForCrate(name: string): string[] {
  return toolMapping[name] ?? [];
}

/** Get manifest metadata. */
export function getManifestMeta(): { generatedAt: string; crateCount: number } {
  return {
    generatedAt: manifest.generated_at,
    crateCount: manifest.crate_count,
  };
}

/** Get all crate names (for static path generation). */
export function getAllCrateNames(): string[] {
  return Object.keys(manifest.crates);
}

/**
 * Build dependency graph data for reagraph.
 * Returns nodes and edges for a 2-degree neighborhood around a center crate.
 */
export function buildDependencyGraph(centerName: string, degree = 2): {
  nodes: Array<{ id: string; label: string; fill: string; size: number; data: { layer: string; description: string } }>;
  edges: Array<{ id: string; source: string; target: string; interpolation: 'curved' | 'linear' }>;
} {
  const LAYER_COLORS: Record<string, string> = {
    service: '#22d3ee',
    orchestration: '#fbbf24',
    domain: '#10b981',
    foundation: '#f97316',
  };

  const visited = new Set<string>();
  const queue: Array<{ name: string; depth: number }> = [{ name: centerName, depth: 0 }];
  visited.add(centerName);

  // BFS to collect neighborhood
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item || item.depth >= degree) continue;

    const crate = getCrateByName(item.name);
    if (!crate) continue;

    for (const dep of [...crate.dependencies, ...crate.dependents]) {
      if (!visited.has(dep) && getCrateByName(dep)) {
        visited.add(dep);
        queue.push({ name: dep, depth: item.depth + 1 });
      }
    }
  }

  const nodes = Array.from(visited).map(name => {
    const c = getCrateByName(name);
    const isCenter = name === centerName;
    return {
      id: name,
      label: name,
      fill: LAYER_COLORS[c?.layer ?? 'foundation'] ?? '#f97316',
      size: isCenter ? 14 : Math.min(12, 6 + (c?.fanIn ?? 0) * 0.3),
      data: {
        layer: c?.layer ?? 'foundation',
        description: c?.description ?? '',
      },
    };
  });

  const edgeSet = new Set<string>();
  const edges: Array<{ id: string; source: string; target: string; interpolation: 'curved' | 'linear' }> = [];

  for (const name of visited) {
    const crate = getCrateByName(name);
    if (!crate) continue;

    for (const dep of crate.dependencies) {
      if (visited.has(dep)) {
        const edgeId = `e-${name}-${dep}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edges.push({ id: edgeId, source: name, target: dep, interpolation: 'curved' });
        }
      }
    }
  }

  return { nodes, edges };
}
