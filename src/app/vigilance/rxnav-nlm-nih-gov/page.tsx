import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "RxNav Drug Nomenclature | AlgoVigilance",
  description: "NLM RxNorm navigation — drug names, ingredients, NDCs, and interaction checking",
}

export default function RxnavNlmNihGovPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          RxNav Drug Nomenclature
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          NLM RxNorm navigation — drug names, ingredients, NDCs, and interaction checking
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            6 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            rxnav-nlm-nih-gov
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
