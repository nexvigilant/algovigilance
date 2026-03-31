const methodologies = [
  {
    name: "Spontaneous Reporting",
    pvMethod: "FAERS, VigiBase, MedWatch — voluntary reports capturing suspected adverse events",
    universal: "Centralized harm databases with standardized reporting formats across any domain",
    gap: "Most domains have fragmented feedback but lack centralized databases or systematic analysis",
  },
  {
    name: "Signal Detection",
    pvMethod: "Disproportionality analysis (PRR, ROR, EBGM) — statistical screening for drug-event associations exceeding expected frequency",
    universal: "Apply the same algorithms to detect intervention-harm associations in any domain",
    gap: "Algorithms exist in silos but are rarely applied systematically outside pharma",
  },
  {
    name: "Causality Assessment",
    pvMethod: "WHO-UMC scale, Naranjo algorithm, Bradford Hill criteria — structured probability frameworks",
    universal: "Standardized scales for evaluating whether an intervention caused an observed harm",
    gap: "Causality outside pharma is ad hoc, politically charged, or absent. Attribution is binary, not probabilistic",
  },
  {
    name: "Benefit-Risk Assessment",
    pvMethod: "PrOACT-URL, BRAT, MCDA — structured frameworks weighing benefits against risks in context",
    universal: "Quantify both benefits AND harms systematically for any intervention",
    gap: "Benefits are typically quantified while harms remain qualitative or ignored",
  },
  {
    name: "Risk Minimization",
    pvMethod: "REMS, restricted distribution, black box warnings, Dear Healthcare Provider letters",
    universal: "Proactive harm reduction mechanisms built into intervention design",
    gap: "Risk minimization in other domains is reactive and unsystematic. No built-in harm mitigation",
  },
  {
    name: "Lifecycle Monitoring",
    pvMethod: "Continuous post-market surveillance — safety profiles evolve as populations and use patterns change",
    universal: "Ongoing vigilance as a continuous obligation for any deployed intervention",
    gap: "Policies pass and are forgotten. Technologies ship and move on. Lifecycle thinking is absent",
  },
]

export function MethodologyMapping() {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Methodology Translation
      </h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Pharmacovigilance has 60+ years of mature methodology for detecting, assessing, and
        managing intervention harms. Other domains do not. The translation is direct.
      </p>

      <div className="space-y-3">
        {methodologies.map((m) => (
          <div key={m.name} className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{m.name}</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                  PV Method
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.pvMethod}</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-3">
                <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
                  Universal Application
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.universal}</p>
              </div>
              <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-3">
                <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">
                  Current Gap
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.gap}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
