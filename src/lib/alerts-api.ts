/**
 * AlgoVigilance Alert API Client
 *
 * Typed client for the nexvigilant-alert FastAPI backend.
 * All calls go through /api/alerts/ proxy which handles auth.
 */

const BASE = "/api/alerts";

async function alertFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Alert API error: ${res.status}`);
  }
  return res.json();
}

function get<T>(path: string): Promise<T> {
  return alertFetch<T>(path);
}

function post<T>(path: string, body: unknown): Promise<T> {
  return alertFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function put<T>(path: string, body: unknown): Promise<T> {
  return alertFetch<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

function del<T>(path: string): Promise<T> {
  return alertFetch<T>(path, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Compliance (24 endpoints)
// ---------------------------------------------------------------------------

export const compliance = {
  getScore: () => get<ComplianceScore>("/api/compliance/score"),
  getStatus: () => get<ComplianceStatus>("/api/compliance/status"),
  getAuditLog: (params?: { limit?: number }) =>
    get<AuditEntry[]>(
      `/api/compliance/audit-log${params?.limit ? `?limit=${params.limit}` : ""}`,
    ),
  getBreaches: () => get<Breach[]>("/api/compliance/breaches"),
  reportBreach: (data: BreachReport) =>
    post<Breach>("/api/compliance/breaches", data),
  getSignatures: () => get<Signature[]>("/api/compliance/signatures"),
  createSignature: (data: SignatureRequest) =>
    post<Signature>("/api/compliance/signatures", data),
  verifySignature: (id: string) =>
    get<SignatureVerification>(`/api/compliance/signatures/${id}/verify`),
  getHipaaStatus: () => get<HipaaStatus>("/api/compliance/hipaa/status"),
  getCfrStatus: () => get<CfrStatus>("/api/compliance/cfr/status"),
};

// ---------------------------------------------------------------------------
// Adverse Events (5 endpoints)
// ---------------------------------------------------------------------------

export const adverseEvents = {
  list: () => get<AdverseEvent[]>("/api/adverse-events"),
  create: (data: AdverseEventReport) =>
    post<AdverseEvent>("/api/adverse-events", data),
  get: (id: string) => get<AdverseEvent>(`/api/adverse-events/${id}`),
  export: () => get<{ url: string }>("/api/adverse-events/export"),
  faersSearch: (query: string) =>
    get<FaersResult[]>(
      `/api/adverse-events/faers?q=${encodeURIComponent(query)}`,
    ),
};

// ---------------------------------------------------------------------------
// Equipment Calibration (12 endpoints)
// ---------------------------------------------------------------------------

export const equipment = {
  list: () => get<Equipment[]>("/api/equipment"),
  create: (data: EquipmentCreate) => post<Equipment>("/api/equipment", data),
  get: (id: string) => get<Equipment>(`/api/equipment/${id}`),
  update: (id: string, data: Partial<EquipmentCreate>) =>
    put<Equipment>(`/api/equipment/${id}`, data),
  calibrate: (id: string, data: CalibrationRecord) =>
    post<CalibrationResult>(`/api/equipment/${id}/calibrate`, data),
  getOverdue: () => get<Equipment[]>("/api/equipment/overdue"),
  getHistory: (id: string) =>
    get<CalibrationRecord[]>(`/api/equipment/${id}/history`),
};

// ---------------------------------------------------------------------------
// Medical Device (4 endpoints)
// ---------------------------------------------------------------------------

export const medicalDevice = {
  list: () => get<MedicalDevice[]>("/api/medical-device"),
  register: (data: DeviceRegistration) =>
    post<MedicalDevice>("/api/medical-device", data),
  get: (id: string) => get<MedicalDevice>(`/api/medical-device/${id}`),
  assess: (id: string) =>
    get<DeviceAssessment>(`/api/medical-device/${id}/assess`),
};

// ---------------------------------------------------------------------------
// Vendor Risk (4 endpoints)
// ---------------------------------------------------------------------------

export const vendorRisk = {
  list: () => get<Vendor[]>("/api/vendor-risk/vendors"),
  register: (data: VendorRegistration) =>
    post<Vendor>("/api/vendor-risk/vendors", data),
  get: (id: string) => get<Vendor>(`/api/vendor-risk/vendors/${id}`),
  score: (id: string) =>
    get<VendorRiskScore>(`/api/vendor-risk/vendors/${id}/score`),
};

// ---------------------------------------------------------------------------
// Monitoring (6 endpoints)
// ---------------------------------------------------------------------------

export const monitoring = {
  health: () => get<HealthStatus>("/api/monitoring/health"),
  alerts: () => get<Alert[]>("/api/monitoring/alerts"),
  createAlert: (data: AlertCreate) =>
    post<Alert>("/api/monitoring/alerts", data),
  getAlert: (id: string) => get<Alert>(`/api/monitoring/alerts/${id}`),
  updateAlert: (id: string, data: Partial<AlertCreate>) =>
    put<Alert>(`/api/monitoring/alerts/${id}`, data),
  deleteAlert: (id: string) => del<void>(`/api/monitoring/alerts/${id}`),
};

// ---------------------------------------------------------------------------
// Wizard (7-step compliance setup)
// ---------------------------------------------------------------------------

export const wizard = {
  getProgress: () => get<WizardProgress>("/wizard/progress"),
  getStep: (step: number) => get<WizardStep>(`/wizard/step/${step}`),
  saveStep: (step: number, data: unknown) =>
    post<WizardStep>(`/wizard/step/${step}`, data),
  complete: () => post<WizardCompletion>("/wizard/complete", {}),
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplianceScore {
  overall: number;
  hipaa: number;
  cfr_part11: number;
  gdpr: number;
  last_updated: string;
}

export interface ComplianceStatus {
  compliant: boolean;
  score: number;
  findings: string[];
}

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface Breach {
  id: string;
  type: string;
  severity: string;
  status: string;
  reported_at: string;
  description: string;
}

export interface BreachReport {
  type: string;
  severity: string;
  description: string;
  affected_records?: number;
}

export interface Signature {
  id: string;
  record_id: string;
  signer: string;
  status: string;
  signed_at: string;
}

export interface SignatureRequest {
  record_id: string;
  meaning: string;
}

export interface SignatureVerification {
  valid: boolean;
  signer: string;
  signed_at: string;
}

export interface HipaaStatus {
  compliant: boolean;
  findings: string[];
}

export interface CfrStatus {
  compliant: boolean;
  findings: string[];
}

export interface AdverseEvent {
  id: string;
  patient_id: string;
  drug_name: string;
  event_description: string;
  severity: string;
  outcome: string;
  reported_at: string;
  status: string;
}

export interface AdverseEventReport {
  patient_id: string;
  drug_name: string;
  event_description: string;
  severity: string;
  outcome?: string;
}

export interface FaersResult {
  safety_report_id: string;
  drug_name: string;
  reaction: string;
  serious: boolean;
  outcome: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
  last_calibrated: string;
  next_due: string;
  location: string;
}

export interface EquipmentCreate {
  name: string;
  type: string;
  location: string;
  calibration_interval_days: number;
}

export interface CalibrationRecord {
  date: string;
  technician: string;
  result: string;
  notes?: string;
}

export interface CalibrationResult {
  success: boolean;
  next_due: string;
}

export interface MedicalDevice {
  id: string;
  name: string;
  classification: string;
  status: string;
  registered_at: string;
}

export interface DeviceRegistration {
  name: string;
  classification: string;
  manufacturer: string;
}

export interface DeviceAssessment {
  device_id: string;
  compliant: boolean;
  gamp5_category: string;
  findings: string[];
}

export interface Vendor {
  id: string;
  name: string;
  risk_level: string;
  status: string;
  last_assessed: string;
}

export interface VendorRegistration {
  name: string;
  services: string[];
  data_access_level: string;
}

export interface VendorRiskScore {
  vendor_id: string;
  overall_risk: number;
  categories: Record<string, number>;
}

export interface HealthStatus {
  status: string;
  uptime: number;
  services: Record<string, string>;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  created_at: string;
  resolved: boolean;
}

export interface AlertCreate {
  type: string;
  severity: string;
  message: string;
}

export interface WizardProgress {
  current_step: number;
  total_steps: number;
  completed_steps: number[];
}

export interface WizardStep {
  step: number;
  title: string;
  description: string;
  fields: Record<string, unknown>;
  completed: boolean;
}

export interface WizardCompletion {
  success: boolean;
  message: string;
}
