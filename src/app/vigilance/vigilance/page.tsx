import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Vigilance & Harm Taxonomy | AlgoVigilance",
  description: "Pharmacovigilance vigilance tools: safety margin distance d(s) for composite signal scoring, Guardian-AV risk scoring (0",
}

export default function VigilancePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Vigilance & Harm Taxonomy
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Pharmacovigilance vigilance tools: safety margin distance d(s) for composite signal scoring, Guardian-AV risk scoring (0-10), harm classification by type (A-H) per Theory of Vigilance §9, and safety-l
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            5 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            vigilance
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
