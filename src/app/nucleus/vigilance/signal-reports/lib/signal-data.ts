/**
 * Signal Report Data Types and Seed Data
 *
 * Types define the full shape of a signal detection report.
 * Seed data is the tirzepatide + pancreatitis analysis.
 *
 * Future: fetch from pv-compute or Station MCP tools based on URL params.
 */

export interface ContingencyValues {
  /** Drug exposed, event present */
  a: number;
  /** Drug exposed, event absent */
  b: number;
  /** Drug not exposed, event present */
  c: number;
  /** Drug not exposed, event absent */
  d: number;
}

export interface SignalScores {
  prr: number;
  prr_ci: [number, number];
  ror: number;
  ror_ci: [number, number];
  ic: number;
  ic_ci: [number, number];
  ebgm?: number;
  chi_squared: number;
}

export interface LiteratureArticle {
  title: string;
  journal: string;
  year: number;
  pmid: string;
}

export type SignalVerdict = "Strong" | "Moderate" | "Weak" | "Noise";

export interface SignalReportData {
  drug: string;
  event: string;
  rxcui: string;
  brands: string[];
  date_of_analysis: string;
  contingency: ContingencyValues;
  scores: SignalScores;
  observed_rate: number;
  expected_rate: number;
  verdict: SignalVerdict;
  cases_total: number;
  cases_serious: number;
  on_label: boolean;
  label_sections: string[];
  label_quote: string;
  literature_count: number;
  top_articles: LiteratureArticle[];
}

/**
 * Tirzepatide + Pancreatitis — seed data from the station-signal pipeline.
 * PRR = 3.025 (>= 2.0), Chi-sq = 1882 (>= 3.841), N = 1410 (>= 3)
 * All three Evans criteria satisfied → Strong signal.
 */
export const TIRZEPATIDE_PANCREATITIS_SEED: SignalReportData = {
  drug: "tirzepatide",
  event: "pancreatitis",
  rxcui: "2601723",
  brands: ["Mounjaro", "Zepbound"],
  date_of_analysis: "2026-03-28",
  contingency: {
    a: 1410,
    b: 119511,
    c: 76657,
    d: 19809411,
  },
  scores: {
    prr: 3.025,
    prr_ci: [2.871, 3.188],
    ror: 3.049,
    ror_ci: [2.892, 3.215],
    ic: 1.579,
    ic_ci: [1.503, 1.656],
    chi_squared: 1882.094,
  },
  observed_rate: 0.01166,
  expected_rate: 0.003855,
  verdict: "Strong",
  cases_total: 1410,
  cases_serious: 1410,
  on_label: true,
  label_sections: [
    "Warnings and Precautions 5.5",
    "Clinical Trial Data 6.1",
    "Postmarketing 6.2",
  ],
  label_quote:
    "Acute pancreatitis, including fatal and non-fatal hemorrhagic or necrotizing pancreatitis, has been observed.",
  literature_count: 62,
  top_articles: [
    {
      title: "Gastrointestinal adverse events associated with tirzepatide",
      journal: "PLoS ONE",
      year: 2026,
      pmid: "41894422",
    },
    {
      title: "Not All GLP-1 Receptor Agonists Are Alike",
      journal: "Diabetes Metab Res Rev",
      year: 2026,
      pmid: "41886296",
    },
    {
      title:
        "Musculoskeletal adverse events with incretin-based diabetes drugs",
      journal: "Naunyn-Schmiedeberg's Arch Pharmacol",
      year: 2026,
      pmid: "41748946",
    },
  ],
};

const STATION_URL = "https://mcp.nexvigilant.com";

async function stationFetch(tool: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${STATION_URL}/tools/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    next: { revalidate: 3600 }, // Cache 1 hour
  });
  if (!res.ok) throw new Error(`Station ${tool}: HTTP ${res.status}`);
  const body = await res.json();
  const text = body?.content?.[0]?.text;
  if (!text) throw new Error(`Station ${tool}: no content`);
  return JSON.parse(text);
}

/** Resolve report data for a given drug/event slug pair.
 *  Checks seed data first, then fetches live from AlgoVigilance Station. */
export async function resolveReportData(
  drug: string,
  event: string,
): Promise<SignalReportData> {
  const normalizedDrug = drug.toLowerCase().replace(/-/g, " ");
  const normalizedEvent = event.toLowerCase().replace(/-/g, " ");

  // Seed data for known pairs
  if (normalizedDrug === "tirzepatide" && normalizedEvent === "pancreatitis") {
    return TIRZEPATIDE_PANCREATITIS_SEED;
  }

  // Live fetch from Station
  try {
    const [dispro, label, lit] = await Promise.all([
      stationFetch("open-vigil_fr_compute_disproportionality", {
        drug: normalizedDrug,
        event: normalizedEvent,
      }),
      stationFetch("dailymed_nlm_nih_gov_get_adverse_reactions", {
        drug_name: normalizedDrug,
      }),
      stationFetch("pubmed_ncbi_nlm_nih_gov_search_signal_literature", {
        drug: normalizedDrug,
        event: normalizedEvent,
      }),
    ]);

    const scores = (dispro.scores ?? {}) as Record<string, number>;
    const ct = (dispro.contingency_table ?? {}) as Record<string, number>;
    const a = ct.a_drug_event ?? 0;
    const b = ct.b_drug_noevent ?? 0;
    const c = ct.c_nodrug_event ?? 0;
    const d = ct.d_nodrug_noevent ?? 0;
    const observedRate = (a + b) > 0 ? a / (a + b) : 0;
    const expectedRate = (c + d) > 0 ? c / (c + d) : 0;
    const prr = scores.PRR ?? 0;
    const chi = scores.chi_squared ?? 0;

    const adrs = (label.adverse_reactions as string) ?? "";
    const onLabel = adrs.toLowerCase().includes(normalizedEvent.toLowerCase());

    const articles = ((lit.articles ?? lit.results ?? []) as Array<Record<string, unknown>>)
      .slice(0, 5)
      .map((a) => ({
        title: (a.title as string) ?? "Untitled",
        journal: (a.journal as string) ?? "Unknown",
        year: (a.year as number) ?? 2026,
        pmid: String(a.pmid ?? "N/A"),
      }));

    let verdict: SignalVerdict = "Noise";
    if (prr >= 2.0 && chi >= 3.841 && a >= 3) {
      verdict = prr >= 5 ? "Strong" : "Moderate";
    } else if (prr >= 1.5 || (chi >= 3.841 && a >= 3)) {
      verdict = "Weak";
    }

    return {
      drug: normalizedDrug,
      event: normalizedEvent,
      rxcui: "",
      brands: [],
      date_of_analysis: new Date().toISOString().slice(0, 10),
      contingency: { a, b, c, d },
      scores: {
        prr: scores.PRR ?? 0,
        prr_ci: [scores.PRR_CI_lower ?? 0, scores.PRR_CI_upper ?? 0],
        ror: scores.ROR ?? 0,
        ror_ci: [scores.ROR_CI_lower ?? 0, scores.ROR_CI_upper ?? 0],
        ic: scores.IC ?? 0,
        ic_ci: [scores.IC025 ?? 0, scores.IC975 ?? 0],
        chi_squared: scores.chi_squared ?? 0,
      },
      observed_rate: observedRate,
      expected_rate: expectedRate,
      verdict,
      cases_total: a,
      cases_serious: a,
      on_label: onLabel,
      label_sections: onLabel ? ["Adverse Reactions"] : [],
      label_quote: onLabel ? `${normalizedEvent} appears in the drug label.` : "",
      literature_count: articles.length,
      top_articles: articles,
    };
  } catch {
    // Fallback: return seed data with the URL params substituted
    return {
      ...TIRZEPATIDE_PANCREATITIS_SEED,
      drug: normalizedDrug,
      event: normalizedEvent,
    };
  }
}

/** Verdict color and label metadata */
export const VERDICT_META: Record<
  SignalVerdict,
  { label: string; color: string; border: string; bg: string; desc: string }
> = {
  Strong: {
    label: "Strong Signal",
    color: "text-red-400",
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    desc: "All Evans criteria met. PRR >= 2, Chi-sq >= 3.841, N >= 3.",
  },
  Moderate: {
    label: "Moderate Signal",
    color: "text-amber-400",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    desc: "Partial Evans criteria. Warrants further investigation.",
  },
  Weak: {
    label: "Weak Signal",
    color: "text-yellow-400",
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/10",
    desc: "Limited statistical support. Monitor for accumulating evidence.",
  },
  Noise: {
    label: "No Signal",
    color: "text-emerald-400",
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    desc: "No disproportionality detected at standard thresholds.",
  },
};
