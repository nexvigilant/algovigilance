import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Stoichiometry — Primitive Equation Encoding | AlgoVigilance",
  description: "Encode PV concepts as balanced primitive equations, decode equations back to concepts, find sister concepts via Jaccard ",
}

export default function StoichiometryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Stoichiometry — Primitive Equation Encoding
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Encode PV concepts as balanced primitive equations, decode equations back to concepts, find sister concepts via Jaccard similarity, compute thermodynamic mass state (entropy, Gibbs), search the built-
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            8 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            stoichiometry
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
