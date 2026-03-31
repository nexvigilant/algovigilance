import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Energy — Token Budget Management via ATP/ADP Biochemistry | AlgoVigilance",
  description: "Metabolic energy management for AI token budgets. Computes energy charge (Atkinson EC), regime classification, model sel",
}

export default function EnergyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Energy — Token Budget Management via ATP/ADP Biochemistry
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Metabolic energy management for AI token budgets. Computes energy charge (Atkinson EC), regime classification, model selection strategy, waste analysis, and temporal metrics. Pure Rust via nexcore-ene
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            6 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            energy
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
