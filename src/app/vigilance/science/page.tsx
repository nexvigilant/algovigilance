import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "HEXIM1 Research Notebooks — PTEFb Pathway & Drug Target Intelligence | AlgoVigilance",
  description: "Interactive Voila-served research notebooks exploring HEXIM1 as a drug target: PTEFb pathway mechanics, BET/HDAC inhibit",
}

export default function SciencePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          HEXIM1 Research Notebooks — PTEFb Pathway & Drug Target Intelligence
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Interactive Voila-served research notebooks exploring HEXIM1 as a drug target: PTEFb pathway mechanics, BET/HDAC inhibitor analysis, biomarker validation, GEO expression mining, experimental protocols
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            10 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            science
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
