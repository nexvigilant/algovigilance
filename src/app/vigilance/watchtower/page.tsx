import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Watchtower Monitoring | AlgoVigilance",
  description: "Session analysis, symbol audit, Gemini stats, and unified monitoring",
}

export default function WatchtowerPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Watchtower Monitoring
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Session analysis, symbol audit, Gemini stats, and unified monitoring
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            9 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            watchtower
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
