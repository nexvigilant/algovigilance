import { type NextRequest } from "next/server";
import { proxyMethodDispatch } from "@/lib/nexcore-proxy";

const COMPLIANCE_ENDPOINTS: Record<string, string> = {
  "audit-events": "/api/v1/compliance/audit/events",
  "audit-query": "/api/v1/compliance/audit/query",
  "gdpr-requests": "/api/v1/compliance/gdpr/requests",
  "gdpr-request": "/api/v1/compliance/gdpr/request",
  "gdpr-consent": "/api/v1/compliance/gdpr/consent",
  "export-screen": "/api/v1/compliance/export/screen",
  "soc2-scorecard": "/api/v1/compliance/soc2/scorecard",
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(COMPLIANCE_ENDPOINTS, request);
}
