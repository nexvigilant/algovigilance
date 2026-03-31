import { Metadata } from "next"
import { PharmakopnPrinciple } from "./components/pharmakon-principle"
import { MethodologyMapping } from "./components/methodology-mapping"
import { DomainParallels } from "./components/domain-parallels"
import { SubscriptionGate } from "@/components/paywall/subscription-gate"

export const metadata: Metadata = {
  title: "Intervention Vigilance Framework | AlgoVigilance",
  description: "Extending pharmacovigilance methodology to universal intervention monitoring — the Pharmakon Principle",
}

export default function InterventionVigilancePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Foundational Theory
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Cross-Domain
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Intervention Vigilance Framework
        </h1>
        <p className="mt-3 text-muted-foreground max-w-3xl leading-relaxed">
          Pharmacovigilance methodology — signal detection, causality assessment, benefit-risk
          analysis — is not specific to drugs. Any intervention powerful enough to help is powerful
          enough to harm. The Intervention Vigilance Framework extends PV to every domain.
        </p>
      </div>

      <SubscriptionGate previewLines={8}>
      <PharmakopnPrinciple />
      <DomainParallels />
      <MethodologyMapping />

      <div className="mt-10 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Definition</h2>
        <blockquote className="border-l-2 border-primary pl-4 italic text-foreground">
          Intervention Vigilance: The science and activities relating to detection, assessment,
          understanding, and prevention of harms arising from any intervention deployed at scale,
          throughout the intervention&apos;s lifecycle.
        </blockquote>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          This is the WHO definition of pharmacovigilance with one word changed: &ldquo;drug&rdquo; replaced
          by &ldquo;intervention.&rdquo; The methodology is identical. The scope is universal.
        </p>
      </div>
      </SubscriptionGate>
    </div>
  )
}
