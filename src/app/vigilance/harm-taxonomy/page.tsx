import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Harm Taxonomy — 8-Type Classification from Conservation Law Violations | AlgoVigilance",
  description: "Systematic taxonomy of 8 harm types (A-H) derived from 2³ combinatorics of perturbation multiplicity × temporal profile ",
}

export default function HarmTaxonomyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Harm Taxonomy — 8-Type Classification from Conservation Law Violations
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Systematic taxonomy of 8 harm types (A-H) derived from 2³ combinatorics of perturbation multiplicity × temporal profile × response determinism. Maps each type to conservation laws violated, manifestat
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            6 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            harm-taxonomy
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
