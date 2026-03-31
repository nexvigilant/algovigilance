"use client"

import { useState } from "react"

interface Element {
  symbol: string
  name: string
  layer: number
  layerName: string
  description: string
}

const elements: Element[] = [
  { symbol: "Dr", name: "Drug", layer: 1, layerName: "Foundation (Molecular)", description: "The pharmacological agent — characterized by molecular weight, LogP, pKa, solubility, and structural properties" },
  { symbol: "Tg", name: "Target", layer: 1, layerName: "Foundation (Molecular)", description: "The intended molecular target — protein, receptor, enzyme, or nucleic acid the drug is designed to modulate" },
  { symbol: "Rc", name: "Receptor", layer: 1, layerName: "Foundation (Molecular)", description: "Molecular recognition site — exists in free, bound, and desensitized states (total conserved)" },
  { symbol: "Ez", name: "Enzyme", layer: 2, layerName: "Operations (Cellular)", description: "Catalytic machinery — regenerated after catalysis unless permanently inactivated by mechanism-based inhibition" },
  { symbol: "Tr", name: "Transporter", layer: 2, layerName: "Operations (Cellular)", description: "Membrane transport proteins — govern drug distribution across biological compartments" },
  { symbol: "Mt", name: "Metabolite", layer: 2, layerName: "Operations (Cellular)", description: "Biotransformation products — can be inactive, active, or reactive (toxicity-causing)" },
  { symbol: "Pw", name: "Pathway", layer: 2, layerName: "Operations (Cellular)", description: "Signal transduction cascades — flux must be conserved at steady state per pathway flux conservation law" },
  { symbol: "Cl", name: "Cell", layer: 2, layerName: "Operations (Cellular)", description: "Fundamental unit of biological response — integrates all molecular-level perturbations" },
  { symbol: "Or", name: "Organ", layer: 3, layerName: "Management (Systemic)", description: "Functional tissue unit — toxicity manifests here as organ dysfunction (hepatotoxicity, nephrotoxicity, etc.)" },
  { symbol: "Bm", name: "Biomarker", layer: 3, layerName: "Management (Systemic)", description: "Measurable indicators of biological state — bridge between molecular mechanism and clinical observation" },
  { symbol: "Gn", name: "Genotype", layer: 3, layerName: "Management (Systemic)", description: "Genetic variants modulating drug response — pharmacogenomic determinants of susceptibility" },
  { symbol: "Ph", name: "Phenotype", layer: 3, layerName: "Management (Systemic)", description: "Observable clinical characteristics — the expression of genotype in the context of exposure" },
  { symbol: "Pp", name: "Population", layer: 4, layerName: "Intelligence (Population)", description: "Epidemiological aggregate — population-level safety signals emerge from individual-level events" },
  { symbol: "Rg", name: "Regulatory", layer: 4, layerName: "Intelligence (Population)", description: "Regulatory framework — risk management, labeling, and post-market surveillance decisions" },
  { symbol: "Ev", name: "Environment", layer: 4, layerName: "Intelligence (Population)", description: "External context — diet, co-medications, comorbidities, and environmental exposures modifying drug response" },
]

const layerColors: Record<number, string> = {
  1: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  2: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  3: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  4: "bg-purple-500/10 border-purple-500/30 text-purple-400",
}

const layerBadgeColors: Record<number, string> = {
  1: "bg-blue-500/20 text-blue-400",
  2: "bg-emerald-500/20 text-emerald-400",
  3: "bg-amber-500/20 text-amber-400",
  4: "bg-purple-500/20 text-purple-400",
}

export function ElementSystem() {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null)

  const filtered = selectedLayer ? elements.filter((e) => e.layer === selectedLayer) : elements
  const layers = [
    { num: 1, name: "Foundation (Molecular)", count: 3 },
    { num: 2, name: "Operations (Cellular)", count: 5 },
    { num: 3, name: "Management (Systemic)", count: 4 },
    { num: 4, name: "Intelligence (Population)", count: 3 },
  ]

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        The 15-Element CompPV System
      </h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedLayer(null)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            selectedLayer === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({elements.length})
        </button>
        {layers.map((l) => (
          <button
            key={l.num}
            onClick={() => setSelectedLayer(selectedLayer === l.num ? null : l.num)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedLayer === l.num
                ? "bg-primary text-primary-foreground"
                : `${layerBadgeColors[l.num]} hover:opacity-80`
            }`}
          >
            Layer {l.num}: {l.name} ({l.count})
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((el) => (
          <div
            key={el.symbol}
            className={`rounded-lg border p-4 ${layerColors[el.layer]}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-md bg-background/50 flex items-center justify-center font-mono font-bold text-sm">
                {el.symbol}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{el.name}</p>
                <p className="text-xs text-muted-foreground">Layer {el.layer}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{el.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
