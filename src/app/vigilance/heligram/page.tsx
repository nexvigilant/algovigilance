import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Heligram — Helical Decision Programs | AlgoVigilance",
  description: "Dual-strand decision programs with built-in falsification. Each heligram runs a sense strand (assertion) and antisense s",
}

export default function HeligramPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Heligram — Helical Decision Programs
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Dual-strand decision programs with built-in falsification. Each heligram runs a sense strand (assertion) and antisense strand (falsification) in parallel, resolving through a pairing matrix. Produces 
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            4 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            heligram
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
