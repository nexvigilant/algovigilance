"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TipBox,
  RememberBox,
  JargonBuster,
} from "@/components/pv-for-nexvigilants";
import {
  Atom,
  Zap,
  Clock,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Beaker,
  Lightbulb,
  Layers,
  Binary,
  FlaskConical,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Axiom data
// ---------------------------------------------------------------------------

interface Axiom {
  id: string;
  name: string;
  symbol: string;
  formal: string;
  plain: string;
  pvConnection: string;
  physicsResult: string;
}

const AXIOMS: Axiom[] = [
  {
    id: "P1",
    name: "Conservation",
    symbol: "\u2203 = \u2202(\u00D7(\u03C2, \u2205))",
    formal: "Existence equals boundary applied to state composed with void",
    plain:
      "For something to exist, it needs three things: properties (state), a context (void), and edges that separate it from everything else (boundary). Remove any one and it vanishes.",
    pvConnection:
      "A drug safety signal exists when it has a boundary (PRR > 2.0) separating observed from expected, a state (the adverse event data), and a context (the background reporting rate). Missing any component = no signal.",
    physicsResult:
      "Holographic principle: information lives on surfaces, not in volumes",
  },
  {
    id: "P2",
    name: "Irreversibility",
    symbol: "\u2192(A,B) \u2227 A\u2260B \u21D2 \u00AC\u2192(B,A)",
    formal: "Causation does not reverse",
    plain:
      "Once something causes a change, you cannot uncause it. Effects do not become their own causes. Time has a direction because causality has a direction.",
    pvConnection:
      "A patient who experiences an adverse event cannot un-experience it. Reporting timelines run forward. Case seriousness only escalates, never de-escalates in the same event.",
    physicsResult:
      "Arrow of time + Second Law of Thermodynamics (entropy always increases)",
  },
  {
    id: "P3",
    name: "Void Quantization",
    symbol: "min(\u2205(\u2202)) = 1",
    formal: "Space comes in indivisible units",
    plain:
      "You cannot divide space forever. There is a smallest possible distance — a pixel of reality. Below that scale, the concept of 'here vs. there' stops making sense.",
    pvConnection:
      "Reporting databases have minimum resolution — you cannot detect a signal below a certain case count. The Evans criteria (N \u2265 3) are the 'pixels' of pharmacovigilance.",
    physicsResult: "Planck-scale quantization of spacetime",
  },
  {
    id: "P4",
    name: "Time Quantization",
    symbol: "min(\u03C3(\u2205)) = 1",
    formal: "Time comes in indivisible steps",
    plain:
      "You cannot divide time forever either. There is a shortest possible moment — a tick of the universe's clock. Between ticks, nothing happens because 'between' does not exist.",
    pvConnection:
      "Reporting periods are discrete (quarterly PSUR, 15-day expedited). You cannot detect a trend within a single reporting tick. Temporal resolution bounds signal detection.",
    physicsResult: "Planck time as the minimum duration",
  },
  {
    id: "P5",
    name: "Bandwidth Bound",
    symbol: "\u2205(\u2202)/\u03C3(\u2205) \u2264 c\u2080",
    formal: "There is a maximum propagation speed",
    plain:
      "Information cannot travel infinitely fast through void. There is a speed limit — the maximum number of spatial pixels you can cross per time tick. We call this limit c (the speed of light).",
    pvConnection:
      "Safety signals propagate at finite speed through the reporting system. A signal in FAERS takes months to accumulate sufficient cases. The 'speed of pharmacovigilance' is bounded by reporting rates.",
    physicsResult: "Speed of light as the bandwidth of void",
  },
  {
    id: "P6",
    name: "Bilinearity",
    symbol: "\u00D7(a+b, c) = \u00D7(a,c) + \u00D7(b,c)",
    formal: "Composition distributes over combination",
    plain:
      "When two things combine with a third, the result equals combining each separately and adding. This is the simplest possible rule for how things compose. It gives space its geometry.",
    pvConnection:
      "Drug-receptor interactions are approximately bilinear at therapeutic doses (doubling dose roughly doubles effect). At high doses, bilinearity breaks down — just as it does at the Planck scale in physics.",
    physicsResult: "Quadratic spacetime metric \u2192 E = mc\u00B2",
  },
];

// ---------------------------------------------------------------------------
// Derivation steps
// ---------------------------------------------------------------------------

interface DerivationStep {
  title: string;
  axioms: string[];
  statement: string;
  explanation: string;
}

const SR_DERIVATION: DerivationStep[] = [
  {
    title: "Bilinearity gives geometry",
    axioms: ["P6"],
    statement:
      "The composition operator \u00D7 induces a quadratic metric: ds\u00B2 = g dx\u00B2",
    explanation:
      "Because composition distributes over addition, the natural way to measure distance in void is a sum of squared terms. This is not assumed \u2014 it follows from the algebra of how things combine.",
  },
  {
    title: "Irreversibility separates space from time",
    axioms: ["P2"],
    statement:
      "The metric has mixed signature: ds\u00B2 = \u2212c\u2080\u00B2d\u03C3\u00B2 + d(\u2205\u2202)\u00B2",
    explanation:
      "Because causality only runs forward (P2), time is fundamentally different from space. You can walk left or right, but not backward through time. The minus sign encodes this asymmetry.",
  },
  {
    title: "The bandwidth bound sets the scale",
    axioms: ["P5"],
    statement:
      "c\u2080 appears as the conversion factor between space and time units",
    explanation:
      "The maximum speed (P5) determines how space-pixels and time-ticks relate in the metric. This is the speed of light \u2014 not a property of light, but a property of void itself.",
  },
  {
    title: "Conservation gives us mass",
    axioms: ["P1"],
    statement: "\u2203 is a conserved quantity that persists through time",
    explanation:
      "The conservation law (P1) says bounded-state-in-void persists. This persistence through the metric is what we call mass \u2014 something that endures across causal steps.",
  },
  {
    title: "Noether\u2019s theorem delivers E = mc\u00B2",
    axioms: ["P1", "P2", "P5", "P6"],
    statement:
      "The conserved energy of stationary \u2203 is \u2203 \u00D7 c\u2080\u00B2",
    explanation:
      "Noether\u2019s theorem (pure mathematics, 1918) says every symmetry has a conserved quantity. Time-translation symmetry of our derived metric gives a conserved energy. For mass at rest, that energy is mc\u00B2. Einstein\u2019s most famous equation falls out of six information axioms.",
  },
];

const QM_DERIVATION: DerivationStep[] = [
  {
    title: "Discrete void means multiple paths",
    axioms: ["P3", "P4"],
    statement: "Between any two points, there are finitely many causal paths",
    explanation:
      "Because space and time come in discrete units (P3, P4), you can count the paths between point A and point B. In continuous space there would be infinitely many \u2014 but in quantized void, the number is finite.",
  },
  {
    title: "Conservation weights each path by action",
    axioms: ["P1"],
    statement: "\u03C8(x,t) = \u03A3 exp(iS/\u210F) over all paths",
    explanation:
      "Each path carries an amount of action (existence \u00D7 distance\u00B2 / time). Conservation (P1) requires that we sum over ALL paths, weighting each by its action. This is Feynman\u2019s path integral \u2014 the foundation of quantum mechanics.",
  },
  {
    title: "The imaginary unit comes from irreversibility",
    axioms: ["P2"],
    statement: "i encodes the boundary between space and time",
    explanation:
      "The i in quantum mechanics is not mysterious. It\u2019s the mathematical encoding of the fact that time is different from space (P2). It rotates between the spatial and temporal dimensions of void. No irreversibility = no i = no quantum mechanics.",
  },
  {
    title: "Expanding the sum gives Schr\u00F6dinger",
    axioms: ["P1", "P2", "P3", "P4", "P6"],
    statement: "i\u210F \u2202\u03C8/\u2202t = \u0124\u03C8",
    explanation:
      "Expanding the path integral to first order in the time step produces the Schr\u00F6dinger equation \u2014 the master equation of quantum mechanics. Every piece traces to an axiom: i from P2, \u210F from P3+P4, the Laplacian from P6, the wave function from P1.",
  },
];

// ---------------------------------------------------------------------------
// Results table
// ---------------------------------------------------------------------------

interface PhysicsResult {
  name: string;
  axioms: string;
  status: "derived" | "predicted" | "argued" | "structural";
  year: string;
}

const RESULTS: PhysicsResult[] = [
  {
    name: "Holographic principle",
    axioms: "P1",
    status: "derived",
    year: "1973",
  },
  { name: "Arrow of time", axioms: "P2", status: "derived", year: "~1850" },
  {
    name: "Second Law of Thermodynamics",
    axioms: "P2",
    status: "derived",
    year: "~1850",
  },
  {
    name: "Planck-scale quantization",
    axioms: "P3 + P4",
    status: "predicted",
    year: "1990s",
  },
  {
    name: "Maximum propagation speed",
    axioms: "P3\u2013P5",
    status: "derived",
    year: "1905",
  },
  {
    name: "E = mc\u00B2",
    axioms: "P1\u2013P6",
    status: "derived",
    year: "1905",
  },
  {
    name: "Schr\u00F6dinger equation",
    axioms: "P1\u2013P4, P6",
    status: "derived",
    year: "1926",
  },
  {
    name: "Heisenberg uncertainty",
    axioms: "P3 + P4",
    status: "argued",
    year: "1927",
  },
  {
    name: "Planck-scale MDR",
    axioms: "P3 + P6",
    status: "predicted",
    year: "TBD",
  },
  {
    name: "QM/GR unification structure",
    axioms: "All",
    status: "structural",
    year: "Open",
  },
];

function statusBadge(status: PhysicsResult["status"]) {
  switch (status) {
    case "derived":
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          Derived
        </Badge>
      );
    case "predicted":
      return (
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          Predicted
        </Badge>
      );
    case "argued":
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          Argued
        </Badge>
      );
    case "structural":
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          Structural
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// METS cards
// ---------------------------------------------------------------------------

interface METSCard {
  name: string;
  symbol: string;
  decomposition: string;
  icon: typeof Atom;
  color: string;
}

const METS: METSCard[] = [
  {
    name: "Matter",
    symbol: "\u2203 = \u2202(\u00D7(\u03C2, \u2205))",
    decomposition: "Bounded state composed with void",
    icon: Atom,
    color: "text-emerald-400",
  },
  {
    name: "Energy",
    symbol: "\u03BD(\u2192)",
    decomposition: "Frequency of causation",
    icon: Zap,
    color: "text-amber-400",
  },
  {
    name: "Time",
    symbol: "\u03C3(\u2205)",
    decomposition: "Sequence through void",
    icon: Clock,
    color: "text-cyan-400",
  },
  {
    name: "Space",
    symbol: "\u2205(\u2202)",
    decomposition: "Void structured by boundaries",
    icon: Maximize2,
    color: "text-purple-400",
  },
];

// ---------------------------------------------------------------------------
// Derivation stepper component
// ---------------------------------------------------------------------------

function DerivationStepper({
  steps,
  title,
}: {
  steps: DerivationStep[];
  title: string;
}) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];

  return (
    <Card className="border-slate-700/50 bg-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-100">
            {title}
          </CardTitle>
          <span className="text-sm text-slate-400">
            Step {current + 1} of {steps.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="flex gap-1 mt-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= current ? "bg-gold" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-slate-100 mb-1">
            {step.title}
          </h3>
          <div className="flex gap-1 mb-3">
            {step.axioms.map((a) => (
              <Badge
                key={a}
                variant="outline"
                className="text-xs border-gold/40 text-gold"
              >
                {a}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-slate-800/80 border border-slate-700/50 px-4 py-3">
          <p className="text-sm font-mono text-cyan-300">{step.statement}</p>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {step.explanation}
        </p>

        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="text-slate-400 hover:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
            disabled={current === steps.length - 1}
            className="text-slate-400 hover:text-slate-200"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PrimitivePhysics() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">
          Where Do the Laws of Physics Come From?
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl">
          Six rules about information — the same ones that power AlgoVigilance
          signal detection — derive both Einstein&apos;s relativity and quantum
          mechanics. No physics is assumed. The equations emerge.
        </p>
      </div>

      <RememberBox>
        The axioms below encode <strong>zero known physics equations</strong>.
        They describe properties of information: boundaries, causality,
        discreteness, and composition. The physics falls out as a consequence.
      </RememberBox>

      {/* METS Decomposition */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">
          Matter, Energy, Time, and Space Are Not Fundamental
        </h2>
        <p className="text-sm text-slate-400">
          Physics treats these four as bedrock. The primitive framework shows
          they are composites — each one built from more basic informational
          building blocks.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {METS.map((m) => (
            <Card key={m.name} className="border-slate-700/50 bg-slate-900/50">
              <CardContent className="pt-5 pb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                  <span className="font-semibold text-slate-100">{m.name}</span>
                </div>
                <p className="text-xs font-mono text-cyan-300">{m.symbol}</p>
                <p className="text-xs text-slate-400">{m.decomposition}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <TipBox>
          In natural units (where c = 1), Matter and Energy are{" "}
          <strong>identical</strong> — both are{" "}
          <JargonBuster
            term="existence"
            definition="The conserved quantity in the conservation law: bounded state composed with void"
          >
            existence
          </JargonBuster>
          . The c\u00B2 in E = mc\u00B2 is just a unit conversion from measuring
          space and time on different scales.
        </TipBox>
      </section>

      {/* The Six Axioms */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">The Six Axioms</h2>
        <p className="text-sm text-slate-400">
          Each axiom states a property of information. None mention mass,
          energy, force, or any physics concept. The PV connection shows how the
          same principle appears in drug safety.
        </p>

        <div className="space-y-3">
          {AXIOMS.map((axiom) => (
            <Card
              key={axiom.id}
              className="border-slate-700/50 bg-slate-900/50"
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-4">
                  <Badge
                    variant="outline"
                    className="mt-0.5 shrink-0 border-gold/50 text-gold font-mono text-sm px-2"
                  >
                    {axiom.id}
                  </Badge>
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-slate-100">
                        {axiom.name}
                      </span>
                      <code className="text-xs text-cyan-300 bg-slate-800/60 rounded px-1.5 py-0.5">
                        {axiom.symbol}
                      </code>
                    </div>
                    <p className="text-sm text-slate-300">{axiom.plain}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      <div className="rounded bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Beaker className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-400">
                            PV Connection
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {axiom.pvConnection}
                        </p>
                      </div>
                      <div className="rounded bg-cyan-500/5 border border-cyan-500/20 px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Lightbulb className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="text-xs font-medium text-cyan-400">
                            Physics Result
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {axiom.physicsResult}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Derivations */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">
          Two Pillars from Six Rules
        </h2>
        <p className="text-sm text-slate-400">
          Step through each derivation. Every step traces to an axiom or a
          mathematical theorem — no physics is assumed along the way.
        </p>

        <Tabs defaultValue="sr" className="w-full">
          <TabsList className="bg-slate-800/80 border border-slate-700/50">
            <TabsTrigger
              value="sr"
              className="data-[state=active]:bg-slate-700"
            >
              <Zap className="h-4 w-4 mr-1.5" />E = mc\u00B2
            </TabsTrigger>
            <TabsTrigger
              value="qm"
              className="data-[state=active]:bg-slate-700"
            >
              <Binary className="h-4 w-4 mr-1.5" />
              Schr\u00F6dinger Equation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sr" className="mt-4">
            <DerivationStepper
              steps={SR_DERIVATION}
              title="Deriving Special Relativity"
            />
          </TabsContent>

          <TabsContent value="qm" className="mt-4">
            <DerivationStepper
              steps={QM_DERIVATION}
              title="Deriving Quantum Mechanics"
            />
          </TabsContent>
        </Tabs>

        <RememberBox>
          Special Relativity uses axioms P1, P2, P5, P6 (conservation,
          irreversibility, bandwidth, bilinearity). Quantum Mechanics uses P1,
          P2, P3, P4, P6 (conservation, irreversibility, quantization,
          bilinearity). <strong>P2 and P6 appear in both</strong> — they are the
          shared foundation. P3 + P4 are what makes it quantum. P5 is what makes
          it relativistic.
        </RememberBox>
      </section>

      {/* Unification Insight */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">
          Why Unifying QM and GR Is Hard (And Where the Answer Lives)
        </h2>
        <Card className="border-slate-700/50 bg-slate-900/50">
          <CardContent className="pt-5 pb-4 space-y-3">
            <p className="text-sm text-slate-300">
              The biggest open problem in physics: quantum mechanics and general
              relativity contradict each other. QM needs discrete spacetime. GR
              needs smooth geometry. Both are correct in their domains. Neither
              works in the other&apos;s.
            </p>
            <p className="text-sm text-slate-300">
              In the primitive framework, the answer is structural:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                <div className="text-xs font-medium text-cyan-400 mb-1">
                  Quantum Mechanics
                </div>
                <p className="text-xs text-slate-400">
                  P3 + P4 (discrete void and time) produce sum-over-paths,
                  superposition, and uncertainty.
                </p>
              </div>
              <div className="rounded bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                <div className="text-xs font-medium text-amber-400 mb-1">
                  General Relativity
                </div>
                <p className="text-xs text-slate-400">
                  P6 (bilinearity) produces smooth quadratic geometry,
                  curvature, and the metric that gravity bends.
                </p>
              </div>
              <div className="rounded bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                <div className="text-xs font-medium text-purple-400 mb-1">
                  Quantum Gravity
                </div>
                <p className="text-xs text-slate-400">
                  Where P3/P4 meet P6 — the scale where discrete pixels
                  challenge smooth geometry. The composition operator \u00D7
                  becomes nonlinear.
                </p>
              </div>
            </div>
            <TipBox>
              The PV analogy: dose-response is bilinear (linear) at therapeutic
              doses but becomes nonlinear at saturation. The same structural
              transition — bilinearity breaking down at extremes — appears in
              both pharmacology and quantum gravity.
            </TipBox>
          </CardContent>
        </Card>
      </section>

      {/* Results Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">
          What Falls Out of Six Rules
        </h2>
        <Card className="border-slate-700/50 bg-slate-900/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/40">
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium">
                      Result
                    </th>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium">
                      Axioms
                    </th>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-2.5 text-slate-400 font-medium">
                      Known Since
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.map((r) => (
                    <tr
                      key={r.name}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-2.5 text-slate-200">{r.name}</td>
                      <td className="px-4 py-2.5">
                        <code className="text-xs text-cyan-300">
                          {r.axioms}
                        </code>
                      </td>
                      <td className="px-4 py-2.5">{statusBadge(r.status)}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs">
                        {r.year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Novel Prediction */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">
          The Novel Prediction
        </h2>
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="pt-5 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-cyan-400" />
              <span className="font-semibold text-cyan-300">
                Modified Dispersion Relation at Planck Scale
              </span>
            </div>
            <p className="text-sm text-slate-300">
              P3 (space has pixels) + P6 (composition is bilinear) together
              predict that bilinearity breaks down at the smallest scales. When{" "}
              <JargonBuster
                term="boundary bits"
                definition="The minimum discrete unit of spatial structure — the pixel of reality"
              >
                boundary bits
              </JargonBuster>{" "}
              approach their minimum size, the composition operator \u00D7
              becomes nonlinear. Consequence: E = mc\u00B2 acquires tiny
              corrections at extreme energies.
            </p>
            <p className="text-sm text-slate-300">
              <strong>Testable:</strong> High-energy photons from distant
              gamma-ray bursts should travel at very slightly different speeds
              depending on their energy. The Fermi Gamma-ray Space Telescope has
              already placed bounds on this effect.
            </p>
            <p className="text-sm text-slate-400">
              Existing theories (Modified Dispersion Relations) propose this
              phenomenologically. The primitive framework derives the mechanism:
              \u00D7 becomes nonlinear where P3 dominates.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Connection to AlgoVigilance */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-100">
          Why This Matters for Drug Safety
        </h2>
        <Card className="border-gold/30 bg-gold/5">
          <CardContent className="pt-5 pb-4 space-y-3">
            <p className="text-sm text-slate-300">
              AlgoVigilance&apos;s signal detection tools — PRR, ROR, IC, EBGM —
              are not arbitrary statistical formulas. They are derived from the
              same six axioms that produce Einstein&apos;s relativity and
              Schr\u00F6dinger&apos;s quantum mechanics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers className="h-3.5 w-3.5 text-gold" />
                  <span className="text-xs font-medium text-gold">
                    Same Conservation Law
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  P1 (\u2203 = \u2202(\u00D7(\u03C2, \u2205))) governs both the
                  holographic principle in physics and the existence criteria
                  for drug safety signals. A signal without boundaries, state,
                  or context does not exist — in pharmacovigilance or in
                  physics.
                </p>
              </div>
              <div className="rounded bg-slate-800/60 border border-slate-700/40 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Layers className="h-3.5 w-3.5 text-gold" />
                  <span className="text-xs font-medium text-gold">
                    Same Boundary Operator
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  The \u2202 in the conservation law is the same operator that
                  creates the Minkowski metric (physics) and computes
                  disproportionality ratios (PV). Different \u2202 applied to
                  the same data gives PRR vs. ROR vs. IC vs. EBGM.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Attribution */}
      <div className="border-t border-slate-800 pt-6 pb-2">
        <p className="text-xs text-slate-500">
          Lex Primitiva and the P1\u2013P6 axiom system by Matthew A. Campion,
          PharmD. Conservation law from the Crystalbook v2.0. Derivations
          developed 2026-03-25.
        </p>
      </div>
    </div>
  );
}
