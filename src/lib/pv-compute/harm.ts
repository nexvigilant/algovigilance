/**
 * Client-side harm type routing per AlgoVigilance Theory of Vigilance.
 *
 * Mirrors 1 microgram from rsk-core/rsk/micrograms/:
 *   - harm-type-router.yaml → classifyHarmType()
 *
 * Maps ToV harm types A-H to response protocols, severity, SLA, and escalation flag.
 * Reference: AlgoVigilance 8-type harm taxonomy (ToV)
 */

export type HarmTypeLetter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | string;
export type HarmProtocol =
  | "EXPEDITED_7DAY"
  | "EXPEDITED_15DAY"
  | "PERIODIC_PSUR";
export type HarmSeverity =
  | "FATAL"
  | "LIFE_THREATENING"
  | "SERIOUS"
  | "SIGNIFICANT"
  | "NON_SERIOUS"
  | "OTHER";

export interface HarmTypeInput {
  harm_type?: HarmTypeLetter;
}

export interface HarmTypeResult {
  protocol: HarmProtocol;
  severity: HarmSeverity;
  sla_hours: 24 | 72 | 120 | 720;
  escalate: boolean;
}

/**
 * Route ToV harm types A-H to response protocols.
 * A/B → 7-day expedited (fatal/life-threatening, SLA 24h)
 * C/D/E → 15-day expedited (serious, SLA 72h)
 * F → 15-day expedited (significant, SLA 120h)
 * G/H → periodic PSUR (non-serious/other, SLA 720h)
 * Mirrors harm-type-router.yaml.
 */
export function classifyHarmType(input: HarmTypeInput): HarmTypeResult {
  const type = input.harm_type ?? "";

  switch (type) {
    case "A":
      return {
        protocol: "EXPEDITED_7DAY",
        severity: "FATAL",
        sla_hours: 24,
        escalate: true,
      };
    case "B":
      return {
        protocol: "EXPEDITED_7DAY",
        severity: "LIFE_THREATENING",
        sla_hours: 24,
        escalate: true,
      };
    case "C":
      return {
        protocol: "EXPEDITED_15DAY",
        severity: "SERIOUS",
        sla_hours: 72,
        escalate: true,
      };
    case "D":
      return {
        protocol: "EXPEDITED_15DAY",
        severity: "SERIOUS",
        sla_hours: 72,
        escalate: true,
      };
    case "E":
      return {
        protocol: "EXPEDITED_15DAY",
        severity: "SERIOUS",
        sla_hours: 72,
        escalate: true,
      };
    case "F":
      return {
        protocol: "EXPEDITED_15DAY",
        severity: "SIGNIFICANT",
        sla_hours: 120,
        escalate: true,
      };
    case "G":
      return {
        protocol: "PERIODIC_PSUR",
        severity: "NON_SERIOUS",
        sla_hours: 720,
        escalate: false,
      };
    default:
      return {
        protocol: "PERIODIC_PSUR",
        severity: "OTHER",
        sla_hours: 720,
        escalate: false,
      };
  }
}
