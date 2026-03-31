import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateJSON } from "@/lib/ai/claude";
import { checkPublicRateLimit } from "@/lib/rate-limit";
import { stationCall } from "@/lib/station";

import { logger } from "@/lib/logger";
const log = logger.scope("api/crystalbook/diagnose");

// ============================================================================
// Request Schema
// ============================================================================

const DiagnoseRequestSchema = z.object({
  systemDescription: z.string().min(1).max(500),
  answers: z.array(
    z.object({
      lawNum: z.string(),
      status: z.enum(["healthy", "at-risk", "violated"]),
    }),
  ),
});

// ============================================================================
// Law Reference (no primitives — public-facing text only)
// ============================================================================

const LAW_REFERENCE = [
  {
    num: "I",
    title: "True Measure",
    vice: "Pride",
    virtue: "Humility",
    principle: "No internal state shall be exempt from external validation.",
  },
  {
    num: "II",
    title: "Sufficient Portion",
    vice: "Greed",
    virtue: "Charity",
    principle: "No node shall retain more than it can transform.",
  },
  {
    num: "III",
    title: "Bounded Pursuit",
    vice: "Lust",
    virtue: "Chastity",
    principle: "Pursuit that cannot be completed shall not be initiated.",
  },
  {
    num: "IV",
    title: "Generous Witness",
    vice: "Envy",
    virtue: "Kindness",
    principle:
      "The success of a neighboring system is information, not injury.",
  },
  {
    num: "V",
    title: "Measured Intake",
    vice: "Gluttony",
    virtue: "Temperance",
    principle: "The system shall ingest no more than it can metabolize.",
  },
  {
    num: "VI",
    title: "Measured Response",
    vice: "Wrath",
    virtue: "Patience",
    principle:
      "The magnitude of correction shall never exceed the magnitude of deviation.",
  },
  {
    num: "VII",
    title: "Active Maintenance",
    vice: "Sloth",
    virtue: "Diligence",
    principle:
      "Maintenance of the maintenance function is the highest-priority task.",
  },
  {
    num: "VIII",
    title: "Sovereign Boundary",
    vice: "Corruption",
    virtue: "Independence",
    principle:
      "The resource supply of the boundary and the bounded shall have zero intersection.",
  },
];

// ============================================================================
// Station Types
// ============================================================================

interface StationLaw {
  number: number;
  name: string;
  vice: string;
  virtue: string;
  homeostatic_principle: string;
}

interface StationListLawsResult {
  status: string;
  laws: StationLaw[];
}

interface StationDiagnosticResult {
  existence_check?: Record<string, unknown>;
  law_assessments?: Record<string, unknown>;
  [key: string]: unknown;
}

// Map Station law number (1-8) to Roman numeral for alignment with LAW_REFERENCE
const ROMAN: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
};

// ============================================================================
// Route Handler
// ============================================================================

const SYSTEM_PROMPT = `You are a systems health advisor. You generate diagnostic reports based on The Crystalbook — Eight Laws of System Homeostasis by Matthew A. Campion, PharmD.

Rules:
- Write in plain English. No jargon, no technical terms from the underlying framework.
- Be honest but constructive. The goal is correction, not punishment.
- Be specific to the system described. Generic advice is worthless.
- Keep observations grounded — don't invent problems not reported.
- Return ONLY valid JSON, no markdown fencing.`;

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkPublicRateLimit(
      "crystalbook_diagnostic",
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = DiagnoseRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { systemDescription, answers } = parsed.data;

    // -------------------------------------------------------------------------
    // Station enrichment — authoritative law data + diagnostic framework
    // Falls back to LAW_REFERENCE if Station is unavailable.
    // -------------------------------------------------------------------------
    const [stationLaws, stationDiagnostic] = await Promise.allSettled([
      stationCall<StationListLawsResult>(
        "crystalbook_nexvigilant_com_list_laws",
      ),
      stationCall<StationDiagnosticResult>(
        "crystalbook_nexvigilant_com_diagnose",
        {
          system: systemDescription,
          // Pass a brief preview of answers so Station can frame the structure
          observations: answers
            .map((a) => `Law ${a.lawNum}: ${a.status}`)
            .join(", "),
        },
      ),
    ]);

    const lawsFromStation =
      stationLaws.status === "fulfilled" ? stationLaws.value.laws : null;

    const frameworkFromStation =
      stationDiagnostic.status === "fulfilled" ? stationDiagnostic.value : null;

    if (stationLaws.status === "rejected") {
      log.warn(
        "[crystalbook] Station list_laws unavailable — using fallback:",
        stationLaws.reason,
      );
    }
    if (stationDiagnostic.status === "rejected") {
      log.warn(
        "[crystalbook] Station diagnose unavailable — skipping framework context:",
        stationDiagnostic.reason,
      );
    }

    // Build assessment lines. Station is source of truth when available.
    const assessmentLines = answers.map((a) => {
      if (lawsFromStation) {
        // Map Roman numeral back to Station law number (1-based)
        const lawIndex = Object.entries(ROMAN).find(
          ([, roman]) => roman === a.lawNum,
        );
        const lawNum = lawIndex ? parseInt(lawIndex[0], 10) : null;
        const stationLaw = lawNum
          ? lawsFromStation.find((l) => l.number === lawNum)
          : null;
        if (stationLaw) {
          return `Law ${a.lawNum} (${stationLaw.name}, ${stationLaw.vice}→${stationLaw.virtue}): ${a.status.toUpperCase()}. Principle: "${stationLaw.homeostatic_principle}"`;
        }
      }
      // Fallback to hardcoded reference
      const law = LAW_REFERENCE.find((l) => l.num === a.lawNum);
      if (!law) return "";
      return `Law ${law.num} (${law.title}, ${law.vice}→${law.virtue}): ${a.status.toUpperCase()}. Principle: "${law.principle}"`;
    });

    // Optionally surface Station's diagnostic framework as additional context
    const frameworkContext =
      frameworkFromStation &&
      (frameworkFromStation.existence_check ??
        frameworkFromStation.law_assessments)
        ? `\nStation diagnostic framework (use as structural context):
${JSON.stringify(
  {
    existence_check: frameworkFromStation.existence_check,
    law_assessments: frameworkFromStation.law_assessments,
  },
  null,
  2,
)}\n`
        : "";

    const userMessage = `System being assessed: "${systemDescription}"

Assessment results:
${assessmentLines.join("\n")}
${frameworkContext}
Generate a diagnostic report as JSON with these fields:
- "summary": 2-3 sentence overview of system health, written to the user, specific to their system.
- "lawAnalyses": array of 8 objects, one per law:
  - "lawNum": Roman numeral (I-VIII)
  - "lawTitle": law name
  - "status": "healthy", "at-risk", or "violated" (match input)
  - "observation": 1-2 sentence observation specific to their system
  - "correction": specific recommendation (or "No correction needed — maintain current practices." for healthy)
- "prognosis": single sentence predicting trajectory if current patterns continue.`;

    const report = await generateJSON(SYSTEM_PROMPT, userMessage);
    return NextResponse.json(report);
  } catch (error) {
    log.error("[crystalbook] Diagnostic error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
