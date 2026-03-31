import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Compliance — Regulatory Compliance Assessment | AlgoVigilance",
  description: "Regulatory compliance assessment tools: evaluate systems against ICH/FDA frameworks, browse ICH control catalogs, and ch",
}

export default function CompliancePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Compliance — Regulatory Compliance Assessment
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Regulatory compliance assessment tools: evaluate systems against ICH/FDA frameworks, browse ICH control catalogs, and check SAM.gov entity exclusions. Pure Rust via nexcore-compliance.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            3 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            compliance
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
