import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { NotebookViewer } from "./components/notebook-viewer";

// ---------------------------------------------------------------------------
// Dynamic metadata — derive title from the notebook path
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ path: string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { path } = await params;
  const segments = path ?? [];
  const rawName = segments[segments.length - 1] ?? "Notebook";
  const displayName = rawName.replace(/\.ipynb$/, "").replace(/_/g, " ");

  return createMetadata({
    title: displayName,
    description: `View Jupyter notebook: ${displayName}. Inspect cells, outputs, and results from your analysis sessions.`,
    path: `/nucleus/vigilance/notebooks/${segments.join("/")}`,
    keywords: ["jupyter", "notebook", "analysis", "cells", "outputs"],
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function NotebookViewerPage({ params }: PageProps) {
  const { path } = await params;
  const segments = path ?? [];

  return <NotebookViewer pathSegments={segments} />;
}
