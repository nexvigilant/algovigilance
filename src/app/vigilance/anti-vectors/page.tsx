import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "Anti-Vectors — From Signal to Prescription | AlgoVigilance",
  description: "Compute structured countermeasures for pharmacovigilance signals. Three anti-vector classes: Mechanistic (break the pathway), Epistemic (counter the noise), Architectural (minimize the risk).",
}

export default function AntiVectorsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Anti-Vectors — From Signal to Prescription
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          When you detect a safety signal, the question is always: &ldquo;what do we do about it?&rdquo;
          Anti-vectors answer that question. They compute the structured countermeasure that
          neutralizes the harm — from pathway intervention to proportionate risk minimization.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            3 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            antivector
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            harm-taxonomy
          </span>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-3">How Anti-Vectors Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-primary">Mechanistic</div>
            <p className="text-sm text-muted-foreground">
              Breaks the causal chain. Identifies the specific intervention
              that stops the harm pathway — like dose titration preventing acute toxicity.
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-primary">Epistemic</div>
            <p className="text-sm text-muted-foreground">
              Counters false signals. Builds a structured evidence packet showing
              why a signal might be noise — indication bias, notoriety effect, channeling.
            </p>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-primary">Architectural</div>
            <p className="text-sm text-muted-foreground">
              Engineers proportionate risk minimization. Selects the right measure
              for the signal strength — label update, DHCP letter, REMS, or stronger.
            </p>
          </div>
        </div>
      </div>

      <ToolCards />
    </div>
  )
}
