import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Helix Computing — Conservation Law as Computable Geometry | AlgoVigilance",
  description: "The conservation law ∃ = ∂(×(ς, ∅)) encodes a helix: it advances (→), returns (κ), and bounds (∂). Five tools make this ",
}

export default function HelixPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Helix Computing — Conservation Law as Computable Geometry
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          The conservation law ∃ = ∂(×(ς, ∅)) encodes a helix: it advances (→), returns (κ), and bounds (∂). Five tools make this geometry computable: conservation checks, helix position, mutualism validation, 
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            5 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            helix
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
