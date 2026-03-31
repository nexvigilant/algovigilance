import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "T1 Lex Primitiva — Universal Concept Algebra Tools | AlgoVigilance",
  description: "15 axiomatic primitives forming a universal concept algebra. Each tool analyzes a concept through one primitive lens, re",
}

export default function PrimitivesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          T1 Lex Primitiva — Universal Concept Algebra Tools
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          15 axiomatic primitives forming a universal concept algebra. Each tool analyzes a concept through one primitive lens, returning structured decomposition with properties and failure modes. Proven in 21
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            15 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            primitives
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
