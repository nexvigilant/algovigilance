import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "ToV Proofs — Harm Attenuation Theorem (T10.2) | AlgoVigilance",
  description: "The Attenuation Theorem: under the Markov assumption, harm probability decreases exponentially with protective depth. Co",
}

export default function TovProofsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          ToV Proofs — Harm Attenuation Theorem (T10.2)
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          The Attenuation Theorem: under the Markov assumption, harm probability decreases exponentially with protective depth. Compute harm propagation, attenuation rates, protective depth requirements, and ve
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            5 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            tov-proofs
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
