/**
 * Jupyter Kernel Specs — GET /api/jupyter/kernelspecs
 *
 * Proxies to Jupyter's /api/kernelspecs endpoint and returns the available
 * kernel specifications (Python, Rust/evcxr, etc.).
 */

import { NextResponse } from "next/server";
import { jupyterFetch, JupyterClientError } from "@/lib/jupyter-client";

interface KernelSpecEntry {
  spec: {
    display_name: string;
    language: string;
    argv: string[];
  };
  resources: Record<string, string>;
}

interface JupyterKernelSpecs {
  default: string;
  kernelspecs: Record<string, KernelSpecEntry>;
}

export async function GET() {
  try {
    const specs = await jupyterFetch<JupyterKernelSpecs>("/api/kernelspecs");
    return NextResponse.json(specs);
  } catch (err) {
    if (err instanceof JupyterClientError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Failed to connect to Jupyter";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
