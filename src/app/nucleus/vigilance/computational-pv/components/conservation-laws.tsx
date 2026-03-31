"use client"

import { useState } from "react"

interface Law {
  number: number
  name: string
  statement: string
  formula: string
  safetyImplication: string
}

const laws: Law[] = [
  {
    number: 1,
    name: "Drug Mass Balance",
    statement: "Total drug mass in the body equals administered dose minus cumulative elimination.",
    formula: "D(t) = D₀ - ∫₀ᵗ CL·C(τ)dτ",
    safetyImplication: "Accumulation (violation of mass balance) leads to concentration-dependent toxicity",
  },
  {
    number: 2,
    name: "Thermodynamic Binding",
    statement: "Drug-target binding is governed by thermodynamic equilibrium; spontaneous binding requires negative Gibbs free energy.",
    formula: "ΔG = ΔH - TΔS < 0; Kd = exp(ΔG/RT)",
    safetyImplication: "Off-target binding occurs when ΔG is favorable for unintended targets; selectivity = ΔΔG",
  },
  {
    number: 3,
    name: "Receptor State Conservation",
    statement: "Total receptor number is conserved across states: free, bound, and desensitized.",
    formula: "R_total = R_free + R_bound + R_desensitized = constant",
    safetyImplication: "Sustained occupancy leads to desensitization (tolerance) or upregulation (dependence)",
  },
  {
    number: 4,
    name: "Pathway Flux Conservation",
    statement: "Signal flux through a pathway must be conserved at steady state.",
    formula: "Σ J_in = Σ J_out at each node",
    safetyImplication: "Blocking one pathway may cause compensatory toxicity through parallel pathway activation",
  },
  {
    number: 5,
    name: "Enzyme Regeneration",
    statement: "Enzymes are regenerated after catalysis unless inactivated by mechanism-based inhibition.",
    formula: "E_total = E_free + ES + EI; dE_total/dt = k_syn - k_deg - k_inact[I]",
    safetyImplication: "Mechanism-based inhibitors permanently inactivate enzymes, causing prolonged toxicity",
  },
  {
    number: 6,
    name: "ADME Rate Conservation",
    statement: "The rate of drug amount change in any compartment equals rates in minus rates out.",
    formula: "dA/dt = Rate_in - Rate_out (per compartment)",
    safetyImplication: "Drug-drug interactions that alter ADME rates change exposure and toxicity risk",
  },
  {
    number: 7,
    name: "Signal Transduction Fidelity",
    statement: "Intracellular signaling cascades amplify but must preserve signal identity.",
    formula: "S_output = f(S_input) with SNR ≥ threshold",
    safetyImplication: "Off-target kinase inhibition corrupts signal identity, causing pleiotropic toxicity",
  },
  {
    number: 8,
    name: "Homeostatic Reserve",
    statement: "Biological systems maintain homeostasis within a finite reserve capacity.",
    formula: "R_homeostatic > ΔP for system stability",
    safetyImplication: "Toxicity occurs when perturbation magnitude exceeds homeostatic reserve capacity",
  },
  {
    number: 9,
    name: "Genetic Information Conservation",
    statement: "Germline DNA sequence is conserved; somatic mutations accumulate with exposure.",
    formula: "Mutation rate ∝ exposure × genotoxic potency",
    safetyImplication: "Genotoxic drugs violate genetic information conservation — carcinogenicity risk",
  },
  {
    number: 10,
    name: "Population Exposure Balance",
    statement: "Total population exposure equals sum of individual exposures across demographics.",
    formula: "E_pop = Σᵢ (dose_i × duration_i × N_i)",
    safetyImplication: "Subpopulation-specific toxicity emerges when exposure concentrates in vulnerable groups",
  },
  {
    number: 11,
    name: "Regulatory Budget",
    statement: "Regulatory actions consume finite resources; benefit-risk ratio must justify expenditure.",
    formula: "B/R ≥ threshold for continued market authorization",
    safetyImplication: "When cumulative safety signals shift B/R below threshold, market withdrawal follows",
  },
]

export function ConservationLaws() {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? laws : laws.slice(0, 6)

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        11 Conservation Laws of Pharmacovigilance
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        These are the constraint functions from Axiom 3. Violating any law moves the system
        state outside the safety manifold — that violation IS the adverse event.
      </p>

      <div className="space-y-3">
        {displayed.map((law) => (
          <div key={law.number} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {law.number}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{law.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{law.statement}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <code className="text-xs font-mono bg-muted/50 rounded px-2 py-1 text-primary">
                    {law.formula}
                  </code>
                </div>
                <p className="text-xs text-amber-400/80 mt-2">
                  Violation: {law.safetyImplication}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm text-primary hover:text-primary/80 font-medium"
        >
          Show all 11 laws (+{laws.length - displayed.length} more)
        </button>
      )}
    </div>
  )
}
