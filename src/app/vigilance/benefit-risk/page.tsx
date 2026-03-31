import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Benefit-Risk Assessment — QBRI & QBR | AlgoVigilance",
  description: "Quantitative benefit-risk assessment tools. Two complementary families: QBRI (expert-judgment, 7-variable formula) and Q",
}

export default function BenefitRiskPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Benefit-Risk Assessment — QBRI & QBR
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Quantitative benefit-risk assessment tools. Two complementary families: QBRI (expert-judgment, 7-variable formula) and QBR (statistical-evidence from contingency tables using PRR/ROR/IC/EBGM). Include
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            6 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            benefit-risk
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
