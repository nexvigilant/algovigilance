import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Oracle Knowledge | AlgoVigilance",
  description: "Knowledge ingestion, prediction, and oracle consultation",
}

export default function OraclePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Oracle Knowledge
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Knowledge ingestion, prediction, and oracle consultation
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            7 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            oracle
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
