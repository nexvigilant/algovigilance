export function PharmakopnPrinciple() {
  const implications = [
    {
      title: "Harm is a Property, Not a Failure Mode",
      text: "Adverse effects are not defects. They are the inevitable shadow of action itself. The same molecular, structural, or systemic property that creates benefit creates risk.",
    },
    {
      title: "Precision is Asymptotic",
      text: "Every gain in selectivity reveals new off-target effects previously undetectable. We can narrow the scatter of effects, but we cannot eliminate it.",
    },
    {
      title: "Dose as Ratio, Not Threshold",
      text: "Both properties — remedy and poison — exist simultaneously at every dose. We are not crossing a threshold from safe to dangerous; we are shifting a ratio that was always present.",
    },
    {
      title: "Context Determines Expression",
      text: "The same intervention in a different body, system, population, or timing can flip from therapeutic to toxic. The power does not change — the receiving system determines which face manifests.",
    },
  ]

  return (
    <div className="mb-10">
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-3">The Pharmakon Principle</h2>
        <div className="rounded-md bg-muted/50 p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            The Greek word <span className="text-foreground font-medium italic">pharmakon</span> (φάρμακον)
            means simultaneously:
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
              Remedy / Medicine / Cure
            </span>
            <span className="px-3 py-1.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
              Poison / Toxin
            </span>
            <span className="px-3 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium">
              Charm / Spell / Scapegoat
            </span>
          </div>
        </div>

        <blockquote className="border-l-2 border-primary pl-4 italic text-foreground text-lg mb-4">
          &ldquo;Power cannot be directionally pure. What acts, acts in all directions.&rdquo;
        </blockquote>

        <p className="text-sm text-muted-foreground leading-relaxed">
          This was not linguistic imprecision. The ancients recognized a fundamental truth: the
          capacity to heal and the capacity to harm are not separate properties — they are
          manifestations of the same underlying power. Efficacy and danger are the same
          phenomenon observed from different vantage points.
        </p>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3">Four Implications</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {implications.map((imp, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <h4 className="text-sm font-semibold text-foreground">{imp.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{imp.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
