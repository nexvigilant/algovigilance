import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "AlgoVigilance Agent Marketing — Capability Discovery & Onboarding | AlgoVigilance",
  description: "Agent onboarding funnel: discover AlgoVigilance capabilities, try live demos, get hooked on multi-tool chains, and measure",
}

export default function MarketingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          AlgoVigilance Agent Marketing — Capability Discovery & Onboarding
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Agent onboarding funnel: discover AlgoVigilance capabilities, try live demos, get hooked on multi-tool chains, and measure value. Every tool response includes next-step guidance. Designed to capture age
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            6 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            marketing
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
