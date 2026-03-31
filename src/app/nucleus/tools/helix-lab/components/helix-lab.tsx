"use client";

import { useState, useCallback, useMemo } from "react";
import { Dna, FlaskConical, ArrowUpDown, Zap, Shield, Eye } from "lucide-react";

// ── Helix Computing Engine (client-side, mirrors nexcore-helix) ──

type NucChar = "A" | "T" | "G" | "C";

function quantize(v: number): NucChar {
  if (v < 0.25) return "A";
  if (v < 0.5) return "T";
  if (v < 0.75) return "G";
  return "C";
}

const _NUC_MID: Record<NucChar, number> = {
  A: 0.125,
  T: 0.375,
  G: 0.625,
  C: 0.875,
};
const NUC_COMP: Record<NucChar, NucChar> = { A: "T", T: "A", G: "C", C: "G" };
const NUC_UP: Record<NucChar, NucChar> = { A: "T", T: "G", G: "C", C: "C" };
const NUC_DOWN: Record<NucChar, NucChar> = { C: "G", G: "T", T: "A", A: "A" };
const NUC_COLOR: Record<NucChar, string> = {
  A: "text-red-400",
  T: "text-yellow-400",
  G: "text-blue-400",
  C: "text-emerald-400",
};
const NUC_BG: Record<NucChar, string> = {
  A: "bg-red-900/40",
  T: "bg-yellow-900/40",
  G: "bg-blue-900/40",
  C: "bg-emerald-900/40",
};
const NUC_LABEL: Record<NucChar, string> = {
  A: "Collapsing",
  T: "Weak",
  G: "Moderate",
  C: "Strong",
};

interface ConservationResult {
  existence: number;
  classification: string;
  weakest: string;
  weakestSymbol: string;
  dBoundary: number;
  dState: number;
  dVoid: number;
  highestLeverage: string;
  viceRisk: string;
  bindingLaws: string;
  codon: string;
  isStop: boolean;
}

function computeConservation(
  b: number,
  s: number,
  v: number,
): ConservationResult {
  const existence = b * s * v;
  const classification =
    existence >= 0.5
      ? "Strong"
      : existence >= 0.2
        ? "Moderate"
        : existence >= 0.05
          ? "Weak"
          : "Collapsing";

  let weakest: string,
    weakestSymbol: string,
    viceRisk: string,
    bindingLaws: string;
  if (b <= s && b <= v) {
    weakest = "Boundary";
    weakestSymbol = "∂";
    viceRisk = "Pride, Lust, Corruption";
    bindingLaws =
      "Law 1 (True Measure), Law 3 (Bounded Pursuit), Law 8 (Sovereign Boundary)";
  } else if (s <= v) {
    weakest = "State";
    weakestSymbol = "ς";
    viceRisk = "Greed, Gluttony, Sloth";
    bindingLaws =
      "Law 2 (Sufficient Portion), Law 5 (Measured Intake), Law 7 (Active Maintenance)";
  } else {
    weakest = "Void";
    weakestSymbol = "∅";
    viceRisk = "Envy, Wrath";
    bindingLaws = "Law 4 (Generous Witness), Law 6 (Measured Response)";
  }

  const dBoundary = s * v;
  const dState = b * v;
  const dVoid = b * s;
  const highestLeverage =
    dBoundary >= dState && dBoundary >= dVoid
      ? "∂ (sharpen boundary)"
      : dState >= dVoid
        ? "ς (enrich state)"
        : "∅ (clarify void)";

  const codon = quantize(b) + quantize(s) + quantize(v);
  const isStop = codon.includes("A");

  return {
    existence,
    classification,
    weakest,
    weakestSymbol,
    dBoundary,
    dState,
    dVoid,
    highestLeverage,
    viceRisk,
    bindingLaws,
    codon,
    isStop,
  };
}

// ── DNA Strand Operations ──

interface Product {
  name: string;
  boundary: number;
  state: number;
  void_: number;
}

const DEFAULT_PRODUCTS: Product[] = [
  { name: "Station", boundary: 0.95, state: 0.85, void_: 0.7 },
  { name: "Nucleus", boundary: 0.6, state: 0.4, void_: 0.3 },
  { name: "Micrograms", boundary: 0.9, state: 0.9, void_: 0.8 },
  { name: "NexCore", boundary: 0.85, state: 0.7, void_: 0.6 },
  { name: "Academy", boundary: 0.3, state: 0.15, void_: 0.2 },
];

function complementStrand(strand: string): string {
  return strand
    .split("")
    .map((c) => NUC_COMP[c as NucChar] ?? c)
    .join("");
}

function transformStrand(
  strand: string,
  t: "strengthen" | "weaken" | "complement" | "equilibrate",
): string {
  const codons: string[] = [];
  for (let i = 0; i < strand.length; i += 3) {
    codons.push(strand.slice(i, i + 3));
  }
  return codons
    .map((codon) => {
      const [a, b, c] = codon.split("") as NucChar[];
      switch (t) {
        case "complement":
          return NUC_COMP[a] + NUC_COMP[b] + NUC_COMP[c];
        case "strengthen":
          return NUC_UP[a] + NUC_UP[b] + NUC_UP[c];
        case "weaken":
          return NUC_DOWN[a] + NUC_DOWN[b] + NUC_DOWN[c];
        case "equilibrate": {
          const vals = [a, b, c]
            .map((n) => ({ A: 0, T: 1, G: 2, C: 3 })[n])
            .sort();
          const med = (["A", "T", "G", "C"] as NucChar[])[vals[1]];
          return med + med + med;
        }
      }
    })
    .join("");
}

function strandHealth(strand: string): number {
  let stops = 0,
    total = 0;
  for (let i = 0; i < strand.length; i += 3) {
    total++;
    if (strand.slice(i, i + 3).includes("A")) stops++;
  }
  return total === 0 ? 0 : (total - stops) / total;
}

// ── Components ──

function NucleotideDisplay({ nuc }: { nuc: string }) {
  return (
    <span className="inline-flex gap-0">
      {nuc.split("").map((c, i) => (
        <span
          key={i}
          className={`font-mono font-bold text-lg ${NUC_COLOR[c as NucChar] ?? "text-zinc-400"}`}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

function CodonCard({ codon, label }: { codon: string; label: string }) {
  const isStop = codon.includes("A");
  const [a, b, c] = codon.split("") as NucChar[];
  return (
    <div
      className={`rounded-lg p-3 border ${isStop ? "border-red-700 bg-red-950/30" : "border-zinc-700 bg-zinc-900/50"}`}
    >
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="flex gap-1 items-center">
        {[a, b, c].map((n, i) => (
          <span
            key={i}
            className={`font-mono text-xl font-bold px-1.5 py-0.5 rounded ${NUC_BG[n]} ${NUC_COLOR[n]}`}
          >
            {n}
          </span>
        ))}
        {isStop && (
          <span className="text-[10px] text-red-400 ml-1 font-mono">STOP</span>
        )}
      </div>
      <div className="flex gap-1 mt-1">
        {[a, b, c].map((n, i) => (
          <span key={i} className="text-[10px] text-zinc-500">
            {["∂", "ς", "∅"][i]}={NUC_LABEL[n]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Slider({
  label,
  symbol,
  value,
  onChange,
}: {
  label: string;
  symbol: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const nuc = quantize(value);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">
          {symbol} {label}
        </span>
        <span className={`font-mono font-bold ${NUC_COLOR[nuc]}`}>
          {value.toFixed(2)} ({nuc})
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full accent-emerald-500 h-2"
      />
    </div>
  );
}

// ── Main Lab Component ──

export function HelixLab() {
  const [boundary, setBoundary] = useState(0.97);
  const [state, setState] = useState(0.14);
  const [void_, setVoid] = useState(0.67);
  const [activeTab, setActiveTab] = useState<"conservation" | "dna" | "engine">(
    "conservation",
  );
  const [transformHistory, setTransformHistory] = useState<
    { name: string; before: string; after: string }[]
  >([]);

  const result = useMemo(
    () => computeConservation(boundary, state, void_),
    [boundary, state, void_],
  );

  const products = useMemo(() => DEFAULT_PRODUCTS, []);
  const strand = useMemo(
    () =>
      products
        .map(
          (p) => quantize(p.boundary) + quantize(p.state) + quantize(p.void_),
        )
        .join(""),
    [products],
  );
  const [currentStrand, setCurrentStrand] = useState(strand);

  const applyTransform = useCallback(
    (t: "strengthen" | "weaken" | "complement" | "equilibrate") => {
      const before = currentStrand;
      const after = transformStrand(currentStrand, t);
      setCurrentStrand(after);
      setTransformHistory((h) => [...h, { name: t, before, after }]);
    },
    [currentStrand],
  );

  const classColor = (c: string) => {
    if (c === "Strong") return "text-emerald-400";
    if (c === "Moderate") return "text-blue-400";
    if (c === "Weak") return "text-yellow-400";
    return "text-red-400";
  };

  const tabs = [
    { id: "conservation" as const, label: "Conservation", icon: Shield },
    { id: "dna" as const, label: "DNA Encoder", icon: Dna },
    { id: "engine" as const, label: "Involutionary Engine", icon: Zap },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-emerald-400" />
          <h1 className="text-2xl font-bold text-zinc-100">
            Helix Computing Lab
          </h1>
        </div>
        <p className="text-zinc-400 text-sm font-mono">
          ∃ = ∂(×(ς, ∅)) — Conservation Law as Computable Geometry
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel 1: Conservation Calculator */}
      {activeTab === "conservation" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-6 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              Primitives
            </h2>
            <Slider
              label="Boundary"
              symbol="∂"
              value={boundary}
              onChange={setBoundary}
            />
            <Slider
              label="State"
              symbol="ς"
              value={state}
              onChange={setState}
            />
            <Slider label="Void" symbol="∅" value={void_} onChange={setVoid} />

            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-sm text-zinc-400 mb-2">Presets</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "AlgoVigilance", b: 0.97, s: 0.14, v: 0.67 },
                  { label: "Balanced", b: 0.7, s: 0.7, v: 0.7 },
                  { label: "Strong", b: 0.9, s: 0.9, v: 0.9 },
                  { label: "Collapsing", b: 0.1, s: 0.05, v: 0.1 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setBoundary(p.b);
                      setState(p.s);
                      setVoid(p.v);
                    }}
                    className="px-3 py-1 rounded-md bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Existence Score */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="text-sm text-zinc-500 mb-1">Existence (∃)</div>
              <div
                className={`text-4xl font-mono font-bold ${classColor(result.classification)}`}
              >
                {result.existence.toFixed(4)}
              </div>
              <div
                className={`text-sm font-mono ${classColor(result.classification)}`}
              >
                {result.classification.toUpperCase()}
              </div>
            </div>

            {/* Codon */}
            <CodonCard codon={result.codon} label="DNA Codon" />

            {/* Derivatives */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-2">
              <div className="text-sm text-zinc-400">Partial Derivatives</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-zinc-500">∂∃/∂∂</div>
                  <div className="font-mono text-sm text-zinc-200">
                    {result.dBoundary.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">∂∃/∂ς</div>
                  <div className="font-mono text-sm text-zinc-200">
                    {result.dState.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">∂∃/∂∅</div>
                  <div className="font-mono text-sm text-zinc-200">
                    {result.dVoid.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-emerald-400 pt-1">
                Highest leverage: {result.highestLeverage}
              </div>
            </div>

            {/* Weakest + Laws */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-400">
                  Weakest:{" "}
                  <span className="text-yellow-400">
                    {result.weakestSymbol} ({result.weakest})
                  </span>
                </span>
              </div>
              <div className="text-xs text-zinc-500">{result.viceRisk}</div>
              <div className="text-xs text-zinc-500">{result.bindingLaws}</div>
            </div>
          </div>
        </div>
      )}

      {/* Panel 2: DNA Encoder */}
      {activeTab === "dna" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2 mb-4">
              <Dna className="w-5 h-5 text-blue-400" />
              Product Portfolio as DNA
            </h2>

            <div className="space-y-3">
              {products.map((p, i) => {
                const r = computeConservation(p.boundary, p.state, p.void_);
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400 w-24">{p.name}</span>
                    <CodonCard codon={r.codon} label="" />
                    <span
                      className={`text-sm font-mono ${classColor(r.classification)}`}
                    >
                      {r.classification}
                    </span>
                    <span className="text-xs text-zinc-500">
                      ∃={r.existence.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              <div className="text-sm text-zinc-400 mb-2">Full Strand</div>
              <div className="font-mono text-xl tracking-wider">
                <NucleotideDisplay nuc={strand} />
              </div>
              <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                <span>Health: {(strandHealth(strand) * 100).toFixed(0)}%</span>
                <span>
                  Stop codons:{" "}
                  {strand.match(/.{3}/g)?.filter((c) => c.includes("A"))
                    .length ?? 0}
                </span>
                <span>Length: {strand.length / 3} codons</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="text-sm text-zinc-400 mb-2">
                Complement (what we are NOT)
              </div>
              <div className="font-mono text-xl tracking-wider">
                <NucleotideDisplay nuc={complementStrand(strand)} />
              </div>
            </div>
          </div>

          {/* Involution Proof */}
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="text-sm text-emerald-400 font-mono">
              f(f(x)) = x — Complement is an involution
            </div>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              {strand} → {complementStrand(strand)} →{" "}
              {complementStrand(complementStrand(strand))}
              {strand === complementStrand(complementStrand(strand))
                ? " ✓"
                : " ✗"}
            </div>
          </div>
        </div>
      )}

      {/* Panel 3: Involutionary Engine */}
      {activeTab === "engine" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              Involutionary Engine
            </h2>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-zinc-400 mb-1">Current Strand</div>
                <div className="font-mono text-xl tracking-wider">
                  <NucleotideDisplay nuc={currentStrand} />
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Health: {(strandHealth(currentStrand) * 100).toFixed(0)}% |
                  Stops:{" "}
                  {currentStrand.match(/.{3}/g)?.filter((c) => c.includes("A"))
                    .length ?? 0}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  ["complement", "strengthen", "weaken", "equilibrate"] as const
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => applyTransform(t)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors border border-zinc-700"
                  >
                    {t === "complement"
                      ? "Complement (involution)"
                      : t === "strengthen"
                        ? "Strengthen (A→T→G→C)"
                        : t === "weaken"
                          ? "Weaken (C→G→T→A)"
                          : "Equilibrate (median)"}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setCurrentStrand(strand);
                    setTransformHistory([]);
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-red-400 text-sm hover:bg-zinc-700 transition-colors border border-red-900"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Transform History */}
          {transformHistory.length > 0 && (
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="text-sm text-zinc-400 mb-2">
                Transform History
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transformHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-xs font-mono"
                  >
                    <span className="text-zinc-500 w-6">{i + 1}.</span>
                    <span className="text-yellow-400 w-24">{h.name}</span>
                    <NucleotideDisplay nuc={h.before} />
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                    <NucleotideDisplay nuc={h.after} />
                    <span className="text-zinc-600">
                      {(strandHealth(h.before) * 100).toFixed(0)}% →{" "}
                      {(strandHealth(h.after) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Codons breakdown */}
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="text-sm text-zinc-400 mb-3">Codon Breakdown</div>
            <div className="flex flex-wrap gap-2">
              {(currentStrand.match(/.{3}/g) ?? []).map((codon, i) => (
                <CodonCard
                  key={i}
                  codon={codon}
                  label={products[i]?.name ?? `#${i}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-zinc-600 font-mono pt-4">
        Helix Computing Engine v0.1.0 — nexcore-helix — By Matthew A. Campion,
        PharmD
      </div>
    </div>
  );
}
