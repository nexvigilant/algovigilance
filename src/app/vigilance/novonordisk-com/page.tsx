import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Novo Nordisk A/S | AlgoVigilance",
  description: "Novo Nordisk A/S pharmacovigilance intelligence — product portfolio, clinical pipeline, safety profile, recalls, and lab",
}

export default function NovonordiskComPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Novo Nordisk A/S
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Novo Nordisk A/S pharmacovigilance intelligence — product portfolio, clinical pipeline, safety profile, recalls, and labeling changes
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            7 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            novonordisk-com
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
