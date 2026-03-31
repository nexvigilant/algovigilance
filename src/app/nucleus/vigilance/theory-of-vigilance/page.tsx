import { Metadata } from "next"
import { AxiomCards } from "./components/axiom-cards"
import { SubscriptionGate } from "@/components/paywall/subscription-gate"

export const metadata: Metadata = {
  title: "Theory of Vigilance | AlgoVigilance",
  description: "Five formal axioms establishing the mathematical foundations of vigilance — from system decomposition to emergent harm",
}

export default function TheoryOfVigilancePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Foundational Theory
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            NV-TOV-AXIOM-001
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Theory of Vigilance
        </h1>
        <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
          Any system powerful enough to help is powerful enough to harm. The Theory of Vigilance
          formalizes this insight into five mathematical axioms that govern how harm emerges,
          propagates, and can be detected in any complex system — from drug safety to AI oversight.
        </p>
      </div>

      <SubscriptionGate previewLines={8}>
      <div className="mb-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Core Definitions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Vigilance System</p>
            <p className="text-sm text-muted-foreground">
              A tuple <code className="text-primary">V = (S, P, M, H)</code> — a system capable of causing harm,
              perturbations applied to it, a monitoring apparatus, and a harm specification.
            </p>
          </div>
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Harm Event</p>
            <p className="text-sm text-muted-foreground">
              A measurable event <code className="text-primary">H</code> representing damage, injury,
              or undesired outcome as specified by the harm specification.
            </p>
          </div>
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground mb-1">State Space</p>
            <p className="text-sm text-muted-foreground">
              A topological space <code className="text-primary">(S, τ)</code> where every system
              configuration corresponds to exactly one point.
            </p>
          </div>
          <div className="rounded-md bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Observable</p>
            <p className="text-sm text-muted-foreground">
              A measurable function <code className="text-primary">o: S → O</code> — a quantity
              that the monitoring apparatus can measure.
            </p>
          </div>
        </div>
      </div>

      <AxiomCards />

      <div className="mt-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Why This Matters</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          These five axioms provide the mathematical scaffolding for every AlgoVigilance tool.
          Signal detection tests whether a system state has crossed the safety manifold boundary.
          Causality assessment traces perturbation propagation through the hierarchy.
          Benefit-risk analysis quantifies conservation constraint margins. The theory is not
          abstract — it is the engine behind the computation.
        </p>
      </div>
      </SubscriptionGate>
    </div>
  )
}
