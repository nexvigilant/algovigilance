import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "DataFrame — Columnar Data Operations | AlgoVigilance",
  description: "Sovereign columnar DataFrame engine: create tables from JSON, compute summary statistics (mean, std, min, max, count, me",
}

export default function DataframePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          DataFrame — Columnar Data Operations
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Sovereign columnar DataFrame engine: create tables from JSON, compute summary statistics (mean, std, min, max, count, median), filter rows by condition, group by columns with aggregation, sort, select
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            7 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            dataframe
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
