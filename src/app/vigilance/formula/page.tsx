import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Formula — Knowledge Unit Derived Computations | AlgoVigilance",
  description: "Five formulas from the Knowledge Unit extraction pipeline: signal strength composite (S=U×R×T), domain distance, flywhee",
}

export default function FormulaPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Formula — Knowledge Unit Derived Computations
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Five formulas from the Knowledge Unit extraction pipeline: signal strength composite (S=U×R×T), domain distance, flywheel velocity, token ratio, and spectral overlap (cosine similarity). Pure computat
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            5 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            formula
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
