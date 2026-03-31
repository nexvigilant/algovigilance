import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "API Operations | AlgoVigilance",
  description: "API health checks, route listing, and HTTP request handling",
}

export default function ApiOpsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          API Operations
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          API health checks, route listing, and HTTP request handling
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            2 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            api-ops
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
