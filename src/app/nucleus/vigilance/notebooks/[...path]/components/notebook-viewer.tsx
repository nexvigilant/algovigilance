"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  FileText,
  Play,
  RotateCcw,
  Download,
  ArrowLeft,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  TechnicalStuffBox,
  WarningBox,
} from "@/components/pv-for-nexvigilants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotebookCell {
  cell_type: "code" | "markdown" | "raw";
  source: string | string[];
  outputs?: CellOutput[];
  execution_count?: number | null;
  metadata?: Record<string, unknown>;
}

interface CellOutput {
  output_type: "stream" | "execute_result" | "display_data" | "error";
  text?: string | string[];
  data?: Record<string, string | string[]>;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

interface NotebookData {
  cells: NotebookCell[];
  metadata: {
    kernelspec?: { display_name: string; name: string; language: string };
    language_info?: { name: string; version: string };
    session_id?: string;
    session_date?: string;
  };
  nbformat: number;
  nbformat_minor: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function joinSource(source: string | string[]): string {
  return Array.isArray(source) ? source.join("") : source;
}

function joinOutputText(text: string | string[] | undefined): string {
  if (!text) return "";
  return Array.isArray(text) ? text.join("") : text;
}

// Strip ANSI escape codes that appear in tracebacks
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function CellSkeleton({ index }: { index: number }) {
  const isCode = index % 3 !== 0;
  return (
    <div
      className={`rounded-xl border border-zinc-800 overflow-hidden animate-pulse ${
        isCode ? "border-l-4 border-l-blue-800/40" : ""
      }`}
    >
      <div
        className={`flex items-center gap-2 px-4 py-2 ${isCode ? "bg-zinc-950" : "bg-zinc-900/30"}`}
      >
        <div className="w-4 h-4 rounded bg-zinc-700" />
        <div className="h-3 w-20 rounded bg-zinc-700" />
        {isCode && <div className="ml-auto h-3 w-8 rounded bg-zinc-800" />}
      </div>
      <div
        className={`px-4 py-4 space-y-2 ${isCode ? "bg-zinc-950" : "bg-zinc-900/20"}`}
      >
        <div className="h-3 rounded bg-zinc-800 w-full" />
        <div className="h-3 rounded bg-zinc-800 w-5/6" />
        {isCode && <div className="h-3 rounded bg-zinc-800 w-3/4" />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error output (collapsible traceback)
// ---------------------------------------------------------------------------

function ErrorOutput({ output }: { output: CellOutput }) {
  const [expanded, setExpanded] = useState(false);
  const traceback = output.traceback ?? [];
  const hasTraceback = traceback.length > 0;

  return (
    <div className="border border-red-900/40 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-red-950/30">
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span className="text-xs font-mono text-red-300 font-medium">
          {output.ename ?? "Error"}
        </span>
        <span className="text-xs text-red-400/70 flex-1 truncate">
          {output.evalue ?? ""}
        </span>
        {hasTraceback && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-colors shrink-0"
            aria-label={expanded ? "Collapse traceback" : "Expand traceback"}
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            Traceback
          </button>
        )}
      </div>
      {expanded && hasTraceback && (
        <pre className="px-3 py-3 text-xs font-mono text-red-300/80 bg-red-950/20 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {traceback.map(stripAnsi).join("\n")}
        </pre>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single output renderer
// ---------------------------------------------------------------------------

function OutputRenderer({ output }: { output: CellOutput }) {
  switch (output.output_type) {
    case "stream": {
      const text = joinOutputText(output.text);
      if (!text) return null;
      return (
        <pre className="text-xs font-mono text-emerald-300/80 whitespace-pre-wrap leading-relaxed px-3 py-2 bg-zinc-900/50 rounded-md overflow-x-auto">
          {text}
        </pre>
      );
    }

    case "execute_result": {
      const plain = joinOutputText(output.data?.["text/plain"]);
      if (!plain) return null;
      return (
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
          <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-x-auto flex-1">
            {plain}
          </pre>
        </div>
      );
    }

    case "display_data": {
      const plain = joinOutputText(output.data?.["text/plain"]);
      const hasHtml = Boolean(output.data?.["text/html"]);
      const hasImage =
        Boolean(output.data?.["image/png"]) ||
        Boolean(output.data?.["image/svg+xml"]);

      return (
        <div className="space-y-1">
          {hasImage && (
            <p className="text-xs text-zinc-500 italic">
              [Image output — open in Jupyter to view]
            </p>
          )}
          {hasHtml && !hasImage && (
            <p className="text-xs text-zinc-500 italic">
              [Rich HTML output — open in Jupyter to view]
            </p>
          )}
          {plain && (
            <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {plain}
            </pre>
          )}
        </div>
      );
    }

    case "error": {
      return <ErrorOutput output={output} />;
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Code cell
// ---------------------------------------------------------------------------

const CodeCell = memo(function CodeCell({
  cell,
  cellIndex,
}: {
  cell: NotebookCell;
  cellIndex: number;
}) {
  const source = joinSource(cell.source);
  const outputs = cell.outputs ?? [];
  const execCount = cell.execution_count;
  const hasOutputs = outputs.length > 0;

  return (
    <div className="rounded-xl border border-zinc-800 border-l-4 border-l-blue-700/50 overflow-hidden">
      {/* Cell header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border-b border-zinc-800/60">
        <Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-xs font-medium text-blue-400/70">Code</span>
        <span className="text-xs text-zinc-600 ml-auto font-mono">
          {execCount != null ? `[${execCount}]` : `[${cellIndex}]`}
        </span>
      </div>

      {/* Source */}
      {source.trim() && (
        <pre className="px-4 py-4 text-xs font-mono text-zinc-200 bg-zinc-950 overflow-x-auto leading-relaxed whitespace-pre">
          <code>{source}</code>
        </pre>
      )}

      {/* Outputs */}
      {hasOutputs && (
        <div className="border-t border-green-900/20 bg-zinc-900 px-4 py-3 space-y-2 border-l-4 border-l-green-700/30 ml-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Terminal className="w-3 h-3 text-zinc-500" />
            <span className="text-xs text-zinc-500">Output</span>
          </div>
          {outputs.map((output, i) => (
            <OutputRenderer key={i} output={output} />
          ))}
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Markdown cell
// ---------------------------------------------------------------------------

const MarkdownCell = memo(function MarkdownCell({
  cell,
}: {
  cell: NotebookCell;
}) {
  const source = joinSource(cell.source);
  if (!source.trim()) return null;

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      {/* Cell header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/40">
        <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-medium text-zinc-500">Markdown</span>
      </div>

      {/* Content — whitespace-pre-wrap for now, no parser dep */}
      <div className="px-5 py-4 bg-zinc-900/30">
        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
          {source}
        </p>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Raw cell
// ---------------------------------------------------------------------------

const RawCell = memo(function RawCell({ cell }: { cell: NotebookCell }) {
  const source = joinSource(cell.source);
  if (!source.trim()) return null;

  return (
    <div className="rounded-xl border border-zinc-800 border-dashed overflow-hidden opacity-60">
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/30 border-b border-zinc-800/40">
        <FileText className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
        <span className="text-xs font-medium text-zinc-600">Raw</span>
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-zinc-500 whitespace-pre-wrap leading-relaxed overflow-x-auto">
        {source}
      </pre>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Cell dispatcher
// ---------------------------------------------------------------------------

const Cell = memo(function Cell({
  cell,
  cellIndex,
  codeIndex,
}: {
  cell: NotebookCell;
  cellIndex: number;
  codeIndex: number;
}) {
  switch (cell.cell_type) {
    case "code":
      return <CodeCell cell={cell} cellIndex={codeIndex} />;
    case "markdown":
      return <MarkdownCell cell={cell} />;
    case "raw":
      return <RawCell cell={cell} />;
    default:
      return null;
  }
});

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function NotebookHeader({
  notebookName,
  notebookData,
  lastModified,
}: {
  notebookName: string;
  notebookData: NotebookData | null;
  lastModified: string | null;
}) {
  const kernelName =
    notebookData?.metadata?.kernelspec?.display_name ??
    notebookData?.metadata?.language_info?.name ??
    null;

  const modDate = lastModified
    ? new Date(lastModified).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const displayName = notebookName.replace(/\.ipynb$/, "").replace(/_/g, " ");
  const cellCount = notebookData?.cells.length ?? 0;

  return (
    <div className="border-b border-zinc-800 pb-6 mb-6 space-y-4">
      {/* Back link */}
      <Link
        href="/nucleus/vigilance/notebooks"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Notebook Lab
      </Link>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <BookOpen className="w-6 h-6 text-amber-400 shrink-0" />
            <h1 className="text-2xl font-bold text-zinc-100 truncate">
              {displayName}
            </h1>
            {kernelName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                <Terminal className="w-3 h-3" />
                {kernelName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>{cellCount} cells</span>
            {modDate && <span>Modified {modDate}</span>}
          </div>
        </div>

        {/* Action buttons — wired later */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled
            title="Run All (coming soon)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-500 cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" />
            Run All
          </button>
          <button
            disabled
            title="Restart & Run All (coming soon)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-500 cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
          <button
            disabled
            title="Export (coming soon)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-xs text-zinc-500 cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main viewer
// ---------------------------------------------------------------------------

export function NotebookViewer({ pathSegments }: { pathSegments: string[] }) {
  const [notebookData, setNotebookData] = useState<NotebookData | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notebookPath = pathSegments.join("/");
  const notebookName = pathSegments[pathSegments.length - 1] ?? "Notebook";

  const fetchNotebook = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const encodedPath = encodeURIComponent(notebookPath);
      const res = await fetch(
        `/api/jupyter/contents?path=${encodedPath}&content=1`,
      );

      if (!res.ok) {
        throw new Error(
          `Failed to load notebook: ${res.status} ${res.statusText}`,
        );
      }

      const json = (await res.json()) as {
        content?: NotebookData;
        last_modified?: string;
        name?: string;
      };

      if (!json.content || !json.content.cells) {
        throw new Error("Response does not contain valid notebook content");
      }

      setNotebookData(json.content);
      setLastModified(json.last_modified ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notebook");
    } finally {
      setLoading(false);
    }
  }, [notebookPath]);

  useEffect(() => {
    fetchNotebook();
  }, [fetchNotebook]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 space-y-3">
          <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
          <div className="h-8 w-96 rounded bg-zinc-800 animate-pulse" />
          <div className="h-3 w-48 rounded bg-zinc-800 animate-pulse" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CellSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link
          href="/nucleus/vigilance/notebooks"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notebook Lab
        </Link>
        <WarningBox>
          <strong>Could not load notebook.</strong> {error}
          <br />
          <span className="text-xs mt-1 block">
            Path:{" "}
            <code className="px-1 py-0.5 bg-zinc-800 rounded">
              {notebookPath}
            </code>
          </span>
        </WarningBox>
        <button
          onClick={fetchNotebook}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm text-zinc-300 transition-colors"
        >
          <Loader2 className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // ── Notebook content ───────────────────────────────────────────────────────
  if (!notebookData) return null;

  // Build code-cell index (for execution_count display)
  let codeCounter = 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <NotebookHeader
        notebookName={notebookName}
        notebookData={notebookData}
        lastModified={lastModified}
      />

      {/* Format info */}
      <div className="mb-6">
        <TechnicalStuffBox>
          <span className="text-sm">
            Notebook format v{notebookData.nbformat}.
            {notebookData.nbformat_minor} &middot; {notebookData.cells.length}{" "}
            total cells &middot;{" "}
            {notebookData.cells.filter((c) => c.cell_type === "code").length}{" "}
            code cells &middot;{" "}
            {
              notebookData.cells.filter((c) => c.cell_type === "markdown")
                .length
            }{" "}
            markdown cells
          </span>
        </TechnicalStuffBox>
      </div>

      {/* Cells */}
      <div className="space-y-4">
        {notebookData.cells.map((cell, i) => {
          if (cell.cell_type === "code") {
            codeCounter += 1;
          }
          return (
            <Cell key={i} cell={cell} cellIndex={i} codeIndex={codeCounter} />
          );
        })}
      </div>

      {/* Footer */}
      {notebookData.cells.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <BookOpen className="w-10 h-10 text-zinc-700 mb-4" />
          <p className="text-sm text-zinc-500">This notebook has no cells.</p>
        </div>
      )}
    </div>
  );
}
