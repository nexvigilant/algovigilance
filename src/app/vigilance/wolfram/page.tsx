import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Wolfram Alpha | AlgoVigilance",
  description: "Wolfram Alpha calculations — astronomy, chemistry, physics, finance, linguistics, and data lookup",
}

export default function WolframPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Wolfram Alpha
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Wolfram Alpha calculations — astronomy, chemistry, physics, finance, linguistics, and data lookup
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            19 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            wolfram
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
