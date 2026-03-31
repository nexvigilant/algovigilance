import { type NextRequest } from "next/server";
import { proxyMethodDispatch } from "@/lib/nexcore-proxy";

const HARM_TAXONOMY_ENDPOINTS: Record<string, string> = {
  "harm-types": "/api/v1/vigilance/harm-types",
  classify: "/api/v1/vigilance/harm-classify",
  "risk-score": "/api/v1/vigilance/risk-score",
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(HARM_TAXONOMY_ENDPOINTS, request);
}
