import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "PV Calculation Engine | AlgoVigilance",
  description: "Pharmacovigilance computation tools: signal detection (PRR/ROR/IC/EBGM), causality assessment (Naranjo, WHO-UMC), seriou",
}

export default function CalculatePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          PV Calculation Engine
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Pharmacovigilance computation tools: signal detection (PRR/ROR/IC/EBGM), causality assessment (Naranjo, WHO-UMC), seriousness classification (ICH E2A), benefit-risk analysis, and reporting rate calcul
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            17 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            calculate
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
