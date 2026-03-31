import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "MoltBook — Config Discovery & Contribution | AlgoVigilance",
  description: "Discover, contribute, and monitor AlgoVigilance Station configs via MCP. The agent-facing API for the Molt ecosystem: find",
}

export default function MoltbookPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          MoltBook — Config Discovery & Contribution
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Discover, contribute, and monitor AlgoVigilance Station configs via MCP. The agent-facing API for the Molt ecosystem: find tools by domain, submit new configs, check health, and generate proxy scripts.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            5 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            moltbook
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
