"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ToolDef {
  name: string
  label: string
  description: string
  params: string[]
}

const TOOLS: ToolDef[] = [
    {
      name: "viz-ae-overlay",
      label: "Viz Ae Overlay",
      description: "Compute an AE signal heatmap from drug signal data.",
      params: [],
    },
    {
      name: "viz-antibody-structure",
      label: "Viz Antibody Structure",
      description: "Fab/Fc fragment mapping, and disulfide bond detection.",
      params: [],
    },
    {
      name: "viz-bipartite-layout",
      label: "Viz Bipartite Layout",
      description: "Compute bipartite drug-AE network layout from a VDAG definition.",
      params: [],
    },
    {
      name: "viz-bounds",
      label: "Viz Bounds",
      description: "Generate bounds visualization SVG.",
      params: [],
    },
    {
      name: "viz-centrality",
      label: "Viz Centrality",
      description: "/// Supports degree, betweenness, closeness, eigenvector, or all four.",
      params: [],
    },
    {
      name: "viz-community-detect",
      label: "Viz Community Detect",
      description: "the modularity score Q.",
      params: [],
    },
    {
      name: "viz-confidence-chain",
      label: "Viz Confidence Chain",
      description: "Generate confidence propagation waterfall SVG.",
      params: [],
    },
    {
      name: "viz-coord-gen",
      label: "Viz Coord Gen",
      description: "Generate 3D molecular coordinates via distance geometry.",
      params: [],
    },
    {
      name: "viz-dag",
      label: "Viz Dag",
      description: "Generate DAG topology visualization SVG.",
      params: [],
    },
    {
      name: "viz-dynamics-step",
      label: "Viz Dynamics Step",
      description: "Run a molecular dynamics simulation and return trajectory summary.",
      params: [],
    },
    {
      name: "viz-force-field-energy",
      label: "Viz Force Field Energy",
      description: "Compute molecular force field energy breakdown.",
      params: [],
    },
    {
      name: "viz-gpu-layout",
      label: "Viz Gpu Layout",
      description: "Run force-directed graph layout (CPU-side Fruchterman-Reingold / ForceAtlas2).",
      params: [],
    },
    {
      name: "viz-hypergraph",
      label: "Viz Hypergraph",
      description: "Construct a hypergraph and compute metrics, components, bipartiteness.",
      params: [],
    },
    {
      name: "viz-interaction-map",
      label: "Viz Interaction Map",
      description: "interaction details.",
      params: [],
    },
    {
      name: "viz-lod-select",
      label: "Viz Lod Select",
      description: "Select Level-of-Detail representation level based on atom count.",
      params: [],
    },
    {
      name: "viz-manifold-sample",
      label: "Viz Manifold Sample",
      description: "and sample surface points with normals and curvature.",
      params: [],
    },
    {
      name: "viz-method-loop",
      label: "Viz Method Loop",
      description: "Generate science/chemistry/math loop SVG.",
      params: [],
    },
    {
      name: "viz-minimize-energy",
      label: "Viz Minimize Energy",
      description: "Run energy minimization on a molecular structure.",
      params: [],
    },
    {
      name: "viz-molecular-info",
      label: "Viz Molecular Info",
      description: "for a chemical element symbol.",
      params: [],
    },
    {
      name: "viz-node-confidence",
      label: "Viz Node Confidence",
      description: "Viz Node Confidence",
      params: [],
    },
    {
      name: "viz-orbital-density",
      label: "Viz Orbital Density",
      description: "and optionally the overlap matrix.",
      params: [],
    },
    {
      name: "viz-particle-preset",
      label: "Viz Particle Preset",
      description: "Get a particle system preset configuration (solvent, reaction, electron).",
      params: [],
    },
    {
      name: "viz-projection",
      label: "Viz Projection",
      description: "Klein bottle, Clifford torus) and project it.",
      params: [],
    },
    {
      name: "viz-protein-structure",
      label: "Viz Protein Structure",
      description: "contact map, hydrogen bonds, radius of gyration, and aggregate metrics.",
      params: [],
    },
    {
      name: "viz-render-pipeline",
      label: "Viz Render Pipeline",
      description: "and generate WGSL shader source code.  No actual GPU required.",
      params: [],
    },
    {
      name: "viz-spectral-analysis",
      label: "Viz Spectral Analysis",
      description: "power iteration.",
      params: [],
    },
    {
      name: "viz-stem-taxonomy",
      label: "Viz Stem Taxonomy",
      description: "Generate STEM taxonomy sunburst SVG.",
      params: [],
    },
    {
      name: "viz-string-modes",
      label: "Viz String Modes",
      description: "optionally nodes/antinodes for a specific mode.",
      params: [],
    },
    {
      name: "viz-surface-mesh",
      label: "Viz Surface Mesh",
      description: "and returns vertex/triangle counts plus a mesh summary.",
      params: [],
    },
    {
      name: "viz-topology-analysis",
      label: "Viz Topology Analysis",
      description: "theorem on a triangle mesh.",
      params: [],
    },
    {
      name: "viz-type-composition",
      label: "Viz Type Composition",
      description: "Generate type composition diagram SVG.",
      params: [],
    },
    {
      name: "viz-vdag-overlay",
      label: "Viz Vdag Overlay",
      description: "and produce 3D layout coordinates.",
      params: [],
    }
]

export function ToolCards() {
  const [search, setSearch] = useState("")
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const filtered = TOOLS.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search tools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <Card
            key={tool.name}
            className={`cursor-pointer transition-colors hover:border-primary ${
              selectedTool === tool.name ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => setSelectedTool(tool.name === selectedTool ? null : tool.name)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                {tool.label}
              </CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {tool.params.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                ))}
                {tool.params.length === 0 && (
                  <Badge variant="outline" className="text-xs">no params</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No tools match your search.
        </p>
      )}
    </div>
  )
}
