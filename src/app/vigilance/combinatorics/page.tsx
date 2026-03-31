import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Combinatorics — Dudeney-Derived Algorithms | AlgoVigilance",
  description: "Catalan numbers, derangements, cycle decomposition, Josephus problem, grid paths, binomial/multinomial coefficients, and",
}

export default function CombinatoricsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Combinatorics — Dudeney-Derived Algorithms
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Catalan numbers, derangements, cycle decomposition, Josephus problem, grid paths, binomial/multinomial coefficients, and linear extensions. Pure Rust via nexcore-combinatorics.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            12 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            combinatorics
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
