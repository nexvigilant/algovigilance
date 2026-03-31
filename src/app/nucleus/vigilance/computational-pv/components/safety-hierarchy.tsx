"use client"

const levels = [
  { level: 1, name: "Molecular", description: "Drug-target binding, off-target interactions, reactive metabolite formation", scale: "nm", example: "Warfarin binds CYP2C9 — molecular perturbation" },
  { level: 2, name: "Subcellular", description: "Organelle stress, mitochondrial toxicity, ER stress response, DNA damage", scale: "μm", example: "Reactive metabolite depletes glutathione in mitochondria" },
  { level: 3, name: "Cellular", description: "Cell death, proliferation changes, inflammatory signaling, apoptosis", scale: "10μm", example: "Hepatocyte apoptosis triggered by mitochondrial dysfunction" },
  { level: 4, name: "Tissue", description: "Tissue remodeling, fibrosis, necrosis patterns, immune infiltration", scale: "mm", example: "Centrilobular necrosis pattern in liver" },
  { level: 5, name: "Organ", description: "Organ dysfunction, functional impairment, compensatory mechanisms", scale: "cm", example: "Elevated ALT/AST indicates hepatocellular damage" },
  { level: 6, name: "Systemic", description: "Multi-organ effects, systemic inflammation, homeostatic decompensation", scale: "m", example: "Drug-induced liver injury with systemic coagulopathy" },
  { level: 7, name: "Clinical", description: "Patient-level manifestation — the adverse event as observed and reported", scale: "patient", example: "Patient presents with jaundice and fatigue" },
  { level: 8, name: "Regulatory", description: "Population-level signal, labeling change, market withdrawal, REMS", scale: "population", example: "FAERS signal triggers label update with boxed warning" },
]

export function SafetyHierarchy() {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        The 8-Level Safety Hierarchy
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Harm propagates upward through discrete levels. At each transition, buffering mechanisms
        may absorb the perturbation. Clinical harm = the perturbation that survived all 7 transitions.
      </p>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground w-12">Level</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-28">Name</th>
                <th className="text-left p-3 font-medium text-muted-foreground w-16">Scale</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Example (Hepatotoxicity)</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((l, i) => (
                <tr
                  key={l.level}
                  className={`border-b border-border/50 ${i % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
                >
                  <td className="p-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {l.level}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-foreground">{l.name}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{l.scale}</td>
                  <td className="p-3 text-muted-foreground">{l.description}</td>
                  <td className="p-3 text-muted-foreground italic">{l.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-primary/5 border border-primary/20 p-4">
        <p className="text-sm text-foreground">
          <span className="font-semibold">Propagation Equation: </span>
          <code className="font-mono text-primary">
            P(Clinical | Molecular) = ∏ᵢ₌₁⁷ P(Level i+1 | Level i)
          </code>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Each transition probability depends on perturbation magnitude, network centrality,
          buffering capacity, exposure duration, and individual genotype.
        </p>
      </div>
    </div>
  )
}
