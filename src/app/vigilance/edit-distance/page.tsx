import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Edit Distance — String Similarity Algorithms | AlgoVigilance",
  description: "Levenshtein, Damerau-Levenshtein, and LCS distance computation for fuzzy drug name matching, MedDRA term comparison, and",
}

export default function EditDistancePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Edit Distance — String Similarity Algorithms
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Levenshtein, Damerau-Levenshtein, and LCS distance computation for fuzzy drug name matching, MedDRA term comparison, and general string similarity. Supports single-pair and batch operations with trace
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            4 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            edit-distance
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
