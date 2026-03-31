import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Foundation Primitives | AlgoVigilance",
  description: "Concept grep, fuzzy search, graph operations, Levenshtein distance, and hash utilities",
}

export default function FoundationPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Foundation Primitives
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Concept grep, fuzzy search, graph operations, Levenshtein distance, and hash utilities
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            13 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            foundation
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
