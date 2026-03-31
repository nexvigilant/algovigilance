'use client';

import { useState, useCallback } from 'react';
import { Beaker, Loader2, FlaskConical, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── T1 Primitive annotations ──────────────────────────────────────────────────
// Each equation: μ(Mapping chemistry→PV) + ν(Frequency/rate) + ∂(Boundary/threshold) + N(Quantity)

const R_GAS = 8.314e-3; // kJ/(mol·K)

type EquationId =
  | 'arrhenius'
  | 'halflife'
  | 'michaelis'
  | 'gibbs'
  | 'ratelaw'
  | 'buffer'
  | 'beerlam'
  | 'equil';

interface EquationDef {
  id: EquationId;
  title: string;
  formula: string;
  pvMapping: string;
  pvDescription: string;
  transferConfidence: number;
  t1: string;
  params: ParamDef[];
  compute: (vals: Record<string, number>) => ComputeResult;
}

interface ParamDef {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
  defaultVal: string;
}

interface ComputeResult {
  primary: { label: string; value: string; unit: string };
  secondary?: { label: string; value: string; unit: string }[];
  pvInterpretation: string;
  signalStatus: 'favorable' | 'unfavorable' | 'neutral';
}

const EQUATIONS: EquationDef[] = [
  {
    id: 'arrhenius',
    title: 'Arrhenius',
    formula: 'k = A·e^(−Eₐ/RT)',
    pvMapping: 'Signal Detection Threshold',
    pvDescription:
      'Reaction rate exceeds activation barrier → analogue of PRR ≥ 2.0 threshold crossing',
    transferConfidence: 0.92,
    t1: 'ν × ∂ × N',
    params: [
      { key: 'a', label: 'Pre-exponential (A)', unit: 's⁻¹', placeholder: '1e13', defaultVal: '1e13' },
      { key: 'ea', label: 'Activation energy (Eₐ)', unit: 'kJ/mol', placeholder: '50', defaultVal: '50' },
      { key: 't', label: 'Temperature', unit: 'K', placeholder: '310.15', defaultVal: '310.15' },
    ],
    compute: ({ a, ea, t }) => {
      const k = a * Math.exp(-ea / (R_GAS * t));
      const signal = k > 1.0;
      return {
        primary: { label: 'Rate constant (k)', value: k.toExponential(4), unit: 's⁻¹' },
        secondary: [
          { label: 'Threshold crossed', value: signal ? 'YES — signal detected' : 'NO — below threshold', unit: '' },
        ],
        pvInterpretation: signal
          ? `k = ${k.toExponential(3)} → activation barrier overcome → PRR-equivalent signal present`
          : `k = ${k.toExponential(3)} → below activation energy threshold → no signal`,
        signalStatus: signal ? 'favorable' : 'unfavorable',
      };
    },
  },
  {
    id: 'halflife',
    title: 'Half-Life Decay',
    formula: 'N(t) = N₀·e^(−kt)',
    pvMapping: 'Signal Persistence',
    pvDescription:
      'Exponential decay of signal strength over time — how quickly a PV signal fades without new reports',
    transferConfidence: 0.90,
    t1: 'ν × π × N × ∝',
    params: [
      { key: 'n0', label: 'Initial count (N₀)', unit: 'reports', placeholder: '100', defaultVal: '100' },
      { key: 'halflife', label: 'Half-life', unit: 'days', placeholder: '30', defaultVal: '30' },
      { key: 'time', label: 'Elapsed time', unit: 'days', placeholder: '90', defaultVal: '90' },
    ],
    compute: ({ n0, halflife, time }) => {
      const k = Math.LN2 / halflife;
      const remaining = n0 * Math.exp(-k * time);
      const fraction = remaining / n0;
      const halvings = time / halflife;
      return {
        primary: { label: 'Remaining signal', value: remaining.toFixed(2), unit: 'reports' },
        secondary: [
          { label: 'Fraction remaining', value: (fraction * 100).toFixed(1) + '%', unit: '' },
          { label: 'Half-lives elapsed', value: halvings.toFixed(2), unit: '' },
        ],
        pvInterpretation: `After ${time} days: ${(fraction * 100).toFixed(1)}% of original signal persists — ${halvings.toFixed(1)} half-life cycles completed`,
        signalStatus: fraction > 0.5 ? 'favorable' : fraction > 0.25 ? 'neutral' : 'unfavorable',
      };
    },
  },
  {
    id: 'michaelis',
    title: 'Michaelis-Menten',
    formula: 'v = Vₘₐₓ·[S] / (Kₘ + [S])',
    pvMapping: 'Case Processing Capacity',
    pvDescription:
      'Hyperbolic throughput saturation — ICSR processing rate vs incoming case volume',
    transferConfidence: 0.88,
    t1: 'ν × ∂ × N × →',
    params: [
      { key: 'substrate', label: 'Case load ([S])', unit: 'cases', placeholder: '500', defaultVal: '500' },
      { key: 'vmax', label: 'Max throughput (Vₘₐₓ)', unit: 'cases/day', placeholder: '1000', defaultVal: '1000' },
      { key: 'km', label: 'Half-saturation (Kₘ)', unit: 'cases', placeholder: '200', defaultVal: '200' },
    ],
    compute: ({ substrate, vmax, km }) => {
      const rate = (vmax * substrate) / (km + substrate);
      const satFraction = rate / vmax;
      const isNearCapacity = satFraction > 0.8;
      return {
        primary: { label: 'Processing rate', value: rate.toFixed(1), unit: 'cases/day' },
        secondary: [
          { label: 'Capacity utilisation', value: (satFraction * 100).toFixed(1) + '%', unit: '' },
          { label: 'Queue forming', value: isNearCapacity ? 'YES — backlog risk' : 'NO — capacity available', unit: '' },
        ],
        pvInterpretation: `${(satFraction * 100).toFixed(0)}% saturation → ${isNearCapacity ? 'near capacity — expedite prioritisation' : 'adequate throughput — standard processing'}`,
        signalStatus: isNearCapacity ? 'unfavorable' : 'favorable',
      };
    },
  },
  {
    id: 'gibbs',
    title: 'Gibbs Free Energy',
    formula: 'ΔG = ΔH − T·ΔS',
    pvMapping: 'Causality Likelihood',
    pvDescription:
      'Thermodynamic spontaneity → causal plausibility: ΔG < 0 = spontaneous = likely causal',
    transferConfidence: 0.85,
    t1: 'κ × N × →',
    params: [
      { key: 'dh', label: 'ΔH (enthalpy)', unit: 'kJ/mol', placeholder: '-50', defaultVal: '-50' },
      { key: 'ds', label: 'ΔS (entropy)', unit: 'J/mol·K', placeholder: '100', defaultVal: '100' },
      { key: 't', label: 'Temperature', unit: 'K', placeholder: '298', defaultVal: '298' },
    ],
    compute: ({ dh, ds, t }) => {
      const dg = dh - t * (ds / 1000); // convert J to kJ
      const favorable = dg < 0;
      const cls = dg < -20 ? 'Strongly favourable' : dg < 0 ? 'Favourable' : dg < 20 ? 'Borderline' : 'Unfavourable';
      return {
        primary: { label: 'ΔG', value: dg.toFixed(2), unit: 'kJ/mol' },
        secondary: [
          { label: 'Spontaneous', value: favorable ? 'YES' : 'NO', unit: '' },
          { label: 'Favourability class', value: cls, unit: '' },
        ],
        pvInterpretation: favorable
          ? `ΔG = ${dg.toFixed(1)} kJ/mol → spontaneous → causal relationship likely (${cls})`
          : `ΔG = ${dg.toFixed(1)} kJ/mol → non-spontaneous → causal relationship unlikely`,
        signalStatus: favorable ? 'favorable' : 'unfavorable',
      };
    },
  },
  {
    id: 'ratelaw',
    title: 'Rate Law',
    formula: 'rate = k[A]ⁿ[B]ᵐ',
    pvMapping: 'Signal Dependency',
    pvDescription:
      'Multi-factor rate law — how drug dose × patient factor order drives signal strength',
    transferConfidence: 0.82,
    t1: 'ν × N × ×',
    params: [
      { key: 'k', label: 'Rate constant (k)', unit: '', placeholder: '0.1', defaultVal: '0.1' },
      { key: 'conc_a', label: 'Conc. A (drug dose)', unit: 'mg/kg', placeholder: '2.0', defaultVal: '2.0' },
      { key: 'order_a', label: 'Order A (n)', unit: '', placeholder: '1', defaultVal: '1' },
      { key: 'conc_b', label: 'Conc. B (risk factor)', unit: 'arbitrary', placeholder: '3.0', defaultVal: '3.0' },
      { key: 'order_b', label: 'Order B (m)', unit: '', placeholder: '2', defaultVal: '2' },
    ],
    compute: ({ k, conc_a, order_a, conc_b, order_b }) => {
      const rate = k * Math.pow(conc_a, order_a) * Math.pow(conc_b, order_b);
      const overallOrder = order_a + order_b;
      return {
        primary: { label: 'Reaction rate', value: rate.toFixed(4), unit: 'unit/s' },
        secondary: [
          { label: 'Overall order', value: overallOrder.toFixed(0), unit: '' },
        ],
        pvInterpretation: `Rate = ${rate.toFixed(3)} → ${overallOrder === 1 ? 'linear' : overallOrder === 2 ? 'quadratic' : 'high-order'} dose-response dependency`,
        signalStatus: rate > 1.0 ? 'favorable' : 'neutral',
      };
    },
  },
  {
    id: 'buffer',
    title: 'Buffer Capacity',
    formula: 'β = 2.303 · C · αₐ · αᵦ',
    pvMapping: 'Baseline Stability',
    pvDescription:
      'Resistance to perturbation — how well the historical reporting baseline resists noise',
    transferConfidence: 0.78,
    t1: 'ς × ∂ × N',
    params: [
      { key: 'total', label: 'Total concentration (C)', unit: 'M', placeholder: '1.0', defaultVal: '1.0' },
      { key: 'ratio', label: '[A⁻]/[HA] ratio', unit: '', placeholder: '1.0', defaultVal: '1.0' },
    ],
    compute: ({ total, ratio }) => {
      const alpha_a = ratio / (1 + ratio);
      const alpha_b = 1 / (1 + ratio);
      const beta = 2.303 * total * alpha_a * alpha_b;
      const optimal = ratio >= 0.1 && ratio <= 10;
      return {
        primary: { label: 'Buffer capacity (β)', value: beta.toFixed(4), unit: 'mol/(L·pH)' },
        secondary: [
          { label: 'Optimal range', value: optimal ? 'YES — stable baseline' : 'NO — vulnerable to drift', unit: '' },
        ],
        pvInterpretation: `β = ${beta.toFixed(4)} → baseline ${optimal ? 'well-buffered — resistant to noise perturbation' : 'poorly buffered — susceptible to spurious signal shifts'}`,
        signalStatus: optimal ? 'favorable' : 'unfavorable',
      };
    },
  },
  {
    id: 'beerlam',
    title: 'Beer-Lambert',
    formula: 'A = ε·l·c',
    pvMapping: 'Dose-Response Linearity',
    pvDescription:
      'Linear concentration-signal relationship — drug dose directly proportional to adverse event frequency',
    transferConfidence: 0.75,
    t1: 'μ × N × ν',
    params: [
      { key: 'eps', label: 'Molar absorptivity (ε)', unit: 'L/(mol·cm)', placeholder: '1000', defaultVal: '1000' },
      { key: 'l', label: 'Path length (l)', unit: 'cm', placeholder: '1.0', defaultVal: '1.0' },
      { key: 'c', label: 'Concentration (c)', unit: 'mol/L', placeholder: '0.001', defaultVal: '0.001' },
    ],
    compute: ({ eps, l, c }) => {
      const absorbance = eps * l * c;
      const transmittance = Math.pow(10, -absorbance);
      return {
        primary: { label: 'Absorbance (A)', value: absorbance.toFixed(4), unit: 'AU' },
        secondary: [
          { label: 'Transmittance (T)', value: (transmittance * 100).toFixed(2) + '%', unit: '' },
          { label: 'Linear response', value: absorbance < 1.0 ? 'YES — in linear range' : 'NO — saturated, non-linear', unit: '' },
        ],
        pvInterpretation: `A = ${absorbance.toFixed(3)} → dose-response ${absorbance < 1.0 ? 'linear — direct proportionality between dose and AE rate' : 'saturated — non-linear at this concentration'}`,
        signalStatus: absorbance < 1.0 ? 'favorable' : 'neutral',
      };
    },
  },
  {
    id: 'equil',
    title: 'Chemical Equilibrium',
    formula: 'K = [Products]/[Substrates]',
    pvMapping: 'Reporting Baseline',
    pvDescription:
      'Steady-state balance between reported and unreported events — equilibrium constant as baseline ratio',
    transferConfidence: 0.72,
    t1: 'ς × π × N',
    params: [
      { key: 'keq', label: 'Equilibrium constant (K)', unit: '', placeholder: '2.0', defaultVal: '2.0' },
    ],
    compute: ({ keq }) => {
      const product_frac = keq / (1 + keq);
      const substrate_frac = 1 / (1 + keq);
      return {
        primary: { label: 'Product fraction', value: (product_frac * 100).toFixed(1) + '%', unit: '' },
        secondary: [
          { label: 'Substrate fraction', value: (substrate_frac * 100).toFixed(1) + '%', unit: '' },
          { label: 'Favours products', value: keq > 1 ? 'YES' : 'NO', unit: '' },
        ],
        pvInterpretation: `K = ${keq} → ${(product_frac * 100).toFixed(0)}% reported / ${(substrate_frac * 100).toFixed(0)}% unreported at baseline equilibrium`,
        signalStatus: keq > 1 ? 'favorable' : 'neutral',
      };
    },
  },
];

const CONFIDENCE_COLOR = (c: number) => {
  if (c >= 0.88) return 'text-emerald-400';
  if (c >= 0.78) return 'text-cyan-400';
  if (c >= 0.72) return 'text-amber-400';
  return 'text-slate-400';
};

const STATUS_STYLES: Record<ComputeResult['signalStatus'], string> = {
  favorable: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
  unfavorable: 'border-red-500/30 bg-red-500/5 text-red-300',
  neutral: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
};

export function ChemistryPV() {
  const [selected, setSelected] = useState<EquationId>('arrhenius');
  const [params, setParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eq = EQUATIONS.find((e) => e.id === selected) ?? EQUATIONS[0];

  const getParam = useCallback(
    (key: string) => {
      const paramDef = eq.params.find((p) => p.key === key);
      return params[`${selected}.${key}`] ?? paramDef?.defaultVal ?? '';
    },
    [selected, eq.params, params],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      setParams((prev) => ({ ...prev, [`${selected}.${key}`]: value }));
    },
    [selected],
  );

  const handleCompute = useCallback(() => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const vals: Record<string, number> = {};
      for (const p of eq.params) {
        const raw = getParam(p.key);
        const n = parseFloat(raw);
        if (isNaN(n)) {
          setError(`Invalid value for "${p.label}"`);
          setLoading(false);
          return;
        }
        vals[p.key] = n;
      }
      const res = eq.compute(vals);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Computation failed');
    } finally {
      setLoading(false);
    }
  }, [eq, getParam]);

  const handleSelectEquation = useCallback((id: EquationId) => {
    setSelected(id);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Cross-Domain Transfer / Chemistry → Pharmacovigilance</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Chemistry-PV Transfer
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-xl mx-auto">
          8 chemistry equations mapped to PV concepts — transfer confidence 0.72–0.92
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Equation selector */}
        <nav aria-label="Equation selector" className="space-y-1">
          <p className="intel-label mb-2 px-1">Equation</p>
          {EQUATIONS.map((e) => (
            <button
              key={e.id}
              onClick={() => handleSelectEquation(e.id)}
              className={`w-full text-left px-3 py-2.5 border transition-colors duration-150 group ${
                selected === e.id
                  ? 'border-violet-500/40 bg-violet-500/10 text-white'
                  : 'border-white/[0.08] bg-white/[0.03] text-slate-dim/70 hover:border-white/20 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{e.title}</p>
                  <p className="text-[10px] font-mono text-slate-dim/40 truncate mt-0.5">{e.formula}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-mono ${CONFIDENCE_COLOR(e.transferConfidence)}`}>
                    {(e.transferConfidence * 100).toFixed(0)}%
                  </span>
                  {selected === e.id && <ChevronRight className="h-3 w-3 text-violet-400" />}
                </div>
              </div>
            </button>
          ))}
        </nav>

        {/* Main panel */}
        <div className="space-y-4">
          {/* Equation info */}
          <div className="border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <div className="flex items-start gap-3">
              <FlaskConical className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-sm font-semibold text-white">{eq.title}</h2>
                  <code className="text-xs font-mono text-violet-300/80 bg-violet-500/10 px-1.5 py-0.5">
                    {eq.formula}
                  </code>
                </div>
                <p className="text-xs text-slate-dim/60">{eq.pvDescription}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="intel-label">PV: {eq.pvMapping}</span>
                  <span className={`intel-label ${CONFIDENCE_COLOR(eq.transferConfidence)}`}>
                    Transfer confidence: {(eq.transferConfidence * 100).toFixed(0)}%
                  </span>
                  <span className="intel-label text-slate-dim/40">T1: {eq.t1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="border border-white/[0.12] bg-white/[0.06]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <Beaker className="h-3.5 w-3.5 text-violet-400/60" />
              <span className="intel-label">Parameters</span>
            </div>
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              {eq.params.map((p) => (
                <div key={p.key}>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-dim/50 mb-1 font-mono">
                    {p.label}
                    {p.unit && (
                      <span className="ml-1 text-slate-dim/30 normal-case">({p.unit})</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={getParam(p.key)}
                    onChange={(e) => setParam(p.key, e.target.value)}
                    placeholder={p.placeholder}
                    className="w-full bg-black/30 border border-white/10 text-white text-sm font-mono px-3 py-2 focus:outline-none focus:border-violet-500/50 placeholder:text-slate-dim/30"
                  />
                </div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <Button
                onClick={handleCompute}
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Computing
                  </>
                ) : (
                  'Compute Transfer'
                )}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs text-red-400 font-mono">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <div className="intel-status-active" />
                <span className="intel-label">Transfer Result</span>
              </div>

              <div className="p-4 space-y-4">
                {/* Primary result */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">
                    {result.primary.value}
                  </span>
                  {result.primary.unit && (
                    <span className="text-sm font-mono text-slate-dim/50">{result.primary.unit}</span>
                  )}
                  <span className="text-xs text-slate-dim/40">{result.primary.label}</span>
                </div>

                {/* Secondary metrics */}
                {result.secondary && result.secondary.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {result.secondary.map((s, i) => (
                      <div key={i} className="border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-slate-dim/40 font-mono mb-1">
                          {s.label}
                        </p>
                        <p className="text-sm font-mono text-white/80">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* PV Interpretation */}
                <div className={`border px-4 py-3 ${STATUS_STYLES[result.signalStatus]}`}>
                  <p className="text-[10px] uppercase tracking-wider font-mono mb-1 opacity-60">
                    PV Interpretation — {eq.pvMapping}
                  </p>
                  <p className="text-xs leading-relaxed">{result.pvInterpretation}</p>
                </div>

                {/* Confidence bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/40">
                      Transfer confidence
                    </span>
                    <span className={`text-xs font-mono ${CONFIDENCE_COLOR(eq.transferConfidence)}`}>
                      {(eq.transferConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        eq.transferConfidence >= 0.88
                          ? 'bg-emerald-400'
                          : eq.transferConfidence >= 0.78
                            ? 'bg-cyan-400'
                            : 'bg-amber-400'
                      }`}
                      style={{ width: `${eq.transferConfidence * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-dim/30 mt-1 font-mono">
                    T1 primitives: {eq.t1}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !error && (
            <div className="border border-dashed border-white/[0.08] px-4 py-10 text-center">
              <FlaskConical className="h-8 w-8 text-violet-400/20 mx-auto mb-3" />
              <p className="text-xs text-slate-dim/30 font-mono">
                Set parameters and click Compute Transfer
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
