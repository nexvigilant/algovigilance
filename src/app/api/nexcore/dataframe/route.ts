import { type NextRequest } from "next/server";
import { proxyMethodDispatch } from "@/lib/nexcore-proxy";

const DATAFRAME_ENDPOINTS: Record<string, string> = {
  create: "/api/v1/dataframe/create",
  describe: "/api/v1/dataframe/describe",
  filter: "/api/v1/dataframe/filter",
  sort: "/api/v1/dataframe/sort",
  select: "/api/v1/dataframe/select",
  "group-by": "/api/v1/dataframe/group-by",
  join: "/api/v1/dataframe/join",
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(DATAFRAME_ENDPOINTS, request);
}
