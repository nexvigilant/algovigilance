/**
 * Jupyter Status — GET /api/jupyter
 *
 * Proxies to Jupyter's /api/status endpoint and returns version + uptime info.
 * Returns 503 when the Jupyter server is unreachable.
 */

import { NextResponse } from "next/server";
import { jupyterFetch, JupyterClientError } from "@/lib/jupyter-client";

interface JupyterStatus {
  started: string;
  last_activity: string;
  connections: number;
  kernels: number;
}

export async function GET() {
  try {
    const status = await jupyterFetch<JupyterStatus>("/api/status");
    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof JupyterClientError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Failed to connect to Jupyter";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
