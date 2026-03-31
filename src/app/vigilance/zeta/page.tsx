import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Zeta — Riemann Zeta Function and Zero Analysis | AlgoVigilance",
  description: "Compute the Riemann zeta function ζ(s), find zeros on the critical line, verify the Riemann Hypothesis to a given height",
}

export default function ZetaPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Zeta — Riemann Zeta Function and Zero Analysis
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Compute the Riemann zeta function ζ(s), find zeros on the critical line, verify the Riemann Hypothesis to a given height, and analyze zero spacing statistics against GUE random matrix predictions. Pur
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            5 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            zeta
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
