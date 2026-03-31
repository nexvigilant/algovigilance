import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Relay — Pipeline Fidelity Analysis | AlgoVigilance",
  description: "Relay chain fidelity computation with A1-A5 axiom verification, pre-configured PV signal pipeline, core detection chain,",
}

export default function RelayPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Relay — Pipeline Fidelity Analysis
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Relay chain fidelity computation with A1-A5 axiom verification, pre-configured PV signal pipeline, core detection chain, and fidelity composition. Pure Rust via nexcore-primitives.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            4 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            relay
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
