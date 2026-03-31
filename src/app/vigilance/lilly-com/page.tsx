import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Eli Lilly and Company | AlgoVigilance",
  description: "Eli Lilly and Company pharmacovigilance intelligence — product portfolio, clinical pipeline, safety profile, recalls, an",
}

export default function LillyComPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Eli Lilly and Company
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Eli Lilly and Company pharmacovigilance intelligence — product portfolio, clinical pipeline, safety profile, recalls, and labeling changes
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            7 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            lilly-com
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
