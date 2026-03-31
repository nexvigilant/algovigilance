import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Markov — Chain Analysis & Estimation | AlgoVigilance",
  description: "Markov chain analysis: stationary distribution, n-step transition, ergodicity, communicating classes, entropy rate, mean",
}

export default function MarkovPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Markov — Chain Analysis & Estimation
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Markov chain analysis: stationary distribution, n-step transition, ergodicity, communicating classes, entropy rate, mean first passage time, and chain estimation from observed data. Pure Rust via stem
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            2 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            markov
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
