/**
 * Jupyter Contents — GET /api/jupyter/contents
 *
 * Proxies to Jupyter's /api/contents endpoint. Supports:
 *   - GET /api/jupyter/contents?path=<dir>   List directory or get file metadata
 *   - GET /api/jupyter/contents?path=<nb>&download=true  Download raw notebook JSON
 *
 * The `path` query param maps to the Jupyter contents path. If omitted,
 * lists the root directory.
 */

import { type NextRequest, NextResponse } from "next/server";
import { jupyterFetch, contentPath, JupyterClientError } from "@/lib/jupyter-client";

interface ContentItem {
  name: string;
  path: string;
  size: number | null;
  last_modified: string;
  type: "notebook" | "directory" | "file";
  content: unknown;
}

interface ContentsResponse {
  name: string;
  path: string;
  type: string;
  content: ContentItem[] | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path") ?? "";
  const download = searchParams.get("download") === "true";

  try {
    const apiPath = path
      ? contentPath(path)
      : "/api/contents";

    const data = await jupyterFetch<ContentsResponse>(
      download ? `${apiPath}?format=json&content=1` : apiPath,
    );

    if (download) {
      // Return raw notebook JSON as a downloadable file
      const filename = path.split("/").pop() ?? "notebook.ipynb";
      return new NextResponse(JSON.stringify(data.content, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof JupyterClientError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Failed to connect to Jupyter";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
