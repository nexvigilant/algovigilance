import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Epidemiology — Measures of Association & Impact | AlgoVigilance",
  description: "Epidemiological measures mapped to pharmacovigilance: relative risk (→PRR), odds ratio (→ROR), attributable risk, NNT/NN",
}

export default function EpidemiologyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Epidemiology — Measures of Association & Impact
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Epidemiological measures mapped to pharmacovigilance: relative risk (→PRR), odds ratio (→ROR), attributable risk, NNT/NNH, attributable fraction, population AF, incidence rate, prevalence, Kaplan-Meie
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            11 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            epidemiology
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
