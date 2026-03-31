/**
 * Crystalbook Diagnostic — Public Assessment Data
 *
 * The Eight Laws mapped to plain-English diagnostic questions.
 * No primitives, no conservation equations — just the laws and their tests.
 *
 * @module data/crystalbook-diagnostic
 */

export type LawStatus = "healthy" | "at-risk" | "violated";

export interface DiagnosticQuestion {
  lawNum: string;
  lawTitle: string;
  vice: string;
  virtue: string;
  question: string;
  description: string;
  healthySignal: string;
  riskSignal: string;
  violatedSignal: string;
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    lawNum: "I",
    lawTitle: "True Measure",
    vice: "Pride",
    virtue: "Humility",
    question: "Is your system honest about what it doesn't know?",
    description:
      "Systems fail when they stop validating their own assumptions. Confidence without measurement is the first crack.",
    healthySignal: "We regularly test our assumptions against reality",
    riskSignal: "We sometimes operate on untested beliefs",
    violatedSignal: "We trust our internal model more than external feedback",
  },
  {
    lawNum: "II",
    lawTitle: "Sufficient Portion",
    vice: "Greed",
    virtue: "Charity",
    question: "Does information and authority flow freely?",
    description:
      "When one part of a system hoards resources, data, or decision-making power, the rest starves. Circulation is health.",
    healthySignal: "Resources reach where they're needed",
    riskSignal: "Some bottlenecks slow the flow",
    violatedSignal:
      "Key resources are concentrated and don't reach those who need them",
  },
  {
    lawNum: "III",
    lawTitle: "Bounded Pursuit",
    vice: "Lust",
    virtue: "Chastity",
    question: "Does your system finish what it starts?",
    description:
      "Chasing every opportunity while completing none is how systems scatter their energy. Depth requires the refusal of breadth.",
    healthySignal: "We complete commitments before taking on new ones",
    riskSignal: "We sometimes overextend into new initiatives",
    violatedSignal: "We're stretched across too many incomplete efforts",
  },
  {
    lawNum: "IV",
    lawTitle: "Generous Witness",
    vice: "Envy",
    virtue: "Kindness",
    question: "Do you learn from others' success?",
    description:
      "When a neighbor's success feels like a threat instead of a signal, collaboration dies. The ecosystem is a commons, not an arena.",
    healthySignal: "We study what works elsewhere and adapt it",
    riskSignal: "We occasionally feel threatened by peer success",
    violatedSignal:
      "Competitor success triggers defensive reactions, not learning",
  },
  {
    lawNum: "V",
    lawTitle: "Measured Intake",
    vice: "Gluttony",
    virtue: "Temperance",
    question: "Can your system process what it takes in?",
    description:
      "Ingesting data, requirements, and meetings without transforming them into decisions is bloat. Signal-to-noise degrades when everything is kept.",
    healthySignal: "We process inputs within a reasonable cycle",
    riskSignal: "Backlogs are growing faster than we resolve them",
    violatedSignal:
      "We accumulate far more than we can act on — inbox zero is a distant memory",
  },
  {
    lawNum: "VI",
    lawTitle: "Measured Response",
    vice: "Wrath",
    virtue: "Patience",
    question: "Are your reactions proportionate?",
    description:
      "When a small problem triggers a massive response, the correction becomes worse than the deviation. Absorb before you act.",
    healthySignal: "We calibrate responses to the size of the issue",
    riskSignal: "We sometimes overreact to minor setbacks",
    violatedSignal:
      "Incident response often creates more disruption than the original problem",
  },
  {
    lawNum: "VII",
    lawTitle: "Active Maintenance",
    vice: "Sloth",
    virtue: "Diligence",
    question: "Does your system check its own health?",
    description:
      "A system that stops inspecting itself is already degrading. By the time collapse is visible, the mechanisms that could have prevented it have rusted shut.",
    healthySignal: "We actively monitor our own processes and fix issues early",
    riskSignal: "Health checks happen but aren't always acted on",
    violatedSignal: "We don't have reliable ways to detect our own degradation",
  },
  {
    lawNum: "VIII",
    lawTitle: "Sovereign Boundary",
    vice: "Corruption",
    virtue: "Independence",
    question: "Are your boundaries independent from what they constrain?",
    description:
      "When the entity a boundary was designed to oversee becomes its benefactor, the boundary inverts — protecting the powerful instead of constraining them.",
    healthySignal: "Our oversight functions operate independently",
    riskSignal: "Some oversight depends on the entities being overseen",
    violatedSignal:
      "Those who should be constrained have influence over their own constraints",
  },
];

export interface DiagnosticResult {
  systemDescription: string;
  answers: { lawNum: string; status: LawStatus }[];
  satisfiedCount: number;
  atRiskCount: number;
  violatedCount: number;
}

export function scoreDiagnostic(
  answers: { lawNum: string; status: LawStatus }[],
): { satisfied: number; atRisk: number; violated: number; grade: string } {
  const satisfied = answers.filter((a) => a.status === "healthy").length;
  const atRisk = answers.filter((a) => a.status === "at-risk").length;
  const violated = answers.filter((a) => a.status === "violated").length;

  let grade: string;
  if (violated === 0 && atRisk <= 1) grade = "Resilient";
  else if (violated <= 1 && atRisk <= 3) grade = "Stable";
  else if (violated <= 3) grade = "Under Stress";
  else grade = "Critical";

  return { satisfied, atRisk, violated, grade };
}
