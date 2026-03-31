import { NextRequest } from "next/server";

// ═══════════════════════════════════════════════════════════════════
// Pharma Attack API — Streams FAERS signal detection + stock data
//
// GET /api/pharma-attack?tickers=NVO,LLY,PFE
// Returns: streaming JSON lines, one per drug-event signal
// ═══════════════════════════════════════════════════════════════════

const FAERS_BASE = "https://api.fda.gov/drug/event.json";
const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const FAERS_TOTAL = 20_000_000;

interface DrugConfig {
  field: "generic_name" | "brand_name";
  term: string;
}

interface TargetConfig {
  company: string;
  drugs: Record<string, DrugConfig>;
  events: string[];
}

const TARGETS: Record<string, TargetConfig> = {
  NVO: {
    company: "Novo Nordisk",
    drugs: {
      semaglutide: { field: "generic_name", term: "semaglutide" },
      liraglutide: { field: "generic_name", term: "liraglutide" },
    },
    events: [
      "pancreatitis",
      "thyroid cancer",
      "gastroparesis",
      "suicidal ideation",
      "intestinal obstruction",
      "gallbladder disorder",
      "acute kidney injury",
      "pancreatitis acute",
    ],
  },
  LLY: {
    company: "Eli Lilly",
    drugs: {
      tirzepatide: { field: "generic_name", term: "tirzepatide" },
      dulaglutide: { field: "generic_name", term: "dulaglutide" },
    },
    events: [
      "pancreatitis",
      "thyroid cancer",
      "gastroparesis",
      "gallbladder disorder",
      "acute kidney injury",
      "injection site reaction",
      "hypoglycaemia",
      "intestinal obstruction",
      "pancreatitis acute",
    ],
  },
  PFE: {
    company: "Pfizer",
    drugs: {
      nirmatrelvir: { field: "generic_name", term: "nirmatrelvir" },
      apixaban: { field: "generic_name", term: "apixaban" },
    },
    events: [
      "drug interaction",
      "hepatotoxicity",
      "haemorrhage",
      "cardiac failure",
      "renal impairment",
      "thrombocytopenia",
      "gastrointestinal haemorrhage",
      "cerebrovascular accident",
    ],
  },
  AZN: {
    company: "AstraZeneca",
    drugs: {
      osimertinib: { field: "generic_name", term: "osimertinib" },
      dapagliflozin: { field: "generic_name", term: "dapagliflozin" },
    },
    events: [
      "interstitial lung disease",
      "cardiac failure",
      "hepatotoxicity",
      "ketoacidosis",
      "pneumonitis",
      "cardiomyopathy",
    ],
  },
  MRK: {
    company: "Merck",
    drugs: {
      pembrolizumab: { field: "generic_name", term: "pembrolizumab" },
    },
    events: [
      "pneumonitis",
      "colitis",
      "hepatitis",
      "nephritis",
      "myocarditis",
      "encephalitis",
      "adrenal insufficiency",
      "thyroiditis",
    ],
  },
  JNJ: {
    company: "Johnson & Johnson",
    drugs: {
      daratumumab: { field: "generic_name", term: "daratumumab" },
      ustekinumab: { field: "generic_name", term: "ustekinumab" },
    },
    events: [
      "serious infection",
      "malignancy",
      "infusion reaction",
      "neutropenia",
      "thrombocytopenia",
      "hepatotoxicity",
    ],
  },
  AMGN: {
    company: "Amgen",
    drugs: {
      denosumab: { field: "generic_name", term: "denosumab" },
    },
    events: [
      "osteonecrosis of jaw",
      "atypical femur fracture",
      "hypocalcaemia",
      "serious infection",
      "osteonecrosis",
    ],
  },
  REGN: {
    company: "Regeneron",
    drugs: {
      dupilumab: { field: "generic_name", term: "dupilumab" },
      aflibercept: { field: "generic_name", term: "aflibercept" },
    },
    events: [
      "conjunctivitis",
      "keratitis",
      "eosinophilia",
      "endophthalmitis",
      "retinal detachment",
    ],
  },
};

const HIGH_IMPACT = new Set([
  "death",
  "sudden death",
  "completed suicide",
  "suicidal ideation",
  "cardiac arrest",
  "hepatic failure",
  "pancreatitis acute",
  "thyroid cancer",
  "medullary thyroid carcinoma",
  "intestinal obstruction",
  "myocarditis",
  "encephalitis",
  "cerebrovascular accident",
  "osteonecrosis of jaw",
  "endophthalmitis",
  "progressive multifocal leukoencephalopathy",
]);

async function fdaCount(search: string): Promise<number> {
  // openFDA expects raw query syntax — don't encodeURIComponent
  // (quotes, plus signs, and colons are part of the query language)
  const url = `${FAERS_BASE}?search=${search}&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AlgoVigilance/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data?.meta?.results?.total ?? 0;
  } catch {
    return 0;
  }
}

async function fetchStock(ticker: string) {
  const url = `${YAHOO_BASE}/${ticker}?range=3mo&interval=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (AlgoVigilance/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart.result[0];
    const closes: number[] = result.indicators.quote[0].close.filter(
      (c: number | null) => c !== null,
    );
    if (closes.length < 2) return null;
    const price = closes[closes.length - 1];
    const change1m =
      closes.length >= 22
        ? ((price - closes[closes.length - 22]) / closes[closes.length - 22]) *
          100
        : 0;
    const changeYtd = ((price - closes[0]) / closes[0]) * 100;
    return {
      price: Math.round(price * 100) / 100,
      change1m: Math.round(change1m * 10) / 10,
      changeYtd: Math.round(changeYtd * 10) / 10,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const tickerParam = req.nextUrl.searchParams.get("tickers") ?? "NVO,LLY,PFE";
  const tickers = tickerParam.split(",").map((t) => t.trim().toUpperCase());

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: Record<string, unknown>) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      send({ type: "start", tickers, timestamp: new Date().toISOString() });

      for (const ticker of tickers) {
        const target = TARGETS[ticker];
        if (!target) {
          send({ type: "skip", ticker, reason: "not in database" });
          continue;
        }

        // Fetch stock data
        const stock = await fetchStock(ticker);
        send({ type: "stock", ticker, company: target.company, stock });

        // Scan each drug × event
        for (const [drugName, drugConf] of Object.entries(target.drugs)) {
          for (const event of target.events) {
            const eventSafe = event.replace(/ /g, "+");
            const drugQ = `patient.drug.openfda.${drugConf.field}:${drugConf.term}`;
            const eventQ = `patient.reaction.reactionmeddrapt:"${eventSafe}"`;

            const a = await fdaCount(`${drugQ}+AND+${eventQ}`);
            if (a === 0) {
              send({
                type: "signal",
                ticker,
                drug: drugName,
                event,
                a: 0,
                prr: 0,
                detected: false,
              });
              await new Promise((r) => setTimeout(r, 350));
              continue;
            }

            await new Promise((r) => setTimeout(r, 350));
            const ab = await fdaCount(drugQ);
            await new Promise((r) => setTimeout(r, 350));
            const ac = await fdaCount(eventQ);

            const b = ab - a;
            const c = ac - a;
            const d = FAERS_TOTAL - a - b - c;

            if (b <= 0 || c <= 0 || d <= 0) {
              send({
                type: "signal",
                ticker,
                drug: drugName,
                event,
                a,
                prr: 0,
                detected: false,
              });
              continue;
            }

            const prr = a / (a + b) / (c / (c + d));
            const ror = (a * d) / (b * c);
            const chi2 =
              ((a * d - b * c) ** 2 * (a + b + c + d)) /
              ((a + b) * (c + d) * (a + c) * (b + d));
            const expected = ((a + b) * (a + c)) / (a + b + c + d);
            const ic = expected > 0 && a > 0 ? Math.log2(a / expected) : 0;

            const evansMet = prr >= 2 && chi2 >= 4 && a >= 3;
            const isHighImpact = HIGH_IMPACT.has(event.toLowerCase());

            let threat: string;
            if (prr >= 5 && evansMet && (a >= 50 || isHighImpact))
              threat = "CRITICAL";
            else if (prr >= 3 && evansMet) threat = "HIGH";
            else if (prr >= 2 && evansMet) threat = "MODERATE";
            else if (prr >= 1.5) threat = "LOW";
            else threat = "NOISE";

            send({
              type: "signal",
              ticker,
              drug: drugName,
              event,
              a,
              b,
              c,
              d,
              prr: Math.round(prr * 100) / 100,
              ror: Math.round(ror * 100) / 100,
              ic: Math.round(ic * 100) / 100,
              chi2: Math.round(chi2 * 10) / 10,
              evansMet,
              threat,
              isHighImpact,
              detected: evansMet,
            });

            await new Promise((r) => setTimeout(r, 350));
          }
        }

        send({ type: "ticker_complete", ticker });
      }

      send({ type: "complete", timestamp: new Date().toISOString() });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
