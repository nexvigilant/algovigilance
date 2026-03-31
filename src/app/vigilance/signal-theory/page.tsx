import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Signal Theory — Universal Signal Detection Framework | AlgoVigilance",
  description: "Signal detection tools grounded in 6 axioms and 5 theorems. Includes threshold-based detection, SDT decision matrix (d-p",
}

export default function SignalTheoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Signal Theory — Universal Signal Detection Framework
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Signal detection tools grounded in 6 axioms and 5 theorems. Includes threshold-based detection, SDT decision matrix (d-prime, sensitivity, specificity, MCC), conservation law verification, multi-stage
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            8 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            signal-theory
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
