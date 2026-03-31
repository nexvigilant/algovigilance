import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Developer Toolchain | AlgoVigilance",
  description: "Build orchestration, crate scaffolding, documentation generation, MCP server management, config validation, hook testing",
}

export default function DevtoolsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Developer Toolchain
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Build orchestration, crate scaffolding, documentation generation, MCP server management, config validation, hook testing, tool discovery, and CLI help
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            40 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            devtools
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
