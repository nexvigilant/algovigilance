import { Metadata } from "next"
import { ElementSystem } from "./components/element-system"
import { SafetyHierarchy } from "./components/safety-hierarchy"
import { ConservationLaws } from "./components/conservation-laws"
import { SubscriptionGate } from "@/components/paywall/subscription-gate"

export const metadata: Metadata = {
  title: "Computational Pharmacovigilance | AlgoVigilance",
  description: "First-principles mathematical framework for predictive drug safety — 15 elements, 8 hierarchy levels, 11 conservation laws",
}

export default function ComputationalPVPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Module 20
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            CompPV Foundation
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Computational Pharmacovigilance
        </h1>
        <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
          Traditional pharmacovigilance detects harm after it occurs. Computational PV predicts
          it from first principles — modeling the mechanistic pathways through which drugs produce
          harm, from molecular binding to clinical manifestation.
        </p>
      </div>

      <div className="mb-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">The Paradigm Shift</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Traditional PV</p>
            <p className="text-sm text-muted-foreground">
              Retrospective. Observes adverse events after they occur. Statistical pattern
              recognition in large datasets. Detects signals — does not explain mechanisms.
            </p>
          </div>
          <div className="rounded-md bg-primary/10 border border-primary/20 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Computational PV</p>
            <p className="text-sm text-muted-foreground">
              Prospective. Predicts adverse events from mechanistic models. First-principles
              simulation of drug-biological system interactions. Explains why harm occurs.
            </p>
          </div>
        </div>
      </div>

      <SubscriptionGate previewLines={8}>
      <ElementSystem />
      <SafetyHierarchy />
      <ConservationLaws />

      <div className="mt-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">The Isomorphism</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          The same conservation laws that govern mass, energy, and information flow in computing
          systems govern mass balance, thermodynamic binding, and signal transduction in biological
          systems. This structural isomorphism is not metaphorical — it is mathematical. Every
          AlgoVigilance computation leverages this mapping to transfer computational rigor to drug safety.
        </p>
      </div>
      </SubscriptionGate>
    </div>
  )
}
