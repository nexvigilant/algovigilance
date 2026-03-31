import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Non-Compensatory Risk Scoring | AlgoVigilance",
  description: "Non-compensatory PV risk scoring via weighted geometric mean aggregation. A zero in any evidence dimension (PRR, ROR, IC",
}

export default function NoncompensatoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Non-Compensatory Risk Scoring
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Non-compensatory PV risk scoring via weighted geometric mean aggregation. A zero in any evidence dimension (PRR, ROR, IC025, EBGM05) collapses the composite score — one strong metric cannot mask weak 
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            3 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            noncompensatory
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
