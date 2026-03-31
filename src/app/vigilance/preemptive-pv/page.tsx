import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Preemptive Pharmacovigilance — Three-Tier Signal Detection | AlgoVigilance",
  description: "Proactive safety signal detection beyond reactive PRR. Three tiers: Reactive (standard disproportionality), Predictive (",
}

export default function PreemptivePvPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Preemptive Pharmacovigilance — Three-Tier Signal Detection
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Proactive safety signal detection beyond reactive PRR. Three tiers: Reactive (standard disproportionality), Predictive (severity-weighted PRR), Preemptive (Gibbs thermodynamic energy modeling). Plus t
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            10 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            preemptive-pv
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
