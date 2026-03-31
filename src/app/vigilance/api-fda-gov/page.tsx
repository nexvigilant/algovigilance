import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "openFDA FAERS | AlgoVigilance",
  description: "FDA Adverse Event Reporting System data via openFDA API",
}

export default function ApiFdaGovPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          openFDA FAERS
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          FDA Adverse Event Reporting System data via openFDA API
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            8 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            api-fda-gov
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
