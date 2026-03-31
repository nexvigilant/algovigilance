import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Statemind Engine | AlgoVigilance",
  description: "State machine reasoning, mind-state tracking, and cognitive state management",
}

export default function StatemindPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Statemind Engine
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          State machine reasoning, mind-state tracking, and cognitive state management
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            2 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            statemind
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
