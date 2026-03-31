/**
 * AlgoVigilance Alert Backend Configuration
 *
 * Maps to the FastAPI backend at nexvigilant-alert.
 * Dev: localhost:8000, Prod: Cloud Run service URL.
 */

export const ALERTS_API_URL =
  process.env.ALERTS_API_URL || "http://localhost:8000";

/** Router prefixes from the FastAPI backend */
export const ALERT_PREFIXES = {
  compliance: "/api/compliance",
  adverseEvents: "/api/adverse-events",
  equipment: "/api/equipment",
  medicalDevice: "/api/medical-device",
  vendorRisk: "/api/vendor-risk",
  threatResponse: "/api/threat-response",
  security: "/api",
  monitoring: "/api/monitoring",
  training: "/api/training",
  wizard: "/wizard",
  fhir: "/fhir",
} as const;
