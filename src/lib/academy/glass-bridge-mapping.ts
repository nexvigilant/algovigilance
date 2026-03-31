/**
 * Glass Bridge Mapping — Academy → Station
 *
 * Maps KSB domain IDs to live Station tools that demonstrate the competency.
 * Each tool entry has a name, description, a sample action, and the Station demo path.
 */

export interface GlassTool {
  name: string;
  description: string;
  example: string;
  href: string;
  color: "cyan" | "gold" | "copper";
}

export interface GlassBridgeConfig {
  headline: string;
  tools: GlassTool[];
}

const STATION_DEMO = "/station/demo";

export const GLASS_BRIDGE_MAP: Record<string, GlassBridgeConfig> = {
  D01: {
    headline: "Run live PV computations on real-world data",
    tools: [
      {
        name: "FAERS Search",
        description: "Query 20M+ adverse event reports by drug or reaction",
        example: "Search semaglutide + pancreatitis",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "PRR / ROR Calculator",
        description:
          "Compute disproportionality signals from spontaneous reports",
        example: "PRR = 4.2 (above 2.0 threshold)",
        href: STATION_DEMO,
        color: "gold",
      },
    ],
  },
  D02: {
    headline: "Assess ADR causality with validated algorithms",
    tools: [
      {
        name: "Naranjo Causality",
        description: "10-question Naranjo algorithm scored in real time",
        example: "Score 7 → Probable causality",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "WHO-UMC Assessment",
        description: "WHO-UMC 6-category causality classification",
        example: "Certain / Probable / Possible",
        href: STATION_DEMO,
        color: "gold",
      },
      {
        name: "DailyMed Labeling",
        description: "Pull current ADR sections from FDA-approved labeling",
        example: "Boxed warnings, adverse reactions section",
        href: STATION_DEMO,
        color: "copper",
      },
    ],
  },
  D03: {
    headline: "Identify and classify important ADRs using live data",
    tools: [
      {
        name: "ICH E2A Seriousness",
        description: "Classify seriousness against ICH E2A criteria",
        example: "Life-threatening / Hospitalisation / Death",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "Signal Trend",
        description: "Track reporting rate over time for a drug-event pair",
        example: "2018–2025 quarterly trend",
        href: STATION_DEMO,
        color: "gold",
      },
    ],
  },
  D04: {
    headline: "Process ICSRs with live regulatory tools",
    tools: [
      {
        name: "Case Completeness Score",
        description: "Score ICSR data quality against E2B(R3) requirements",
        example: "Completeness: 87 / 100",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "ICH E2A Seriousness",
        description: "Apply expedited reporting criteria in real time",
        example: "15-day vs 7-day vs non-expedited",
        href: STATION_DEMO,
        color: "gold",
      },
      {
        name: "MedDRA Terms",
        description: "Validate and code adverse events using MedDRA hierarchy",
        example: "PT → HLT → HLGT → SOC",
        href: STATION_DEMO,
        color: "copper",
      },
    ],
  },
  D05: {
    headline: "Apply PV methodology in clinical trial contexts",
    tools: [
      {
        name: "ClinicalTrials.gov",
        description:
          "Retrieve SAE data and safety endpoints from registered trials",
        example: "NCT04668612 serious adverse events",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "Time to Onset",
        description:
          "Compute median time-to-onset distribution from FAERS cases",
        example: "Median TTO: 14 days (IQR 7–42)",
        href: STATION_DEMO,
        color: "gold",
      },
    ],
  },
  D06: {
    headline: "Detect medication errors and quality signals",
    tools: [
      {
        name: "FAERS Event Search",
        description: "Filter for medication error reports and confusion cases",
        example: "LOOK-ALIKE / SOUND-ALIKE events",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "Reporter Breakdown",
        description:
          "Understand who is reporting — HCP vs consumer vs manufacturer",
        example: "64% HCP, 28% consumer, 8% other",
        href: STATION_DEMO,
        color: "gold",
      },
    ],
  },
  D07: {
    headline: "Work with spontaneous reporting system data directly",
    tools: [
      {
        name: "FAERS Search",
        description: "Query FDA Adverse Event Reporting System in real time",
        example: "17,432 reports for metformin",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "VigiAccess",
        description: "WHO global ICSR database — 38M+ reports",
        example: "Regional distribution, year trends",
        href: STATION_DEMO,
        color: "gold",
      },
      {
        name: "EudraVigilance",
        description: "EU spontaneous reports via EMA database",
        example: "EU case counts by SOC",
        href: STATION_DEMO,
        color: "copper",
      },
    ],
  },
  D08: {
    headline: "Run the full signal detection pipeline live",
    tools: [
      {
        name: "PRR / ROR",
        description:
          "Proportional and reporting odds ratios with confidence intervals",
        example: "PRR 4.2 (95% CI 3.1–5.7) — signal",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "IC / EBGM",
        description:
          "Information Component and Empirical Bayes disproportionality",
        example: "IC025 > 0 threshold met",
        href: STATION_DEMO,
        color: "gold",
      },
      {
        name: "OpenVigil",
        description: "French PV database disproportionality analysis",
        example: "ROR 6.8 (p < 0.001)",
        href: STATION_DEMO,
        color: "copper",
      },
    ],
  },
  D09: {
    headline: "Access observational study and post-authorization data",
    tools: [
      {
        name: "PubMed Literature",
        description: "Search signal literature and case reports by drug/event",
        example: "47 case reports, 8 systematic reviews",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "ClinicalTrials.gov",
        description: "Post-authorization trial safety data and endpoints",
        example: "Phase 4 trial SAE rates",
        href: STATION_DEMO,
        color: "gold",
      },
    ],
  },
  D10: {
    headline: "Perform benefit-risk assessment with live evidence",
    tools: [
      {
        name: "Benefit-Risk Calculator",
        description: "Quantitative benefit-risk ratio with evidence weighting",
        example: "B:R ratio 4.1 → Favourable",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "Number Needed to Harm",
        description: "Compute NNH from FAERS incidence rates",
        example: "NNH: 1 in 847 patients",
        href: STATION_DEMO,
        color: "gold",
      },
      {
        name: "EMA EPAR",
        description:
          "European Public Assessment Report benefit-risk conclusions",
        example: "EU benefit-risk conclusions for the product",
        href: STATION_DEMO,
        color: "copper",
      },
    ],
  },
  D11: {
    headline: "Access risk management tools and regulatory guidance",
    tools: [
      {
        name: "EMA RMP Summary",
        description: "Risk Management Plan summary for authorised products",
        example: "Safety concerns, risk minimisation measures",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "FDA REMS",
        description: "Risk Evaluation and Mitigation Strategies database",
        example: "REMS requirements and elements",
        href: STATION_DEMO,
        color: "gold",
      },
    ],
  },
  D12: {
    headline: "Navigate the global regulatory framework live",
    tools: [
      {
        name: "ICH Guidelines",
        description: "Full text of ICH E2A, E2C, E2D, E2E, E2F guidelines",
        example: "E2A expedited reporting definitions",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "FDA Safety Communications",
        description: "MedWatch alerts, boxed warning additions, label changes",
        example: "Recent safety label updates",
        href: STATION_DEMO,
        color: "gold",
      },
      {
        name: "EMA Safety Signals",
        description: "PRAC signal assessments and referral outcomes",
        example: "Active PRAC procedures",
        href: STATION_DEMO,
        color: "copper",
      },
    ],
  },
  D13: {
    headline: "Explore global PV infrastructure and public health data",
    tools: [
      {
        name: "VigiAccess",
        description: "WHO global database — 38M+ reports from 130+ countries",
        example: "Age/sex distribution worldwide",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "WHO-UMC Country Programs",
        description: "National pharmacovigilance program directory",
        example: "Program maturity, reporting statistics",
        href: STATION_DEMO,
        color: "gold",
      },
    ],
  },
  D14: {
    headline: "Access communication resources and safety labeling",
    tools: [
      {
        name: "DailyMed Drug Label",
        description: "Current FDA-approved prescribing information",
        example: "Boxed warning, contraindications, ADRs",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "FDA MedWatch Alerts",
        description: "Public safety communications and Dear HCP letters",
        example: "Recent drug safety communications",
        href: STATION_DEMO,
        color: "gold",
      },
    ],
  },
  D15: {
    headline: "Search primary literature and reference databases",
    tools: [
      {
        name: "PubMed Search",
        description: "40M+ biomedical articles with MeSH filtering",
        example: "Signal literature, case reports, systematic reviews",
        href: STATION_DEMO,
        color: "cyan",
      },
      {
        name: "DrugBank",
        description: "Pharmacology, targets, interactions, adverse effects",
        example: "Mechanism of toxicity, drug interactions",
        href: STATION_DEMO,
        color: "gold",
      },
      {
        name: "MedDRA Terminology",
        description: "Hierarchical adverse event terminology browser",
        example: "PT → HLT → HLGT → SOC navigation",
        href: STATION_DEMO,
        color: "copper",
      },
    ],
  },
};

/** Fall-through config for domains without a specific mapping */
export const DEFAULT_GLASS_CONFIG: GlassBridgeConfig = {
  headline: "See pharmacovigilance tools in action",
  tools: [
    {
      name: "FAERS Signal Detection",
      description:
        "Live 6-step pipeline: drug → FAERS → PRR → DailyMed → PubMed → verdict",
      example: "Full semaglutide + pancreatitis pipeline",
      href: STATION_DEMO,
      color: "cyan",
    },
    {
      name: "Naranjo Causality",
      description: "Causality assessment with real ICSR data",
      example: "Score 7 → Probable",
      href: STATION_DEMO,
      color: "gold",
    },
  ],
};

export function getGlassBridgeConfig(domainId: string): GlassBridgeConfig {
  return GLASS_BRIDGE_MAP[domainId] ?? DEFAULT_GLASS_CONFIG;
}
