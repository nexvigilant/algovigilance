"use client"

import { useState } from "react"

interface Axiom {
  number: number
  name: string
  informal: string
  formal: string
  symbol: string
  implications: string[]
  example: string
}

const axioms: Axiom[] = [
  {
    number: 1,
    name: "System Decomposition",
    informal:
      "Any complex system capable of causing harm can be decomposed into a finite set of fundamental elements, each with quantifiable properties and defined interactions.",
    formal:
      "For every vigilance system V = (S, P, M, H) with state space (S, τ), there exists a finite element set E with |E| = n < ∞ and a composition function Φ: P(E) → S such that the decomposition (E, Φ) is complete.",
    symbol: "∀V : ∃E, Φ [ |E| < ∞ ∧ Φ: P(E) ↠ S_acc ]",
    implications: [
      "Every system has a finite atomic structure — no matter how complex",
      "Multiple valid decompositions may exist, but minimal ones share the same cardinality",
      "Elements have unique identifiers, property vectors, and interaction functions",
    ],
    example:
      "A drug-biological system decomposes into 15 elements: Drug, Target, Receptor, Enzyme, Transporter, Metabolite, Pathway, Cell, Organ, Biomarker, Genotype, Phenotype, Population, Regulatory, and Environment.",
  },
  {
    number: 2,
    name: "Hierarchical Organization",
    informal:
      "Complex systems exhibit hierarchical organization with discrete levels, where each level represents a distinct scale with emergent properties not present at lower levels.",
    formal:
      "For every vigilance system V with decomposition (E, Φ), there exists a hierarchy L = (L, ≺, ψ) with scale separation such that S decomposes into level state spaces with coarse-graining maps between them, and each higher level admits at least one emergent property.",
    symbol: "∀V : ∃L, {Sᵢ}, {πᵢ} : S ≅ ∏Sᵢ ∧ πᵢ: Sᵢ ↠ Sᵢ₊₁ ∧ ∀i: ∃Pᵢ₊₁ emergent",
    implications: [
      "Information is lost when moving up levels — coarse-graining maps are surjective, not bijective",
      "Emergent properties cannot be expressed as functions of the level below",
      "Scale separation ratio ε quantifies the gap between adjacent levels",
    ],
    example:
      "The Safety Hierarchy has 8 levels: Molecular → Subcellular → Cellular → Tissue → Organ → Systemic → Clinical → Regulatory. Hepatotoxicity (clinical) emerges from molecular perturbations that cannot predict the clinical phenotype alone.",
  },
  {
    number: 3,
    name: "Conservation Constraints",
    informal:
      "System behavior is governed by conservation laws — mathematical constraints that must be satisfied for safe operation. Harm occurs when any constraint is violated.",
    formal:
      "For every vigilance system V with harm specification H, there exists a finite constraint set G = {g₁, ..., gₘ} such that harm event H occurs if and only if the system state leaves the feasible region defined by all constraints being satisfied.",
    symbol: "∀V : ∃G = {gᵢ} : H ⟺ ∃i: gᵢ(s, u, θ) > 0",
    implications: [
      "Harm decomposes by constraint — each violated constraint corresponds to a specific harm type",
      "Active constraints (margin = 0) are the rate-limiting safety factors",
      "The feasible region is the intersection of all constraint half-spaces",
    ],
    example:
      "11 Conservation Laws of Pharmacovigilance: Drug Mass Balance, Thermodynamic Binding, Receptor State, Pathway Flux, Enzyme Regeneration, ADME Rate, Signal Transduction, Homeostatic Reserve, Genetic Information, Population Exposure, and Regulatory Budget.",
  },
  {
    number: 4,
    name: "Safety Manifold",
    informal:
      "The set of safe system states forms a manifold in state space, bounded by constraint surfaces. Harm is the event of the system state crossing the manifold boundary.",
    formal:
      "For every vigilance system V with constraint set G, the safety manifold Ω = ∩{s: gᵢ(s,u,θ) ≤ 0} is a manifold with boundary, has non-empty interior, and harm event H equals the first passage time of the system trajectory to the complement of Ω.",
    symbol: "Ω = ∩ᵢ{s ∈ S : gᵢ ≤ 0}, int(Ω) ≠ ∅, H = {τ_∂Ω < ∞}",
    implications: [
      "Safety margin d(s) = distance to boundary — quantifies how close the system is to harm",
      "The rate-limiting constraint is the one with the smallest margin",
      "Manifold geometry enables gradient-based risk prediction",
    ],
    example:
      "For a drug with hepatotoxic potential, the safety manifold boundary is the ALT threshold (3× ULN). The safety margin shrinks as exposure increases. Crossing ∂Ω triggers a safety signal.",
  },
  {
    number: 5,
    name: "Hierarchical Emergence",
    informal:
      "Harm is an emergent phenomenon — it manifests at higher hierarchical levels than its mechanistic origin. Propagation probability depends on magnitude, network position, buffering, duration, and susceptibility.",
    formal:
      "Given a perturbation at level ℓᵢ, the probability of propagation to level ℓᵢ₊₁ is a function of perturbation magnitude, network centrality, buffering capacity, exposure duration, and individual genotype. Clinical harm probability is the product of all level transition probabilities.",
    symbol: "P(Clinical | Molecular) = ∏ᵢ P(ℓᵢ₊₁ | ℓᵢ)",
    implications: [
      "Most molecular perturbations do NOT propagate to clinical harm — buffering absorbs them",
      "Hub nodes (highly connected proteins) amplify propagation probability",
      "Sustained exposure overcomes buffering that would absorb transient perturbations",
    ],
    example:
      "A drug binds off-target at the molecular level (Level 1). If the target is a hub in the protein interaction network, perturbation propagates to the pathway level. If buffering capacity is exceeded, it reaches the organ level. If the patient has a susceptible genotype, clinical manifestation occurs.",
  },
]

export function AxiomCards() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground mb-4">The Five Axioms</h2>
      {axioms.map((axiom) => (
        <div
          key={axiom.number}
          className="rounded-lg border border-border bg-card overflow-hidden transition-all"
        >
          <button
            onClick={() => setExpanded(expanded === axiom.number ? null : axiom.number)}
            className="w-full text-left p-5 flex items-start gap-4 hover:bg-muted/30 transition-colors"
          >
            <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              {axiom.number}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                Axiom {axiom.number}: {axiom.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {axiom.informal}
              </p>
            </div>
            <span className="flex-shrink-0 text-muted-foreground text-lg mt-1">
              {expanded === axiom.number ? "−" : "+"}
            </span>
          </button>

          {expanded === axiom.number && (
            <div className="px-5 pb-5 pt-0 border-t border-border">
              <div className="mt-4 space-y-4">
                <div className="rounded-md bg-muted/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Formal Statement
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{axiom.formal}</p>
                </div>

                <div className="rounded-md bg-primary/5 border border-primary/20 p-4">
                  <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">
                    Symbolic Formulation
                  </p>
                  <code className="text-sm text-foreground font-mono">{axiom.symbol}</code>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Key Implications
                  </p>
                  <ul className="space-y-1.5">
                    {axiom.implications.map((imp, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary mt-0.5 flex-shrink-0">-</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Concrete Example
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    {axiom.example}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
