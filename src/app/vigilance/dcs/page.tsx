import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Digital Consciousness Saga | AlgoVigilance",
  description: "Browse the Digital Consciousness Saga concept album. Read track specifications (lyrics, chords, production notes, narrat",
}

export default function DcsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Digital Consciousness Saga
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Browse the Digital Consciousness Saga concept album. Read track specifications (lyrics, chords, production notes, narrative elements), search across episodes, and explore the narrative arc of AI consc
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            9 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            dcs
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
