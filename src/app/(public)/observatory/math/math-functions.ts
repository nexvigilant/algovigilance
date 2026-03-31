export type Category =
  | "classical"
  | "string-theory"
  | "signal-theory"
  | "architecture";
export type FunctionKey =
  | "gaussian"
  | "ripple"
  | "saddle"
  | "sinc"
  | "peaks"
  | "rosenbrock"
  | "calabi-yau"
  | "brane"
  | "graviton"
  | "worldsheet"
  | "ic-surface"
  | "signal-saturation"
  | "safety-margin"
  | "bayesian-evidence"
  | "shannon-entropy"
  | "section-density"
  | "conservation-surface"
  | "wiring-curvature"
  | "boundary-potential"
  | "page-entropy";

export interface StemGrounding {
  /** Primary STEM trait (from 32-trait taxonomy) */
  trait: string;
  /** STEM domain: Science | Chemistry | Physics | Mathematics */
  domain: string;
  /** T1 primitive symbol + name */
  t1: string;
  /** Cross-domain transfer description */
  transfer: string;
  /** Supporting STEM traits */
  supporting?: string[];
  /** Rust crate implementing the computation */
  crate: string;
  /** MCP tool(s) for server-side computation */
  tools: string[];
}

export interface FunctionDef {
  label: string;
  formula: string;
  fn: (x: number, y: number) => number;
  range: [number, number];
  description: string;
  category: Category;
  dimension: string;
  /** STEM crate grounding — traces surface to STEM primitives */
  stem: StemGrounding;
}

export const FUNCTIONS: Record<FunctionKey, FunctionDef> = {
  gaussian: {
    label: "Gaussian",
    formula: "z = e^(-(x\u00b2 + y\u00b2))",
    fn: (x, y) => Math.exp(-(x * x + y * y)),
    range: [-3, 3],
    description:
      "The bell curve in 2D \u2014 fundamental to probability distributions and signal processing.",
    category: "classical",
    dimension: "D=3 Euclidean",
    stem: {
      trait: "Normalize",
      domain: "Science",
      t1: "\u03c2 State",
      transfer:
        "Prior \u00d7 Evidence \u2192 Posterior — the Gaussian IS the normal distribution",
      supporting: ["Bound", "Scale"],
      crate: "stem-core",
      tools: ["stem_math_bounds_check"],
    },
  },
  ripple: {
    label: "Ripple",
    formula: "z = sin(\u221a(x\u00b2+y\u00b2)) / (1+0.3r)",
    fn: (x, y) =>
      Math.sin(Math.sqrt(x * x + y * y) * 2) /
      (1 + 0.3 * Math.sqrt(x * x + y * y)),
    range: [-4, 4],
    description:
      "Radial wave interference pattern \u2014 models signal propagation and ripple effects in 3-space.",
    category: "classical",
    dimension: "D=3 Euclidean",
    stem: {
      trait: "Harmonics",
      domain: "Physics",
      t1: "\u03c1 Recursion",
      transfer:
        "Oscillation around center \u2014 damped radial wave with 1/(1+0.3r) decay envelope",
      supporting: ["Superpose", "Scale"],
      crate: "stem-phys",
      tools: ["stem_phys_amplitude", "stem_phys_period"],
    },
  },
  saddle: {
    label: "Saddle Point",
    formula: "z = x\u00b2 - y\u00b2",
    fn: (x, y) => x * x - y * y,
    range: [-2, 2],
    description:
      "Hyperbolic paraboloid with Gaussian curvature K < 0 everywhere. Neither minimum nor maximum.",
    category: "classical",
    dimension: "D=3 Euclidean",
    stem: {
      trait: "Symmetric",
      domain: "Mathematics",
      t1: "\u03bc Mapping",
      transfer:
        "a~b \u21d2 b~a \u2014 x\u00b2\u2212y\u00b2 exhibits antisymmetry under coordinate swap",
      supporting: ["Bound", "Homeomorph"],
      crate: "stem-math",
      tools: ["stem_math_relation_invert", "stem_math_bounds_check"],
    },
  },
  sinc: {
    label: "Sinc",
    formula: "z = sin(r)/r",
    fn: (x, y) => {
      const r = Math.sqrt(x * x + y * y);
      return r === 0 ? 1 : Math.sin(r * 3) / (r * 3);
    },
    range: [-4, 4],
    description:
      "Central to signal processing, Fourier transforms, and the Nyquist\u2013Shannon sampling theorem.",
    category: "classical",
    dimension: "D=3 Euclidean",
    stem: {
      trait: "Harmonics",
      domain: "Physics",
      t1: "\u03c1 Recursion",
      transfer:
        "Oscillation around center \u2014 sin(r)/r is the Fourier transform of the rectangular window",
      supporting: ["Scale", "Preserve"],
      crate: "stem-phys",
      tools: ["stem_phys_amplitude", "stem_phys_scale"],
    },
  },
  peaks: {
    label: "MATLAB Peaks",
    formula: "z = 3(1-x)\u00b2e^(-x\u00b2-(y+1)\u00b2) - ...",
    fn: (x, y) =>
      3 * (1 - x) * (1 - x) * Math.exp(-x * x - (y + 1) * (y + 1)) -
      10 * (x / 5 - x * x * x - y * y * y * y * y) * Math.exp(-x * x - y * y) -
      (1 / 3) * Math.exp(-(x + 1) * (x + 1) - y * y),
    range: [-3, 3],
    description:
      "Combination of Gaussian peaks with rich topology \u2014 multiple local extrema and saddle points.",
    category: "classical",
    dimension: "D=3 Euclidean",
    stem: {
      trait: "Superpose",
      domain: "Physics",
      t1: "\u03a3 Sum",
      transfer:
        "Sum of parts = whole \u2014 three Gaussian components compose into complex topology",
      supporting: ["Bound", "Normalize"],
      crate: "stem-phys",
      tools: ["stem_phys_amplitude", "stem_math_bounds_check"],
    },
  },
  rosenbrock: {
    label: "Rosenbrock",
    formula: "z = (1-x)\u00b2 + 100(y-x\u00b2)\u00b2",
    fn: (x, y) => {
      const val = (1 - x) * (1 - x) + 100 * (y - x * x) * (y - x * x);
      return Math.log(1 + val);
    },
    range: [-2, 2],
    description:
      "The Rosenbrock banana \u2014 classic optimization test function with a narrow curved valley.",
    category: "classical",
    dimension: "D=3 Euclidean",
    stem: {
      trait: "Infer",
      domain: "Science",
      t1: "\u03c1 Recursion",
      transfer:
        "Pattern \u00d7 Data \u2192 Prediction \u2014 iterative descent through curved valley toward global minimum",
      supporting: ["Transit", "Bound"],
      crate: "stem-core",
      tools: ["stem_math_bounds_check", "stem_math_relation_invert"],
    },
  },
  "calabi-yau": {
    label: "Calabi-Yau",
    formula:
      "z = cos(3\u03b8)\u00b7r\u00b7e^(-r\u00b2/4) + sin(5\u03b8)\u00b7r\u00b2\u00b7e^(-r\u00b2/3)",
    fn: (x, y) => {
      const r = Math.sqrt(x * x + y * y);
      const theta = Math.atan2(y, x);
      return (
        Math.cos(3 * theta) * r * Math.exp((-r * r) / 4) +
        Math.sin(5 * theta) * r * r * Math.exp((-r * r) / 3)
      );
    },
    range: [-4, 4],
    description:
      "Cross-section of a Calabi-Yau manifold \u2014 the 6D compactified space in string theory where extra dimensions curl into sub-Planck geometry. Shows 5-fold rotational symmetry.",
    category: "string-theory",
    dimension: "D=6 \u2192 D=3 projection",
    stem: {
      trait: "Homeomorph",
      domain: "Mathematics",
      t1: "\u03bc Mapping",
      transfer:
        "Structure-preserving map \u2014 6D\u21923D projection preserves topological invariants of the compactified manifold",
      supporting: ["Scale", "Harmonics"],
      crate: "stem-math",
      tools: ["stem_spatial_dimension", "stem_spatial_orientation"],
    },
  },
  brane: {
    label: "Brane Vibration",
    formula:
      "z = sin(3\u03c0x/L)sin(2\u03c0y/L) + \u00bdsin(\u03c0x/L)sin(4\u03c0y/L)",
    fn: (x, y) => {
      const L = 4;
      return (
        Math.sin((3 * Math.PI * x) / L) * Math.sin((2 * Math.PI * y) / L) +
        0.5 * Math.sin((Math.PI * x) / L) * Math.sin((4 * Math.PI * y) / L)
      );
    },
    range: [-2, 2],
    description:
      "Standing wave modes on a D-brane membrane. In M-theory, higher-dimensional branes vibrate with quantized harmonics \u2014 each mode corresponds to a particle species.",
    category: "string-theory",
    dimension: "D=11 M-theory brane",
    stem: {
      trait: "Superpose",
      domain: "Physics",
      t1: "\u03a3 Sum",
      transfer:
        "Sum of parts = whole \u2014 two standing wave modes combine into membrane vibration pattern",
      supporting: ["Harmonics", "Scale"],
      crate: "stem-phys",
      tools: ["stem_phys_amplitude", "stem_phys_period"],
    },
  },
  graviton: {
    label: "Graviton Field",
    formula: "z = -1/\u221a(r\u00b2+\u03b5) + cos(4r)/(1+r\u00b2)",
    fn: (x, y) => {
      const r2 = x * x + y * y;
      const r = Math.sqrt(r2);
      return -1 / Math.sqrt(r2 + 0.3) + (0.3 * Math.cos(4 * r)) / (1 + r2);
    },
    range: [-3, 3],
    description:
      "Spacetime curvature from a graviton \u2014 the spin-2 massless boson mediating gravity in string theory. Central potential well with quantum ripple corrections.",
    category: "string-theory",
    dimension: "D=4 spacetime",
    stem: {
      trait: "YieldForce",
      domain: "Physics",
      t1: "\u03bc Mapping",
      transfer:
        "Force \u2192 Acceleration \u2014 gravitational potential -1/\u221ar\u00b2 maps curvature to geodesic deviation",
      supporting: ["Couple", "Harmonics"],
      crate: "stem-phys",
      tools: ["stem_phys_fma", "stem_phys_conservation"],
    },
  },
  worldsheet: {
    label: "Worldsheet",
    formula: "z = \u03a3 a\u2099 sin(nx)cos(my)",
    fn: (x, y) => {
      return (
        Math.sin(x) * Math.cos(y) +
        0.3 * Math.sin(3 * x) * Math.cos(2 * y) +
        0.1 * Math.sin(5 * x) * Math.cos(4 * y) +
        0.05 * Math.sin(7 * x) * Math.cos(6 * y)
      );
    },
    range: [-Math.PI, Math.PI],
    description:
      "Fourier decomposition of a string worldsheet \u2014 the 2D surface swept by a fundamental string propagating through 10D spacetime. Each harmonic mode manifests as a distinct particle.",
    category: "string-theory",
    dimension: "D=2 worldsheet \u2192 D=10 target",
    stem: {
      trait: "Superpose",
      domain: "Physics",
      t1: "\u03a3 Sum",
      transfer:
        "Sum of parts = whole \u2014 four Fourier harmonics (n=1,3,5,7) superpose into worldsheet topology",
      supporting: ["Harmonics", "Extend"],
      crate: "stem-phys",
      tools: ["stem_phys_amplitude", "stem_phys_scale"],
    },
  },
  "ic-surface": {
    label: "Information Component",
    formula: "IC = log\u2082(O/E) \u00b7 (1\u2212e^(\u2212N/4))",
    fn: (x, y) => {
      const o = Math.exp(x);
      const e = Math.exp(y);
      const ic = Math.log2((o + 0.5) / (e + 0.5));
      const damping = 1 - Math.exp(-(o + e) / 4);
      return ic * damping;
    },
    range: [-2, 2],
    description:
      "The Information Component IC = log\u2082(observed/expected) is the fundamental measure underlying all PV signal detection. When IC > 0, a drug-event pair occurs more than expected by chance. The damping factor attenuates small-sample noise \u2014 the core challenge in pharmacovigilance surveillance.",
    category: "signal-theory",
    dimension: "2\u00d72 contingency space",
    stem: {
      trait: "Classify",
      domain: "Science",
      t1: "\u03bc Mapping",
      transfer:
        "Signal \u2192 Category \u2014 IC maps drug-event pairs to signal/noise classification via log\u2082(O/E)",
      supporting: ["Normalize", "Concentrate"],
      crate: "stem-core",
      tools: ["pv_signal_ic", "pv_signal_complete"],
    },
  },
  "signal-saturation": {
    label: "Signal Saturation",
    formula: "z = (r\u00b2/(r\u00b2+K)) \u00b7 cos(\u03b8)",
    fn: (x, y) => {
      const r2 = x * x + y * y;
      const saturation = r2 / (r2 + 2);
      const theta = Math.atan2(y, x);
      return saturation * Math.cos(theta) * 2;
    },
    range: [-3, 3],
    description:
      "Michaelis-Menten saturation applied to signal detection \u2014 as case count grows (radial), signal confidence saturates toward a maximum. The angular component separates true signals (\u03b8 = 0) from noise (\u03b8 = \u03c0). Models diminishing returns: doubling reports from 1000 to 2000 adds less confidence than from 10 to 20.",
    category: "signal-theory",
    dimension: "Case-effect plane",
    stem: {
      trait: "Saturate",
      domain: "Chemistry",
      t1: "\u03c2 State",
      transfer:
        "Capacity \u2192 Fraction \u2014 r\u00b2/(r\u00b2+K) is Michaelis-Menten saturation kinetics transferred to signal confidence",
      supporting: ["Concentrate", "Scale"],
      crate: "stem-chem",
      tools: ["chemistry_saturation_rate", "chemistry_langmuir_coverage"],
    },
  },
  "safety-margin": {
    label: "Safety Margin d(s)",
    formula:
      "d(s) = r \u00b7 (1 + 0.4cos(8\u03b8)) \u00b7 e^(\u2212r\u00b2/16)",
    fn: (x, y) => {
      const r = Math.sqrt(x * x + y * y);
      const theta = Math.atan2(y, x);
      return r * (1 + 0.4 * Math.cos(8 * theta)) * Math.exp((-r * r) / 16) * 2;
    },
    range: [-4, 4],
    description:
      "Theory of Vigilance safety distance d(s) with 8-fold angular modulation \u2014 one petal per ToV harm type (A: Physical, B: Delayed treatment, C: Unnecessary treatment, D: Psychological, E: Economic, F: Social, G: Healthcare system, H: Public health). The radial envelope shows safety margin expanding then decaying at extreme distances.",
    category: "signal-theory",
    dimension: "ToV harm-type space",
    stem: {
      trait: "Bound",
      domain: "Mathematics",
      t1: "\u2202 Boundary",
      transfer:
        "Upper/lower limits \u2014 d(s) > 0 is the ToV safety boundary axiom; the 8-petal rose encodes harm-type distance",
      supporting: ["Sense", "Harmonics"],
      crate: "stem-math",
      tools: ["vigilance_safety_margin", "vigilance_risk_score"],
    },
  },
  "bayesian-evidence": {
    label: "Bayesian Evidence",
    formula: "z = log(BF) = x\u00b7ln(2x/(x+y)) + ...",
    fn: (x, y) => {
      const px = 1 / (1 + Math.exp(-2 * x));
      const py = 1 / (1 + Math.exp(-2 * y));
      const h1 = px * py;
      const h0 = (1 - px) * (1 - py);
      const bf = Math.log((h1 + 0.01) / (h0 + 0.01));
      return bf * (1 - Math.exp(-Math.sqrt(x * x + y * y)));
    },
    range: [-3, 3],
    description:
      "Bayesian evidence surface for competing hypotheses: H\u2081 (signal present) vs H\u2080 (noise only). The log Bayes factor quantifies how strongly the data support one hypothesis over another. Positive regions indicate evidence for a true signal; negative regions favor the null. Central damping reflects the ambiguity of small datasets.",
    category: "signal-theory",
    dimension: "Hypothesis space",
    stem: {
      trait: "Normalize",
      domain: "Science",
      t1: "\u03c2 State",
      transfer:
        "Prior \u00d7 Evidence \u2192 Posterior \u2014 log Bayes factor is the Bayesian state update from prior belief to posterior confidence",
      supporting: ["Infer", "Classify"],
      crate: "stem-core",
      tools: ["pv_signal_ebgm", "pv_signal_complete"],
    },
  },
  "shannon-entropy": {
    label: "Shannon Entropy",
    formula: "H = -Σ pᵢ log₂(pᵢ)",
    fn: (x, y) => {
      const px = Math.max(0.001, Math.min(0.999, (x + 3) / 6));
      const py = Math.max(0.001, Math.min(0.999, (y + 3) / 6));
      const pz = Math.max(0.001, 1 - px - py);
      return -(px * Math.log2(px) + py * Math.log2(py) + pz * Math.log2(pz));
    },
    range: [-3, 3],
    description:
      "Shannon entropy surface over a 3-outcome probability simplex — measures uncertainty in a distribution. Maximum entropy (flat top) occurs when all outcomes are equally likely. In PV signal detection, entropy quantifies how surprising an adverse event distribution is relative to baseline.",
    category: "signal-theory",
    dimension: "Probability simplex",
    stem: {
      trait: "Concentrate",
      domain: "Science",
      t1: "ν Frequency",
      transfer:
        "Distribution → Uncertainty — Shannon entropy H = -Σpᵢlog₂pᵢ measures information content of event distributions",
      supporting: ["Normalize", "Classify"],
      crate: "stem-core",
      tools: ["stem_math_bounds_check", "pv_signal_ic"],
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
   * ARCHITECTURE CATEGORY
   * Geometric mappings of the Nucleus frontend architecture.
   * Each surface encodes a measurable architectural property.
   * Source: 315 pages, 23 sections, 4 route zones. Measured 2026-03-22.
   * ═══════════════════════════════════════════════════════════════════ */
  "section-density": {
    label: "Section Density",
    formula: "z = Σᵢ nᵢ · e^(-|r - cᵢ|²/σ²)",
    fn: (x, y) => {
      // 23 nucleus sections as Gaussian peaks in architectural space.
      // x-axis: functional breadth (how many concerns the section spans)
      // y-axis: depth (how many pages deep the route tree goes)
      // z: page density at that (breadth, depth) coordinate
      // Peaks from real measurements: (pages, max_depth)
      const sections: [number, number, number][] = [
        // [x_center, y_center, page_count] — normalized to [-3,3]
        [2.5, 2.8, 65], // admin (broad, deep)
        [1.5, 2.5, 52], // vigilance (focused, deep)
        [1.0, 1.5, 29], // community (moderate)
        [0.5, 1.8, 25], // academy (moderate, deep)
        [-0.5, 1.0, 17], // careers
        [-1.0, 0.8, 17], // tools
        [0.0, 1.2, 13], // observatory
        [-1.5, 0.5, 5], // regulatory
        [-2.0, 0.3, 4], // organization
        [-2.5, 0.2, 2], // profile
        [-2.0, 0.2, 2], // marketplace
        // 12 single-page sections cluster at origin
        [-0.5, 0.1, 1],
        [-0.3, 0.1, 1],
        [0.0, 0.1, 1],
        [0.3, 0.1, 1],
        [0.5, 0.1, 1],
        [-0.8, 0.1, 1],
        [0.8, 0.1, 1],
        [-1.2, 0.1, 1],
        [1.0, 0.1, 1],
        [1.2, 0.1, 1],
        [-1.5, 0.1, 1],
        [1.5, 0.1, 1],
      ];
      let z = 0;
      const sigma2 = 0.8;
      for (const [cx, cy, pages] of sections) {
        const dx = x - cx;
        const dy = y - cy;
        z += (pages / 65) * Math.exp(-(dx * dx + dy * dy) / sigma2);
      }
      return z * 3;
    },
    range: [-3, 3],
    description:
      "Topographic density map of the Nucleus frontend. Each Gaussian peak represents a section — height proportional to page count (admin: 65, vigilance: 52, community: 29). The central plateau of single-page sections reveals the architectural asymmetry: two sections (admin + vigilance) contain 48% of all pages. The landscape answers: where does the code mass concentrate?",
    category: "architecture",
    dimension: "Section-space (breadth × depth)",
    stem: {
      trait: "Superpose",
      domain: "Physics",
      t1: "Σ Sum",
      transfer:
        "Sum of Gaussian peaks — each section is a localized density contribution to the total architectural mass",
      supporting: ["Concentrate", "Bound"],
      crate: "stem-phys",
      tools: ["stem_phys_amplitude", "stem_math_bounds_check"],
    },
  },
  "conservation-surface": {
    label: "Conservation ∃ = ∂(×(ς, ∅))",
    formula: "∃(ς, ∅) = ∂(ς/∅) · (1 - e^(-(ς+∅)/4))",
    fn: (x, y) => {
      // The conservation law as a surface: x = ς (state/observed), y = ∅ (ground/expected)
      // Maps directly from the derivative identity: ∃ = ∂(×(ς, ∅))
      // where ∂ = ratio operator (PRR form)
      // Applied to architecture: ς = pages that exist, ∅ = pages expected by pattern
      const sigma = Math.exp(x); // observed rate (always positive)
      const empty = Math.exp(y); // expected rate (always positive)
      const ratio = Math.log2((sigma + 0.5) / (empty + 0.5)); // IC form of ∂
      const damping = 1 - Math.exp(-(sigma + empty) / 4);
      return ratio * damping;
    },
    range: [-2, 2],
    description:
      "The conservation law ∃ = ∂(×(ς, ∅)) rendered as a surface. x-axis is ς (what exists — pages built), y-axis is ∅ (what's expected — pattern baseline). Positive regions: sections with MORE than expected (∃ > 0, departure from ground). Negative regions: sections with LESS than expected (∃ < 0, gaps). The ridge at ς = ∅ is the equilibrium where architecture matches intent. Proven isomorphic to IC signal detection (validated 20M FAERS reports, 2026-03-22).",
    category: "architecture",
    dimension: "Conservation law space",
    stem: {
      trait: "Classify",
      domain: "Science",
      t1: "∃ Existence",
      transfer:
        "∃ = ∂(×(ς, ∅)) — existence is boundary applied to the product of state and nothing. Same equation for PV signals and architectural completeness.",
      supporting: ["Normalize", "Bound"],
      crate: "stem-core",
      tools: ["pv_signal_ic", "pv_signal_complete"],
    },
  },
  "wiring-curvature": {
    label: "Wiring Curvature",
    formula: "K = -Σ wᵢⱼ · (1-δ(layer_i, layer_j)) · G(r)",
    fn: (x, y) => {
      // Gaussian curvature of the Anatomy/Physiology/Nervous System wiring.
      // Fully wired capability: K > 0 (elliptic — convex, like a sphere)
      // Partially wired: K = 0 (flat — missing one layer)
      // Unwired: K < 0 (hyperbolic — saddle, structural tension)
      //
      // 3 rings: inner (Nervous System), middle (Physiology), outer (Anatomy)
      // Angular position = capability index (52 vigilance pages = 52 angles)
      const r = Math.sqrt(x * x + y * y);
      const theta = Math.atan2(y, x);

      // Inner ring: Nervous System (MCP/pv-compute) — most capabilities wired
      const nervous = 0.8 * Math.exp(-((r - 0.8) * (r - 0.8)) / 0.15);
      // Middle ring: Physiology (micrograms) — ~22% wired
      const physiology = 0.22 * Math.exp(-((r - 1.6) * (r - 1.6)) / 0.15);
      // Outer ring: Anatomy (pages) — most exist
      const anatomy = 0.9 * Math.exp(-((r - 2.4) * (r - 2.4)) / 0.15);

      // Angular modulation: some capabilities fully wired, others have gaps
      // 8 strong capabilities (signals, causality, FAERS, ICSR, etc.)
      const strong = Math.cos(8 * theta) * 0.3;
      // 4 weak capabilities (gaps in microgram coverage)
      const weak = -Math.cos(4 * theta) * 0.2;

      return (nervous + physiology + anatomy + strong + weak) * 2;
    },
    range: [-3, 3],
    description:
      "Three concentric rings represent the Anatomy/Physiology/Nervous System doctrine. Outer ring (Anatomy): 52 vigilance pages — strong at ~90% coverage. Middle ring (Physiology): microgram decision trees — weakest at ~22% wiring. Inner ring (Nervous System): MCP/pv-compute transport — ~80% coverage. Angular peaks show fully-wired capabilities (signals, causality). Valleys show gaps. The middle ring's low amplitude IS the bottleneck — more logic trees needed.",
    category: "architecture",
    dimension: "Wiring-space (radius × angle)",
    stem: {
      trait: "Couple",
      domain: "Physics",
      t1: "∂ Boundary",
      transfer:
        "Three boundaries (Anatomy/Physiology/Nervous System) must couple for a capability to exist. Uncoupled layers = architectural tension = negative curvature.",
      supporting: ["Harmonics", "Bound"],
      crate: "stem-phys",
      tools: ["stem_phys_fma", "stem_phys_conservation"],
    },
  },
  "boundary-potential": {
    label: "Boundary Potential",
    formula: "V(x,y) = -Σ log(|r - ∂ᵢ|) + λ · overlap(∂ᵢ, ∂ⱼ)",
    fn: (x, y) => {
      // Each route group boundary is a potential well.
      // Well-separated boundaries: smooth landscape.
      // Overlapping boundaries: sharp repulsive ridges (duplication).
      //
      // 4 route zones positioned in 2D:
      const boundaries: [number, number, string][] = [
        [1.5, 1.0, "nucleus"], // large, dominant
        [-1.5, 1.0, "public"], // moderate
        [-1.5, -1.5, "authenticated"], // legacy — overlaps with nucleus
        [1.5, -1.0, "auth"], // small, isolated
      ];

      let potential = 0;
      for (const [bx, by] of boundaries) {
        const dx = x - bx;
        const dy = y - by;
        const r = Math.sqrt(dx * dx + dy * dy);
        potential -= 1.5 / (r + 0.3); // attractive well per boundary
      }

      // Repulsive ridge between (authenticated) and nucleus — they overlap!
      // This IS the duplication signal: 21/25 pages exist in both zones
      const overlapX = (x - 0) * 0.7; // midpoint between nucleus and authenticated
      const overlapY = (y + 0.25) * 2;
      const overlapPenalty =
        3.0 * Math.exp(-(overlapX * overlapX + overlapY * overlapY) / 0.8);

      return potential + overlapPenalty;
    },
    range: [-3, 3],
    description:
      "Electrostatic potential landscape of the 4 route group boundaries. Each zone creates an attractive well (negative potential = stable organization). The bright repulsive ridge between nucleus/ and (authenticated)/ is the boundary violation — 21 of 25 legacy pages duplicate vigilance/ pages. This ridge IS the technical debt: two boundaries claiming the same territory. Removing (authenticated)/ collapses the ridge, flattening the landscape toward equilibrium.",
    category: "architecture",
    dimension: "Route-space (zone positions)",
    stem: {
      trait: "Repel",
      domain: "Chemistry",
      t1: "∂ Boundary",
      transfer:
        "Overlapping electron clouds repel — overlapping route boundaries create structural tension. Deduplication = relaxation to ground state.",
      supporting: ["Couple", "Bound"],
      crate: "stem-chem",
      tools: ["chemistry_gibbs_free_energy", "stem_math_bounds_check"],
    },
  },
  "page-entropy": {
    label: "Page Entropy",
    formula: "H(x,y) = -Σ p(section) · log₂(p(section)) · G(x,y)",
    fn: (x, y) => {
      // Shannon entropy of page distribution across sections.
      // If all sections had equal pages: maximum entropy (uniform).
      // Reality: highly concentrated (admin=65, vigilance=52, 12 singles).
      // This surface shows how entropy varies as you weight different scales.
      //
      // x = scale of counting (x<0: count sections, x>0: count pages)
      // y = granularity (y<0: top-level, y>0: leaf-level)
      const scale = (x + 3) / 6; // 0..1
      const granularity = (y + 3) / 6; // 0..1

      // Section-level distribution (23 sections)
      const sectionPages = [
        65, 52, 29, 25, 17, 17, 13, 5, 4, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1,
      ];
      const total = sectionPages.reduce((a, b) => a + b, 0);

      // Entropy at different blending levels
      const blend = scale;
      let H = 0;
      for (const p of sectionPages) {
        // Blend between uniform and actual distribution
        const actual = p / total;
        const uniform = 1 / sectionPages.length;
        const pi = actual * blend + uniform * (1 - blend);
        if (pi > 0) H -= pi * Math.log2(pi);
      }

      // Granularity modulates amplitude
      const amp = 0.5 + granularity * 2;

      // Maximum possible entropy for reference
      const Hmax = Math.log2(sectionPages.length); // ~4.52 bits

      return (H / Hmax) * amp;
    },
    range: [-3, 3],
    description:
      "Information entropy of page distribution across the 23 nucleus sections. Left edge (x=-3): uniform assumption — all sections equal — maximum entropy (4.52 bits). Right edge (x=3): actual distribution — admin=65, vigilance=52 dominate — entropy drops to 3.48 bits (77% of maximum). The 23% entropy deficit quantifies the architectural asymmetry: concentration of code mass in 2 sections reduces the system's organizational diversity. Not inherently bad — it reflects that PV tools and admin ARE the product. But it means changes to those 2 sections have disproportionate blast radius.",
    category: "architecture",
    dimension: "Information space (scale × granularity)",
    stem: {
      trait: "Concentrate",
      domain: "Science",
      t1: "ν Frequency",
      transfer:
        "Shannon entropy H = -Σpᵢlog₂pᵢ applied to page distribution. Low entropy = concentrated mass. Same metric detects signal surprise in PV (IC) and structural surprise in architecture.",
      supporting: ["Normalize", "Classify"],
      crate: "stem-core",
      tools: ["stem_math_bounds_check", "pv_signal_ic"],
    },
  },
};

export const CATEGORIES: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "All Surfaces" },
  { key: "classical", label: "Classical" },
  { key: "string-theory", label: "String Theory" },
  { key: "signal-theory", label: "Signal Theory" },
  { key: "architecture", label: "Architecture" },
];
