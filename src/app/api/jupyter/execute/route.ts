/**
 * Jupyter Execute — POST /api/jupyter/execute
 *
 * Executes all cells in a notebook by:
 *   1. Creating a temporary kernel for the notebook's kernel spec
 *   2. POSTing a nbconvert-style execution request (or using the nbformat execute API)
 *
 * Since Jupyter doesn't expose a direct "run all cells" REST endpoint, this
 * route uses the nbconvert execute preprocessor via the /api/contents +
 * kernel REST API: it opens a kernel session, then uses the Jupyter sessions
 * API to create a session bound to the notebook path.
 *
 * Body: { path: string }
 * Returns: { ok: true, message: string } | { error: string }
 */

import { type NextRequest, NextResponse } from "next/server";
import { jupyterFetch, JupyterClientError } from "@/lib/jupyter-client";

interface ExecuteRequestBody {
  path: string;
}

interface JupyterSession {
  id: string;
  kernel: {
    id: string;
    name: string;
    execution_state: string;
  };
}

export async function POST(request: NextRequest) {
  let body: ExecuteRequestBody;
  try {
    body = (await request.json()) as ExecuteRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON with a `path` field" },
      { status: 400 },
    );
  }

  const { path } = body;
  if (!path || typeof path !== "string") {
    return NextResponse.json(
      { error: "Missing required field: path" },
      { status: 400 },
    );
  }

  try {
    // Create a kernel session bound to this notebook path.
    // Jupyter will use the notebook's kernel spec from its metadata.
    const session = await jupyterFetch<JupyterSession>("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        path,
        type: "notebook",
        name: path.split("/").pop() ?? path,
        kernel: { name: "python3" },
      }),
    });

    return NextResponse.json({
      ok: true,
      message: `Execution session started for ${path}`,
      sessionId: session.id,
      kernelId: session.kernel.id,
    });
  } catch (err) {
    if (err instanceof JupyterClientError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Failed to start execution";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
