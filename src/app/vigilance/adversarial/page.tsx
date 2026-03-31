import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Adversarial Analysis | AlgoVigilance",
  description: "Adversarial testing, antitransformer validation, and robustness assessment",
}

export default function AdversarialPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Adversarial Analysis
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Adversarial testing, antitransformer validation, and robustness assessment
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            3 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            adversarial
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
