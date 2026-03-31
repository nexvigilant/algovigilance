import { type NextRequest, NextResponse } from "next/server";

const STATION_URL = "https://mcp.nexvigilant.com";

async function stationCall(tool: string, params: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${STATION_URL}/tools/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Station ${tool}: HTTP ${res.status}`);
  const body = await res.json();
  const text = body?.content?.[0]?.text;
  if (!text) throw new Error(`Station ${tool}: no content`);
  return JSON.parse(text);
}

export async function POST(request: NextRequest) {
  try {
    const { drug, event } = await request.json();

    if (!drug || !event) {
      return NextResponse.json(
        { error: "drug and event are required" },
        { status: 400 }
      );
    }

    // Gather data from Station (parallel)
    const [faers, dispro, label, literature] = await Promise.all([
      stationCall("api_fda_gov_search_adverse_events", {
        drug_name: drug,
        reaction: event,
        serious: true,
        limit: 5,
      }),
      stationCall("open-vigil_fr_compute_disproportionality", {
        drug,
        event,
      }),
      stationCall("dailymed_nlm_nih_gov_get_adverse_reactions", {
        drug_name: drug,
      }),
      stationCall("pubmed_ncbi_nlm_nih_gov_search_signal_literature", {
        drug,
        event,
      }),
    ]);

    // Extract scores for microgram verdict
    const scores = (dispro as Record<string, unknown>)?.scores as Record<string, number> | undefined;
    const prr = scores?.PRR ?? 0;
    const ror = scores?.ROR ?? 0;
    const ic = scores?.IC ?? 0;

    const verdict = await stationCall(
      "microgram_nexvigilant_com_run_signal_consensus_to_action",
      {
        prr,
        ror,
        ic,
        ebgm: ic,
        naranjo_score: 5,
        is_serious: true,
      }
    );

    // Build structured report data
    const contingency = (dispro as Record<string, unknown>)?.contingency_table as Record<string, number> | undefined;
    const finalOutput = (verdict as Record<string, unknown>)?.final_output as Record<string, unknown> ?? verdict;
    const adrs = ((label as Record<string, unknown>)?.adverse_reactions as string) ?? "";
    const onLabel = adrs.toLowerCase().includes(event.toLowerCase());
    const articles = ((literature as Record<string, unknown>)?.articles ??
      (literature as Record<string, unknown>)?.results ?? []) as Array<Record<string, unknown>>;

    const report = {
      drug,
      event,
      generated: new Date().toISOString(),
      signal_strength: prr >= 5 ? "Strong" : prr >= 2 ? "Moderate" : "Weak",
      scores: {
        prr,
        prr_ci_lower: scores?.PRR_CI_lower ?? 0,
        prr_ci_upper: scores?.PRR_CI_upper ?? 0,
        ror,
        ror_ci_lower: scores?.ROR_CI_lower ?? 0,
        ror_ci_upper: scores?.ROR_CI_upper ?? 0,
        ic,
        chi_squared: scores?.chi_squared ?? 0,
      },
      contingency_table: {
        a: contingency?.a_drug_event ?? 0,
        b: contingency?.b_drug_noevent ?? 0,
        c: contingency?.c_nodrug_event ?? 0,
        d: contingency?.d_nodrug_noevent ?? 0,
        total: contingency?.total_reports ?? 0,
      },
      on_label: onLabel,
      literature_count: articles.length,
      top_articles: articles.slice(0, 5).map((a) => ({
        title: a.title,
        pmid: a.pmid,
      })),
      verdict: {
        causality: finalOutput?.causality ?? "Unknown",
        action: finalOutput?.regulatory_action ?? finalOutput?.action ?? "Unknown",
        deadline_days: finalOutput?.deadline_days ?? null,
      },
      methodology:
        "AlgoVigilance autonomous PV pipeline. Sources: FDA FAERS, OpenVigil France, DailyMed, PubMed. " +
        "Signal classification: Evans (2001). Causality: microgram chain (signal-consensus-to-action).",
      station_url: STATION_URL,
    };

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
