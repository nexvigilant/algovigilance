"use client"

import { useState } from "react"

interface DomainParallel {
  domain: string
  intervention: string
  intendedEffect: string
  pharmakonShadow: string
  vulnerablePopulation: string
}

const domains: DomainParallel[] = [
  {
    domain: "Pharmaceuticals",
    intervention: "Drug therapy",
    intendedEffect: "Treat/prevent disease",
    pharmakonShadow: "Adverse drug reactions, drug interactions, dependence",
    vulnerablePopulation: "Elderly, pediatric, pregnant, pharmacogenomic variants",
  },
  {
    domain: "Artificial Intelligence",
    intervention: "ML model deployment",
    intendedEffect: "Automate decisions, augment analysis",
    pharmakonShadow: "Bias amplification, hallucination, surveillance overreach",
    vulnerablePopulation: "Marginalized communities, low-literacy users, dependent populations",
  },
  {
    domain: "Public Policy",
    intervention: "Regulation, legislation",
    intendedEffect: "Protect public welfare",
    pharmakonShadow: "Unintended economic harm, perverse incentives, regulatory capture",
    vulnerablePopulation: "Small businesses, marginalized groups, those without political voice",
  },
  {
    domain: "Education",
    intervention: "Standardized curriculum",
    intendedEffect: "Equalize learning outcomes",
    pharmakonShadow: "Creative suppression, teaching to the test, disengagement",
    vulnerablePopulation: "Neurodiverse learners, non-standard backgrounds",
  },
  {
    domain: "Surgery",
    intervention: "Surgical procedure",
    intendedEffect: "Repair, remove, reconstruct",
    pharmakonShadow: "Surgical complications, anesthesia risks, nosocomial infections",
    vulnerablePopulation: "Elderly, immunocompromised, those with comorbidities",
  },
  {
    domain: "Technology",
    intervention: "Social media platform",
    intendedEffect: "Connect people, democratize information",
    pharmakonShadow: "Addiction, misinformation, mental health deterioration",
    vulnerablePopulation: "Adolescents, isolated individuals, politically naive",
  },
]

export function DomainParallels() {
  const [showAll, setShowAll] = useState(false)
  const displayed = showAll ? domains : domains.slice(0, 4)

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        The Pharmakon Across Domains
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Every domain deploying interventions at scale faces the same fundamental challenge:
        interventions designed to help cause harms that emerge unpredictably and disproportionately
        affect vulnerable populations.
      </p>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Domain</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Intervention</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Intended Effect</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Pharmakon Shadow</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Vulnerable Population</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((d, i) => (
                <tr
                  key={d.domain}
                  className={`border-b border-border/50 ${i % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
                >
                  <td className="p-3 font-medium text-foreground whitespace-nowrap">{d.domain}</td>
                  <td className="p-3 text-muted-foreground">{d.intervention}</td>
                  <td className="p-3 text-muted-foreground">{d.intendedEffect}</td>
                  <td className="p-3 text-amber-400/80">{d.pharmakonShadow}</td>
                  <td className="p-3 text-muted-foreground">{d.vulnerablePopulation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm text-primary hover:text-primary/80 font-medium"
        >
          Show all {domains.length} domains (+{domains.length - displayed.length} more)
        </button>
      )}
    </div>
  )
}
