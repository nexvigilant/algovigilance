/**
 * Jupyter Kernels — GET /api/jupyter/kernels
 *
 * Proxies to Jupyter's /api/kernels endpoint and returns the list of
 * currently running kernels with their execution state and last activity.
 */

import { NextResponse } from "next/server";
import { jupyterFetch, JupyterClientError } from "@/lib/jupyter-client";

interface JupyterKernel {
  id: string;
  name: string;
  last_activity: string;
  execution_state: "idle" | "busy" | "starting" | "restarting" | "dead";
  connections: number;
}

export async function GET() {
  try {
    const kernels = await jupyterFetch<JupyterKernel[]>("/api/kernels");
    return NextResponse.json(kernels);
  } catch (err) {
    if (err instanceof JupyterClientError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Failed to connect to Jupyter";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
